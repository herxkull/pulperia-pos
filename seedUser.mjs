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
  let admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (admin) {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashAdmin, role: 'ADMIN' }
    });
  } else {
    admin = await prisma.user.create({
      data: {
        storeId: 'test-store-123',
        username: 'admin',
        password: hashAdmin,
        role: 'ADMIN',
      }
    });
  }

  // Usuario Dueño
  let dueno = await prisma.user.findFirst({ where: { username: 'dueno' } });
  if (dueno) {
    dueno = await prisma.user.update({
      where: { id: dueno.id },
      data: { password: hashDueno, role: 'OWNER' }
    });
  } else {
    dueno = await prisma.user.create({
      data: {
        storeId: 'test-store-123',
        username: 'dueno',
        password: hashDueno,
        role: 'OWNER',
      }
    });
  }

  // Usuario Empleado (Cajero)
  let empleado = await prisma.user.findFirst({ where: { username: 'empleado' } });
  if (empleado) {
    empleado = await prisma.user.update({
      where: { id: empleado.id },
      data: { password: hashEmpleado, role: 'CASHIER' }
    });
  } else {
    empleado = await prisma.user.create({
      data: {
        storeId: 'test-store-123',
        username: 'empleado',
        password: hashEmpleado,
        role: 'CASHIER',
      }
    });
  }

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
