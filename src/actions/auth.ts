"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function loginAction(username: string, passwordStr: string) {
  const user = await prisma.user.findFirst({
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

export async function getUsers(requesterRole?: string) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: { id: "asc" }
    });
    
    if (requesterRole === "OWNER") {
      return { success: true, users: users.filter(u => u.role !== "ADMIN") };
    }
    
    return { success: true, users };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al obtener usuarios" };
  }
}

export async function createUser(username: string, passwordStr: string, role: string) {
  try {
    // 1. Validar límite de 2 empleados (CASHIER)
    if (role === "CASHIER") {
      const cashierCount = await prisma.user.count({
        where: { role: "CASHIER" }
      });
      if (cashierCount >= 2) {
        return { success: false, error: "Límite alcanzado: Máximo 2 empleados (Cajeros) permitidos." };
      }
    }

    // 2. Validar si ya existe el usuario
    const existing = await prisma.user.findFirst({
      where: { username }
    });
    if (existing) {
      return { success: false, error: "El nombre de usuario ya está registrado." };
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(passwordStr, salt);

    const newUser = await prisma.user.create({
      data: {
        storeId: "test-store-123",
        username,
        password: hashPassword,
        role
      }
    });

    return { success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al crear usuario" };
  }
}

export async function changePassword(id: number, newPasswordStr: string) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPasswordStr, salt);

    await prisma.user.update({
      where: { id },
      data: { password: hashPassword }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar contraseña" };
  }
}

export async function deleteUser(id: number) {
  try {
    const userToDelete = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToDelete) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // No permitir eliminar a 'admin' o 'dueno' principales por seguridad
    if (userToDelete.username === "admin" || userToDelete.username === "dueno") {
      return { success: false, error: "No se puede eliminar a los usuarios principales (admin / dueno)." };
    }

    await prisma.user.delete({
      where: { id }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al eliminar usuario" };
  }
}
