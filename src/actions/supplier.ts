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
}) {
  const supplier = await (prisma as any).supplier.create({
    data,
  });
  revalidatePath("/inventory");
  revalidatePath("/purchases");
  return supplier;
}

export async function updateSupplier(id: number, data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  const supplier = await (prisma as any).supplier.update({
    where: { id },
    data,
  });
  revalidatePath("/inventory");
  revalidatePath("/purchases");
  return supplier;
}

export async function deleteSupplier(id: number) {
  // Verificar si tiene productos o compras
  const productsCount = await prisma.product.count({ where: { supplierId: id } } as any);
  if (productsCount > 0) {
    throw new Error("No se puede eliminar un proveedor que tiene productos asociados.");
  }

  await (prisma as any).supplier.delete({
    where: { id },
  });
  revalidatePath("/suppliers");
}
