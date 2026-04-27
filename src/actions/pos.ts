"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function processSale(data: {
  total: number;
  customerId?: number | null;
  items: { productId: number; quantity: number; price: number }[];
  paymentMethod: "Efectivo" | "Tarjeta" | "Crédito" | "Transferencia";
}) {
  // Validar stock antes de procesar
  for (const item of data.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.stock < item.quantity) {
      throw new Error(`Stock insuficiente para el producto ID ${item.productId}`);
    }
  }

  // Crear la venta y actualizar stock y deuda en una transacción
  const sale = await prisma.$transaction(async (tx) => {
    // 0. Buscar turno abierto
    const openShift = await (tx as any).shift.findFirst({ where: { status: "OPEN" } });

    // 1. Crear Venta
    const newSale = await (tx as any).sale.create({
      data: {
        total: data.total,
        customerId: data.customerId,
        paymentMethod: data.paymentMethod,
        shiftId: openShift?.id,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    // 2. Descontar Stock
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 3. Aumentar deuda si es crédito
    if (data.paymentMethod === "Crédito" && data.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) throw new Error("Cliente no encontrado");
      
      const newDebt = customer.currentDebt + data.total;
      if (newDebt > customer.creditLimit) {
        throw new Error("La venta excede el límite de crédito del cliente");
      }

      await tx.customer.update({
        where: { id: data.customerId },
        data: { currentDebt: newDebt },
      });
    }

    return newSale;
  });

  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  
  return sale;
}
