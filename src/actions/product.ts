"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts(query?: string) {
  return await prisma.product.findMany({
    where: query ? {
      OR: [
        { name: { contains: query } },
        { barcode: { contains: query } },
      ],
    } : undefined,
    include: { category: true, supplier: true },
    orderBy: { createdAt: 'desc' },
  } as any);
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    include: { category: true, supplier: true }
  } as any);
  return products.filter(p => p.stock <= p.minStock);
}

export async function getProductByBarcode(barcode: string) {
  return await prisma.product.findUnique({
    where: { barcode },
  });
}

export async function createProduct(data: {
  barcode?: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit?: string;
  categoryId?: number;
  supplierId?: number;
}) {
  const product = await prisma.product.create({
    data: {
      ...data,
      barcode: data.barcode || null,
    },
  });
  revalidatePath("/inventory");
  revalidatePath("/");
  return product;
}

export async function updateProduct(id: number, data: {
  barcode?: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit?: string;
  categoryId?: number;
  supplierId?: number;
}) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      barcode: data.barcode || null,
    },
  });
  revalidatePath("/inventory");
  revalidatePath("/");
  return product;
}

export async function deleteProduct(id: number) {
  await prisma.product.delete({
    where: { id },
  });
  revalidatePath("/inventory");
  revalidatePath("/");
}

export async function registerAdjustment(data: {
  productId: number;
  quantity: number;
  reason: string;
}) {
  await prisma.$transaction([
    prisma.product.update({
      where: { id: data.productId },
      data: { stock: { increment: data.quantity } },
    }),
    (prisma as any).stockAdjustment.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        reason: data.reason,
      }
    })
  ]);
  revalidatePath("/inventory");
}

export async function getInventoryValuation() {
  const products = await prisma.product.findMany();

  const totalCost = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

  return {
    totalCost,
    totalValue,
    totalItems,
    expectedProfit: totalValue - totalCost
  };
}
