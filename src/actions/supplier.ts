"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSuppliers() {
  return await (prisma as any).supplier.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createSupplier(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  visitDay?: string;
}) {
  const supplier = await (prisma as any).supplier.create({
    data,
  });
  revalidatePath("/inventory");
  revalidatePath("/purchases");
  revalidatePath("/suppliers");
  return supplier;
}

export async function updateSupplier(id: number, data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  visitDay?: string;
}) {
  const supplier = await (prisma as any).supplier.update({
    where: { id },
    data,
  });
  revalidatePath("/inventory");
  revalidatePath("/purchases");
  revalidatePath("/suppliers");
  return supplier;
}

export async function getSupplierById(id: number) {
  return await (prisma as any).supplier.findUnique({
    where: { id },
    include: {
      products: {
        include: { category: true }
      },
      purchases: {
        include: { items: { include: { product: true } } },
        orderBy: { date: 'desc' }
      }
    }
  });
}

export async function deleteSupplier(id: number) {
  const productsCount = await prisma.product.count({ where: { supplierId: id } } as any);
  if (productsCount > 0) {
    throw new Error("No se puede eliminar un proveedor que tiene productos asociados.");
  }

  await (prisma as any).supplier.delete({
    where: { id },
  });
  revalidatePath("/suppliers");
}
