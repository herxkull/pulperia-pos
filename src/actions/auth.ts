"use server";

import prisma from "@/lib/prisma";

export async function loginAction(username: string, passwordStr: string) {
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    return { success: false, error: "Usuario no encontrado" };
  }

  // In a real application, compare hashed passwords.
  if (user.password !== passwordStr) {
    return { success: false, error: "Contraseña incorrecta" };
  }

  // Generate a fake simple token for local use
  const token = Buffer.from(`${user.id}:${user.username}:${(user as any).role}`).toString('base64');
  
  return { success: true, token, role: (user as any).role };
}
