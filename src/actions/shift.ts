"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOpenShift() {
  return await prisma.shift.findFirst({
    where: { status: "OPEN" },
    include: {
      sales: true,
      expenses: true,
    }
  });
}

export async function getRecentShifts() {
  return await prisma.shift.findMany({
    orderBy: { openedAt: 'desc' },
    take: 10,
  });
}

export async function openShift(startingCash: number) {
  const existing = await prisma.shift.findFirst({
    where: { status: "OPEN" }
  });
  if (existing) return { success: false, error: "Ya existe un turno abierto." };

  await prisma.shift.create({
    data: { startingCash, expectedCash: startingCash, status: "OPEN" }
  });
  revalidatePath("/cash-register");
  revalidatePath("/");
  return { success: true };
}

export async function closeShift(shiftId: number, actualCash: number) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { sales: true, expenses: true }
  });
  if (!shift || shift.status !== "OPEN") return { success: false, error: "Turno no válido." };

  const cashSales = (shift.sales as any[]).filter(s => s.paymentMethod === "Efectivo");
  const totalSalesInCash = cashSales.reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = shift.expenses.reduce((sum, e) => sum + e.amount, 0);
  const expectedCash = shift.startingCash + totalSalesInCash - totalExpenses;

  await prisma.shift.update({
    where: { id: shiftId },
    data: {
      closedAt: new Date(),
      status: "CLOSED",
      expectedCash,
      actualCash
    }
  });

  revalidatePath("/cash-register");
  revalidatePath("/");
  return { success: true };
}
