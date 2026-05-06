"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSalesHistory(filters: {
  startDate?: string;
  endDate?: string;
  status?: string;
  ticketNumber?: string;
  shiftId?: number;
}) {
  const where: any = { storeId: "test-store-123" };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.ticketNumber) {
    where.ticketNumber = { contains: filters.ticketNumber };
  }

  if (filters.shiftId) {
    where.shiftId = filters.shiftId;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  return await prisma.sale.findMany({
    where,
    include: {
      items: {
        include: {
          product: true
        }
      },
      customer: true,
      shift: true
    },
    orderBy: {
      date: 'desc'
    }
  });
}

export async function voidSale(saleId: number) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Obtener la venta con sus items
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: true, shift: true }
    });

    if (!sale) throw new Error("Venta no encontrada");
    if ((sale as any).status === "VOIDED") throw new Error("La venta ya ha sido anulada");

    // 2. Cambiar status a VOIDED
    await (tx as any).sale.update({
      where: { id: saleId },
      data: { status: "VOIDED" }
    });

    // 3. Devolver Stock
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });
    }

    // 4. Si fue crédito, restar deuda del cliente
    if (sale.paymentMethod === "CREDIT" && sale.customerId) {
      await tx.customer.update({
        where: { id: sale.customerId },
        data: { currentDebt: { decrement: sale.total } }
      });
    }

    // 5. Si fue efectivo y el turno está abierto, ajustar ingresos esperados (opcional según lógica de negocio)
    if (sale.paymentMethod === "CASH" && sale.shiftId && sale.shift?.status === "OPEN") {
      // Ajustes adicionales si son requeridos por tu modelo de negocio
    }

    return { success: true };
  });

  revalidatePath("/reports");
  revalidatePath("/inventory");
  revalidatePath("/cash-register");
  revalidatePath("/sales");
  revalidatePath("/");

  return result;
}


