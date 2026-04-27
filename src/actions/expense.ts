"use server";

import prisma from "@/lib/prisma";
import { getOpenShift } from "./shift";

export async function addExpense(description: string, amount: number) {
  const openShift = await getOpenShift();
  
  if (!openShift) {
    return { success: false, error: "No hay turno de caja abierto." };
  }

  await prisma.expense.create({
    data: {
      description,
      amount,
      shiftId: openShift.id
    }
  });

  return { success: true };
}

export async function getExpenses() {
  return await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    take: 50,
    include: {
      shift: true
    }
  });
}
