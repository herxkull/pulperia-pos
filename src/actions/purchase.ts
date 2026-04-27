"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPurchase(items: { productId: number; quantity: number; unitCost: number }[], supplierId?: number) {
  let totalCost = 0;
  
  // Create the purchase
  const purchase = await prisma.purchase.create({
    data: {
      supplierId: supplierId || null,
      totalCost: 0, 
      items: {
        create: items.map(i => {
          totalCost += i.quantity * i.unitCost;
          return {
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost
          };
        })
      }
    } as any
  });

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { totalCost }
  });

  // Update inventory stock and cost
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { increment: item.quantity },
        cost: item.unitCost 
      }
    });
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/purchases");
  revalidatePath("/");
  return { success: true };
}

export async function getRecentPurchases() {
  return await prisma.purchase.findMany({
    orderBy: { date: 'desc' },
    take: 20,
    include: {
      items: {
        include: { product: true }
      }
    }
  });
}
