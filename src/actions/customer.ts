"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomers(query?: string) {
  return await prisma.customer.findMany({
    where: query ? {
      OR: [
        { name: { contains: query } },
        { phone: { contains: query } },
      ],
    } : undefined,
    orderBy: { name: 'asc' },
  });
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  creditLimit: number;
}) {
  const customer = await prisma.customer.create({
    data: {
      ...data,
      phone: data.phone || null,
      currentDebt: 0,
    },
  });
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: number, data: {
  name: string;
  phone?: string;
  creditLimit: number;
}) {
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...data,
      phone: data.phone || null,
    },
  });
  revalidatePath("/customers");
  return customer;
}

export async function registerPayment(id: number, amount: number) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new Error("Cliente no encontrado");

  const newDebt = Math.max(0, customer.currentDebt - amount);

  await prisma.customer.update({
    where: { id },
    data: { currentDebt: newDebt },
  });
  
  revalidatePath("/customers");
}
