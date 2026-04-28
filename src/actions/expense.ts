"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExpenses(shiftId?: number) {
  // Usamos findMany con (prisma as any) para poder traer campos nuevos aunque los tipos estén desactualizados
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
  subCategory?: string;
}) {
  // WORKAROUND: Debido a que el servidor de Next.js bloquea los archivos de Prisma y no permite regenerar los tipos (EPERM),
  // utilizamos SQL crudo para insertar el gasto con el nuevo campo 'subCategory'.
  const now = new Date().toISOString();
  
  await prisma.$executeRawUnsafe(
    `INSERT INTO Expense (description, amount, date, category, subCategory, shiftId) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    data.description,
    Number(data.amount),
    now,
    "OPERATIONAL_EXPENSE",
    data.subCategory || null,
    Number(data.shiftId)
  );

  revalidatePath("/cash-register");
  revalidatePath("/expenses");
  revalidatePath("/");
  return { success: true };
}

export async function addExpense(description: string, amount: number, subCategory?: string) {
  const openShift = await (prisma as any).shift.findFirst({ where: { status: "OPEN" } });
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
  const expense = await (prisma as any).expense.delete({
    where: { id },
  });
  revalidatePath("/cash-register");
  revalidatePath("/expenses");
  revalidatePath("/");
  return expense;
}

export async function getCurrentShiftExpensesTotal() {
  const openShift = await (prisma as any).shift.findFirst({ where: { status: "OPEN" } });
  if (!openShift) return 0;

  // Obtenemos los gastos del turno actual
  const expenses = await (prisma as any).expense.findMany({
    where: { shiftId: openShift.id }
  });

  return expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
}
