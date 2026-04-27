"use server";

import prisma from "@/lib/prisma";

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
  return { success: true };
}

export async function closeShift(shiftId: number, actualCash: number) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: { sales: true, expenses: true }
  });
  if (!shift || shift.status !== "OPEN") return { success: false, error: "Turno no válido." };

  const totalSales = shift.sales.reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = shift.expenses.reduce((sum, e) => sum + e.amount, 0);
  const expectedCash = shift.startingCash + totalSales - totalExpenses;

  await prisma.shift.update({
    where: { id: shiftId },
    data: {
      closedAt: new Date(),
      status: "CLOSED",
      expectedCash,
      actualCash
    }
  });
  return { success: true };
}
