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
    const now = new Date().toISOString();

    // Buscar turno abierto para vincular la venta
    const openShift = await (prisma as any).shift.findFirst({
      where: { status: "OPEN" }
    });

    // 1. Ejecutar Transacción con consultas SQL crudas para saltar validación de cliente desactualizado
    const saleId = await prisma.$transaction(async (tx) => {
      // 1.1 Insertar venta vía SQL crudo (añadimos receivedAmount)
      await tx.$executeRawUnsafe(
        `INSERT INTO Sale (ticketNumber, total, receivedAmount, date, paymentMethod, status, customerId, shiftId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ticketNumber,
        Number(data.total),
        data.receivedAmount ? Number(data.receivedAmount) : null,
        now,
        paymentMethod,
        status,
        data.customerId ? Number(data.customerId) : null,
        openShift?.id || null
      );

      // 1.2 Obtener el ID de la venta recién creada
      const [{ id }] = await tx.$queryRawUnsafe(`SELECT last_insert_rowid() as id`) as any;

      // 1.3 Insertar items
      for (const item of data.items) {
        await (tx as any).saleItem.create({
          data: {
            saleId: Number(id),
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
          }
        });

        // 1.4 Descontar Stock
        await (tx as any).product.update({
          where: { id: Number(item.productId) },
          data: { stock: { decrement: Number(item.quantity) } }
        });
      }

      // 1.5 Actualizar Deuda
      if (data.paymentMethod === "Crédito" && data.customerId) {
        await (tx as any).customer.update({
          where: { id: Number(data.customerId) },
          data: { currentDebt: { increment: Number(data.total) } }
        });
      }

      return id;
    });

    revalidatePath("/pos");
    revalidatePath("/sales");
    revalidatePath("/reports");

    return { success: true, saleId: Number(saleId) };

  } catch (error: any) {
    console.error("ERROR CRÍTICO SQL:", error);
    return { success: false, error: "Error al procesar la venta. Verifique los datos e intente nuevamente." };
  }
}
