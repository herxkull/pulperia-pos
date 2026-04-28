"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOpenShift() {
  return await (prisma as any).shift.findFirst({
    where: { status: "OPEN" },
    include: {
      sales: true,
      expenses: true,
      creditPayments: true,
    }
  });
}

export async function getRecentShifts() {
  return await (prisma as any).shift.findMany({
    orderBy: { openedAt: 'desc' },
    take: 10,
  });
}

export async function openShift(startingCash: number) {
  const existing = await (prisma as any).shift.findFirst({
    where: { status: "OPEN" }
  });
  if (existing) return { success: false, error: "Ya existe un turno abierto." };

  await (prisma as any).shift.create({
    data: { startingCash, expectedCash: startingCash, status: "OPEN" }
  });
  revalidatePath("/cash-register");
  revalidatePath("/");
  return { success: true };
}

export async function closeShift(shiftId: number, actualCash: number) {
  const shift = await (prisma as any).shift.findUnique({
    where: { id: shiftId },
    include: { 
      sales: {
        where: { status: "COMPLETED" } 
      }, 
      expenses: true,
      creditPayments: true 
    }
  });

  if (!shift || shift.status !== "OPEN") return { success: false, error: "Turno no válido." };

  // Usamos casting a any para evitar errores de tipo si el cliente Prisma está desactualizado en el IDE
  const sales = (shift as any).sales || [];
  const expenses = (shift as any).expenses || [];
  const creditPayments = (shift as any).creditPayments || [];

  const cashSales = sales.filter((s: any) => s.paymentMethod === "CASH");
  const totalSalesInCash = cashSales.reduce((sum: number, s: any) => sum + s.total, 0);
  
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
  const totalCreditPayments = creditPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  
  const expectedCash = shift.startingCash + totalSalesInCash + totalCreditPayments - totalExpenses;

  await (prisma as any).shift.update({
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
