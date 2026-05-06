"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const storeId = "test-store-123"; // Identificador de la tienda de pruebas (Multi-Tenant)

export async function getExpenses(shiftId?: number) {
  return await prisma.expense.findMany({
    where: {
      storeId,
      ...(shiftId ? { shiftId } : {})
    },
    include: { shift: true },
    orderBy: { date: 'desc' },
  });
}

export async function createExpense(data: {
  description: string;
  amount: number;
  shiftId: number;
  subCategory?: string;
}) {
  const result = await prisma.expense.create({
    data: {
      storeId,
      description: data.description,
      amount: Number(data.amount),
      category: "OPERATIONAL_EXPENSE",
      subCategory: data.subCategory || null,
      shiftId: Number(data.shiftId),
    }
  });

  revalidatePath("/cash-register");
  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true, expense: result };
}

export async function addExpense(description: string, amount: number, subCategory?: string) {
  const openShift = await prisma.shift.findFirst({
    where: { status: "OPEN", storeId }
  });
  if (!openShift) return { success: false, error: "No hay un turno de caja abierto." };

  try {
    await createExpense({ description, amount, shiftId: openShift.id, subCategory });
    return { success: true };
  } catch (error) {
    console.error("Error al registrar gasto:", error);
    return { success: false, error: "Error al registrar gasto en la base de datos." };
  }
}

export async function deleteExpense(id: number) {
  const expense = await prisma.expense.delete({
    where: { id },
  });
  revalidatePath("/cash-register");
  revalidatePath("/expenses");
  revalidatePath("/");
  return expense;
}

export async function getCurrentShiftExpensesTotal() {
  const openShift = await prisma.shift.findFirst({
    where: { status: "OPEN", storeId }
  });
  if (!openShift) return 0;

  // Obtenemos los gastos del turno actual de forma aislada para la tienda
  const expenses = await prisma.expense.findMany({
    where: { shiftId: openShift.id, storeId }
  });

  return expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
}
