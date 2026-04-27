"use server";

import prisma from "@/lib/prisma";

export async function addPurchase(items: { productId: number; quantity: number; unitCost: number }[], supplier: string) {
  let totalCost = 0;
  
  // Create the purchase
  const purchase = await prisma.purchase.create({
    data: {
      supplier,
      totalCost: 0, // we will update this
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
    }
  });

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { totalCost }
  });

  // Update inventory stock and optionally the current cost of the product
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { increment: item.quantity },
        cost: item.unitCost // Update the product's default cost to the newest purchase cost
      }
    });
  }

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
