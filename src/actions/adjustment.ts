"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAdjustment(data: {
  storeId: string;
  type: string; // CONSUMO, MERMA, VENCIDO
  reason?: string;
  items: { productId: number; quantity: number; isPackage?: boolean }[];
}) {
  try {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: "No se agregaron productos para el ajuste." };
    }

    return await prisma.$transaction(async (tx) => {
      let totalCost = 0;
      const itemsToCreate = [];

      for (const item of data.items) {
        // Obtener el costo unitario y unidades por paquete del producto (con aislamiento de inquilino)
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId: data.storeId },
          select: { cost: true, unitsPerPackage: true, name: true, stock: true }
        });

        if (!product) {
          throw new Error(`El producto con ID ${item.productId} no existe.`);
        }

        const unitsPerPkg = product.unitsPerPackage || 1;
        const actualQuantity = item.isPackage ? (item.quantity * unitsPerPkg) : item.quantity;

        // Validar que haya suficiente stock disponible para realizar la salida
        if (product.stock < actualQuantity) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock} unidades, solicitado: ${actualQuantity} unidades.`);
        }

        const itemTotalCost = actualQuantity * product.cost;
        totalCost += itemTotalCost;

        itemsToCreate.push({
          storeId: data.storeId,
          productId: item.productId,
          quantity: actualQuantity,
          unitCost: product.cost
        });

        // Restar la cantidad de stock del producto de forma unitaria
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: actualQuantity }
          }
        });
      }

      // Crear el registro principal del Ajuste de Inventario con sus ítems asociados
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          storeId: data.storeId,
          type: data.type,
          reason: data.reason || null,
          totalCost: totalCost,
          items: {
            create: itemsToCreate
          }
        }
      });

      // Revalidar las rutas afectadas para que el inventario se actualice en la UI inmediatamente
      revalidatePath("/inventory");
      revalidatePath("/adjustments");
      revalidatePath("/");

      return { success: true, adjustmentId: adjustment.id };
    });
  } catch (error: any) {
    console.error("Error al procesar ajuste de inventario:", error);
    return { success: false, error: error.message || "Error interno al procesar el ajuste de inventario." };
  }
}

export async function getAdjustments(storeId: string) {
  return await prisma.inventoryAdjustment.findMany({
    where: { storeId },
    orderBy: { date: 'desc' },
    include: {
      items: {
        include: { product: true }
      }
    }
  });
}
