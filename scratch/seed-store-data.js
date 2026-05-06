const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando inyección de datos de catálogo para la tienda de pruebas (test-store-123)...');
  const storeId = 'test-store-123';

  // 1. Crear Categorías base
  console.log('Creando categorías...');
  const catBebidas = await prisma.category.upsert({
    where: { storeId_name: { storeId, name: 'Bebidas' } },
    update: {},
    create: { storeId, name: 'Bebidas' }
  });
  const catAbarrotes = await prisma.category.upsert({
    where: { storeId_name: { storeId, name: 'Abarrotes' } },
    update: {},
    create: { storeId, name: 'Abarrotes' }
  });
  const catLacteos = await prisma.category.upsert({
    where: { storeId_name: { storeId, name: 'Lácteos' } },
    update: {},
    create: { storeId, name: 'Lácteos' }
  });
  const catSnacks = await prisma.category.upsert({
    where: { storeId_name: { storeId, name: 'Snacks' } },
    update: {},
    create: { storeId, name: 'Snacks' }
  });
  const catLimpieza = await prisma.category.upsert({
    where: { storeId_name: { storeId, name: 'Limpieza' } },
    update: {},
    create: { storeId, name: 'Limpieza' }
  });

  // 2. Crear Proveedores de Pulpería
  console.log('Creando proveedores...');
  const supCoca = await prisma.supplier.create({
    data: {
      storeId,
      name: 'Compañía Cervecera de Nicaragua',
      phone: '2288-4000',
      address: 'Managua, km 6 Carretera Norte',
      visitDay: 'Lunes'
    }
  });
  const supLala = await prisma.supplier.create({
    data: {
      storeId,
      name: 'Lala S.A. Nicaragua',
      phone: '2266-9000',
      address: 'Managua, Complejo San Benito',
      visitDay: 'Miércoles'
    }
  });

  // 3. Crear Productos de Pulpería
  console.log('Inyectando productos de catálogo...');
  await prisma.product.createMany({
    data: [
      { storeId, barcode: '740100500101', name: 'Coca-Cola Desechable 1.5L', price: 42, cost: 34, stock: 24, minStock: 5, unit: 'Unidad', categoryId: catBebidas.id, supplierId: supCoca.id },
      { storeId, barcode: '740100500102', name: 'Fanta Naranja 3L', price: 55, cost: 44, stock: 12, minStock: 4, unit: 'Unidad', categoryId: catBebidas.id, supplierId: supCoca.id },
      { storeId, barcode: '740100500202', name: 'Leche Entera Lala 1L (UHT)', price: 34, cost: 28, stock: 18, minStock: 6, unit: 'Unidad', categoryId: catLacteos.id, supplierId: supLala.id },
      { storeId, barcode: '740100500203', name: 'Crema Lala Premium 1lb', price: 38, cost: 30, stock: 10, minStock: 4, unit: 'Unidad', categoryId: catLacteos.id, supplierId: supLala.id },
      { storeId, barcode: '740100500303', name: 'Arroz Faisán 96% 1lb', price: 19, cost: 15, stock: 60, minStock: 10, unit: 'Libra', categoryId: catAbarrotes.id },
      { storeId, barcode: '740100500304', name: 'Frijoles Rojos Cocidos 1lb', price: 28, cost: 22, stock: 35, minStock: 8, unit: 'Libra', categoryId: catAbarrotes.id },
      { storeId, barcode: '740100500404', name: 'Aceite Corona Sol 1L', price: 68, cost: 54, stock: 15, minStock: 3, unit: 'Unidad', categoryId: catAbarrotes.id },
      { storeId, barcode: '740100500505', name: "Papas Fritas Lay's Original", price: 25, cost: 18, stock: 40, minStock: 5, unit: 'Unidad', categoryId: catSnacks.id },
      { storeId, barcode: '740100500506', name: 'Galletas Oreo Chocolate 6pk', price: 15, cost: 11, stock: 48, minStock: 6, unit: 'Unidad', categoryId: catSnacks.id },
      { storeId, barcode: '740100500606', name: 'Jabón Líquido Axion Limón', price: 48, cost: 38, stock: 14, minStock: 3, unit: 'Unidad', categoryId: catLimpieza.id }
    ]
  });

  // 4. Crear Cliente de Pruebas para Créditos
  console.log('Creando cliente de pruebas para fiados...');
  const customer = await prisma.customer.create({
    data: {
      storeId,
      name: 'Ramon Antonio Zelaya (Vecino)',
      phone: '8877-6655',
      creditLimit: 1500,
      currentDebt: 0
    }
  });

  // 5. Crear Turno Abierto (Caja Abierta) para que funcione el POS de inmediato
  console.log('Abriendo caja inicial (Turno)...');
  const shift = await prisma.shift.create({
    data: {
      storeId,
      startingCash: 1000,
      expectedCash: 1000,
      status: 'OPEN'
    }
  });

  console.log('✔ Caja inicial abierta con C$ 1,000.00 (ID:', shift.id, ')');
  console.log('🎉 ¡Inyección de datos para catálogo pulpero completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error al inyectar datos de catálogo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
