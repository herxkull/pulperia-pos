"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const storeId = "test-store-123";

export async function getCustomers(query?: string) {
  return await prisma.customer.findMany({
    where: {
      storeId,
      ...(query ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  creditLimit: number;
}) {
  const customer = await prisma.customer.create({
    data: {
      ...data,
      storeId,
      phone: data.phone || null,
      currentDebt: 0,
    },
  });
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: number, data: {
  name: string;
  phone?: string;
  creditLimit: number;
}) {
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...data,
      phone: data.phone || null,
    },
  });
  revalidatePath("/customers");
  return customer;
}

export async function registerPayment(id: number, amount: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar turno abierto
    const openShift = await (tx as any).shift.findFirst({
      where: { status: "OPEN", storeId }
    });

    if (!openShift) {
      throw new Error("Debe abrir un turno para recibir pagos");
    }

    // 2. Buscar cliente
    const customer = await tx.customer.findUnique({ where: { id } });
    if (!customer) throw new Error("Cliente no encontrado");

    const newDebt = Math.max(0, customer.currentDebt - amount);

    // 3. Actualizar deuda del cliente
    await tx.customer.update({
      where: { id },
      data: { currentDebt: newDebt },
    });

    // 4. Crear el abono vinculado al turno
    await (tx as any).creditPayment.create({
      data: {
        storeId,
        customerId: id,
        shiftId: openShift.id,
        amount: amount,
      }
    });

    revalidatePath("/customers");
    revalidatePath("/cash-register");
    revalidatePath("/");
    
    return { success: true };
  });
}

/**
 * Obtiene el historial de abonos de un cliente
 */
export async function getCustomerPayments(customerId: number) {
  return await (prisma as any).creditPayment.findMany({
    where: { customerId, storeId },
    orderBy: { date: 'desc' },
  });
}

/**
 * Obtiene el historial de compras (ventas) de un cliente
 */
export async function getCustomerSales(customerId: number) {
  return await (prisma as any).sale.findMany({
    where: { 
      customerId,
      status: "COMPLETED" // Solo ventas válidas
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { date: 'desc' },
  });
}
