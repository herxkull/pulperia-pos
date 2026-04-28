"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPurchase(
  items: { productId: number; quantity: number; unitCost: number; isPackage?: boolean }[], 
  supplierId?: number,
  payFromCash: boolean = false
) {
  return await prisma.$transaction(async (tx) => {
    let totalCost = 0;
    items.forEach(i => { totalCost += i.quantity * i.unitCost; });

    // 1. Get supplier name if exists for the description
    let supplierName = "Proveedor Desconocido";
    if (supplierId) {
      const supplier = await (tx as any).supplier.findUnique({ where: { id: supplierId } });
      if (supplier) supplierName = supplier.name;
    }

    // 2. Create the purchase
    const purchase = await (tx as any).purchase.create({
      data: {
        supplierId: supplierId || null,
        totalCost, 
        items: {
          create: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost
          }))
        }
      }
    });

    // 3. Handle Expense if payFromCash is true
    if (payFromCash) {
      const openShift = await (tx as any).shift.findFirst({ where: { status: "OPEN" } });
      if (openShift) {
        await (tx as any).expense.create({
          data: {
            description: `Compra de mercadería - ${supplierName} (Lote #${purchase.id})`,
            amount: totalCost,
            category: "INVENTORY_PURCHASE",
            purchaseId: purchase.id,
            shiftId: openShift.id,
            date: new Date()
          }
        });
      }
    }

    // 4. Update inventory stock and cost
    for (const item of items) {
      const product = await (tx as any).product.findUnique({
        where: { id: item.productId },
        select: { unitsPerPackage: true }
      });

      const unitsPerPkg = product?.unitsPerPackage || 1;
      const actualQuantity = item.isPackage ? (item.quantity * unitsPerPkg) : item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: actualQuantity },
          cost: item.unitCost / (item.isPackage ? unitsPerPkg : 1) // Store cost per unit
        }
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/purchases");
    revalidatePath("/cash-register");
    revalidatePath("/expenses");
    revalidatePath("/");

    return { success: true };
  });
}

export async function getRecentPurchases() {
  return await (prisma as any).purchase.findMany({
    orderBy: { date: 'desc' },
    take: 20,
    include: {
      items: {
        include: { product: true }
      },
      supplier: true
    }
  });
}
