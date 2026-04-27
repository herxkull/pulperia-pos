"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExpenses(shiftId?: number) {
  return await (prisma as any).expense.findMany({
    where: shiftId ? { shiftId } : undefined,
    include: { shift: true },
    orderBy: { date: 'desc' },
  });
}

export async function createExpense(data: {
  description: string;
  amount: number;
  shiftId: number;
}) {
  const expense = await (prisma as any).expense.create({
    data: {
      description: data.description,
      amount: data.amount,
      shiftId: data.shiftId,
    },
  });

  revalidatePath("/cash-register");
  revalidatePath("/expenses");
  revalidatePath("/");
  return expense;
}

export async function addExpense(description: string, amount: number) {
  const openShift = await (prisma as any).shift.findFirst({ where: { status: "OPEN" } });
  if (!openShift) return { success: false, error: "No hay un turno de caja abierto." };

  try {
    await createExpense({ description, amount, shiftId: openShift.id });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al registrar gasto." };
  }
}

export async function deleteExpense(id: number) {
  const expense = await (prisma as any).expense.delete({
    where: { id },
  });
  revalidatePath("/cash-register");
  revalidatePath("/expenses");
  revalidatePath("/");
  return expense;
}
