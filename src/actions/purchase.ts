"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPurchase(items: { productId: number; quantity: number; unitCost: number }[], supplierId?: number) {
  let totalCost = 0;
  
  // Calculate total cost first to use it in expense
  items.forEach(i => { totalCost += i.quantity * i.unitCost; });

  // 1. Check for open shift to record as expense
  const openShift = await (prisma as any).shift.findFirst({ where: { status: "OPEN" } });

  // 2. Create the purchase and items in a transaction or sequential
  const purchase = await (prisma as any).purchase.create({
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

  // 3. If there is an open shift, record this purchase as an expense in that shift
  if (openShift) {
    await (prisma as any).expense.create({
      data: {
        description: `Compra de mercadería - Lote #${purchase.id}`,
        amount: totalCost,
        shiftId: openShift.id,
        date: new Date()
      }
    });
  }

  // 4. Update inventory stock and cost
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
  revalidatePath("/purchases");
  revalidatePath("/cash-register");
  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true };
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
