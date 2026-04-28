"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function loginAction(username: string, passwordStr: string) {
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const isMatch = await bcrypt.compare(passwordStr, user.password);
  if (!isMatch) {
    return { success: false, error: "Contraseña incorrecta" };
  }

  // Generate a fake simple token for local use
  const token = Buffer.from(`${user.id}:${user.username}:${(user as any).role}`).toString('base64');
  
  return { success: true, token, role: (user as any).role };
}
