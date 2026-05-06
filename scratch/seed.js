const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos de prueba (Seed)...');
  
  // 1. Crear la Tienda de Pruebas
  const store = await prisma.store.upsert({
    where: { id: 'test-store-123' },
    update: {},
    create: {
      id: 'test-store-123',
      name: 'Pulpería El Trébol',
      isActive: true,
    },
  });
  console.log('✔ Tienda creada con éxito:', store.name, `(ID: ${store.id})`);

  // 2. Encriptar contraseña '123'
  const hashedPassword = await bcrypt.hash('123', 10);

  // 3. Crear Usuario Administrador de pruebas
  const admin = await prisma.user.create({
    data: {
      storeId: store.id,
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✔ Usuario Administrador creado con éxito:', admin.username, `(Rol: ${admin.role})`);

  console.log('🎉 ¡Carga de datos de prueba completada exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
