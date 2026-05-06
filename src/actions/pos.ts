"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function processSale(data: {
  total: number;
  receivedAmount?: number;
  customerId?: number | null;
  items: { productId: number; quantity: number; price: number }[];
  paymentMethod: "Efectivo" | "Tarjeta" | "Crédito" | "Transferencia";
}) {
  try {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: "El carrito está vacío" };
    }

    const mapping: Record<string, string> = {
      "Efectivo": "CASH",
      "Tarjeta": "CARD",
      "Transferencia": "TRANSFER",
      "Crédito": "CREDIT"
    };

    const paymentMethod = mapping[data.paymentMethod] || "CASH";
    const status = "COMPLETED";
    const ticketNumber = `T${Math.floor(Date.now() / 1000)}${Math.floor(Math.random() * 100)}`;
    const storeId = "test-store-123"; // Identificador de la tienda de pruebas

    // Buscar turno abierto para vincular la venta
    const openShift = await (prisma as any).shift.findFirst({
      where: { status: "OPEN", storeId }
    });

    // Crear la venta usando el ORM de Prisma estándar (compatible con PostgreSQL)
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Insertar venta y sus items de forma atómica en Prisma
      const createdSale = await tx.sale.create({
        data: {
          storeId,
          ticketNumber,
          total: Number(data.total),
          receivedAmount: data.receivedAmount ? Number(data.receivedAmount) : null,
          paymentMethod,
          status,
          customerId: data.customerId ? Number(data.customerId) : null,
          shiftId: openShift?.id || null,
          items: {
            create: data.items.map(item => ({
              storeId,
              productId: Number(item.productId),
              quantity: Number(item.quantity),
              price: Number(item.price)
            }))
          }
        }
      });

      // 2. Descontar Stock del producto
      for (const item of data.items) {
        await tx.product.update({
          where: { id: Number(item.productId) },
          data: { stock: { decrement: Number(item.quantity) } }
        });
      }

      // 3. Si fue crédito, incrementar la deuda del cliente
      if (data.paymentMethod === "Crédito" && data.customerId) {
        await tx.customer.update({
          where: { id: Number(data.customerId) },
          data: { currentDebt: { increment: Number(data.total) } }
        });
      }

      return createdSale;
    });

    revalidatePath("/pos");
    revalidatePath("/sales");
    revalidatePath("/reports");

    return { success: true, saleId: Number(sale.id) };

  } catch (error: any) {
    console.error("ERROR AL PROCESAR VENTA POSTGRES:", error);
    return { success: false, error: "Error al procesar la venta. Verifique los datos e intente nuevamente." };
  }
}
