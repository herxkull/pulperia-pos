"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function processTransformation(data: {
  rawProductId: number;
  rawQuantity: number;
  finishedProductId: number;
  finishedQuantity: number;
  storeId: string;
}) {
  const { rawProductId, rawQuantity, finishedProductId, finishedQuantity, storeId } = data;

  try {
    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Paso A: Busca el producto de origen (Materia prima).
      const rawProduct = await tx.product.findUnique({
        where: { id: rawProductId }
      });

      if (!rawProduct) {
        throw new Error(`Producto de origen (ID: ${rawProductId}) no encontrado.`);
      }

      if (rawProduct.stock < rawQuantity) {
        throw new Error(
          `Stock insuficiente de la materia prima "${rawProduct.name}". Disponible: ${rawProduct.stock} ${rawProduct.unitName}, Requerido: ${rawQuantity} ${rawProduct.unitName}`
        );
      }

      // Calcula el costo total de la inversión: totalCost = rawQuantity * origen.cost.
      const totalCostApplied = rawQuantity * rawProduct.cost;

      // Paso B: Descuenta rawQuantity del stock del producto de origen.
      await tx.product.update({
        where: { id: rawProductId },
        data: { stock: { decrement: rawQuantity } }
      });

      // Paso C: Busca el producto destino (Producto terminado).
      const finishedProduct = await tx.product.findUnique({
        where: { id: finishedProductId }
      });

      if (!finishedProduct) {
        throw new Error(`Producto terminado (ID: ${finishedProductId}) no encontrado.`);
      }

      // Paso D (La Matemática): Calcula el nuevo costo unitario del producto destino.
      // Fórmula recomendada (Costo Promedio Ponderado):
      // nuevoCosto = ((destino.stock * destino.cost) + totalCost) / (destino.stock + finishedQuantity)
      // Si el stock actual es 0 o negativo, simplemente usa: nuevoCosto = totalCost / finishedQuantity.
      let newCost = 0;
      if (finishedProduct.stock <= 0) {
        newCost = totalCostApplied / finishedQuantity;
      } else {
        newCost = ((finishedProduct.stock * finishedProduct.cost) + totalCostApplied) / (finishedProduct.stock + finishedQuantity);
      }

      // Paso E: Suma finishedQuantity al stock del producto destino y actualiza su campo cost con el nuevoCosto.
      await tx.product.update({
        where: { id: finishedProductId },
        data: {
          stock: { increment: finishedQuantity },
          cost: newCost
        }
      });

      // Paso F: Crea el registro de auditoría en la tabla ProductTransformation.
      const transformation = await tx.productTransformation.create({
        data: {
          storeId,
          rawProductId,
          rawQuantity,
          finishedProductId,
          finishedQuantity,
          totalCostApplied
        },
        include: {
          rawProduct: true,
          finishedProduct: true
        }
      });

      return transformation;
    });

    revalidatePath("/inventory");
    revalidatePath("/");

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error en processTransformation:", error);
    return { success: false, error: error.message || "Error al procesar la transformación de inventario." };
  }
}

export async function getProductTransformations(storeId: string = "test-store-123") {
  try {
    return await (prisma as any).productTransformation.findMany({
      where: { storeId },
      include: {
        rawProduct: true,
        finishedProduct: true
      },
      orderBy: { date: "desc" }
    });
  } catch (error) {
    console.error("Error al obtener transformaciones de productos:", error);
    return [];
  }
}
