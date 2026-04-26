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
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany();
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
