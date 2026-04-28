import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash de contraseñas
  const salt = await bcrypt.genSalt(10);
  
  const hashAdmin = await bcrypt.hash('123', salt);
  const hashDueno = await bcrypt.hash('456', salt);
  const hashEmpleado = await bcrypt.hash('789', salt);

  // Administrador principal (Soporte Técnico / Root)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashAdmin },
    create: {
      username: 'admin',
      password: hashAdmin,
      role: 'ADMIN',
    },
  });

  // Usuario Dueño (ADMIN pero con restricciones en la UI)
  const dueno = await prisma.user.upsert({
    where: { username: 'dueno' },
    update: { password: hashDueno },
    create: {
      username: 'dueno',
      password: hashDueno,
      role: 'ADMIN',
    },
  });

  // Usuario Empleado (Cajero)
  const empleado = await prisma.user.upsert({
    where: { username: 'empleado' },
    update: { password: hashEmpleado },
    create: {
      username: 'empleado',
      password: hashEmpleado,
      role: 'CASHIER',
    },
  });

  console.log('Usuarios sembrados con contraseñas seguras (hashes):');
  console.log('- Admin:', admin.username);
  console.log('- Dueño:', dueno.username);
  console.log('- Empleado:', empleado.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
