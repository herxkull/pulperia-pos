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
  const storeId = "test-store-123"; // Identificador de la tienda de pruebas

  const result = await prisma.$transaction(async (tx) => {
    // 1. Obtener la venta con sus items y productos asociados (con aislamiento de inquilino)
    const sale = await tx.sale.findFirst({
      where: { id: saleId, storeId },
      include: { 
        items: {
          include: { product: true }
        }, 
        shift: true 
      }
    });

    if (!sale) throw new Error("Venta no encontrada o no pertenece a esta tienda");
    if ((sale as any).status === "VOIDED") throw new Error("La venta ya ha sido anulada");

    // 2. Cambiar status a VOIDED (con aislamiento de inquilino)
    await tx.sale.update({
      where: { id: saleId },
      data: { status: "VOIDED" }
    });

    // 3. Devolver Stock (SÓLO si trackStock es true, con cálculo inteligente para recargas)
    for (const item of sale.items) {
      const product = item.product;
      if (product && product.trackStock) {
        const isRecharge = product.barcode?.startsWith("SERV_") || product.unitName === "Servicio" || product.unit === "Servicio";
        const incrementAmount = isRecharge ? (Number(item.quantity) * Number(item.price)) : Number(item.quantity);

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: incrementAmount } }
        });
      }
    }

    // 4. Si fue crédito, restar deuda del cliente de esta tienda
    if (sale.paymentMethod === "CREDIT" && sale.customerId) {
      await tx.customer.update({
        where: { id: sale.customerId, storeId },
        data: { currentDebt: { decrement: sale.total } }
      });
    }

    // 5. Si fue efectivo y el turno está abierto, ajustar ingresos esperados (Arqueo Matemático Exacto)
    if (sale.paymentMethod === "CASH" && sale.shiftId && sale.shift?.status === "OPEN") {
      await (tx as any).shift.update({
        where: { id: sale.shiftId, storeId },
        data: { expectedCash: { decrement: sale.total } }
      });
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


