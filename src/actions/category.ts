"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  return await (prisma as any).category.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(name: string) {
  const category = await (prisma as any).category.create({
    data: { name },
  });
  revalidatePath("/inventory");
  revalidatePath("/pos");
  return category;
}

export async function deleteCategory(id: number) {
  // Solo borrar si no hay productos asociados
  const productsCount = await prisma.product.count({
    where: { categoryId: id },
  } as any);
  
  if (productsCount > 0) {
    throw new Error("No se puede eliminar una categoría que tiene productos asociados.");
  }

  await (prisma as any).category.delete({
    where: { id },
  });
  revalidatePath("/inventory");
  revalidatePath("/pos");
}
