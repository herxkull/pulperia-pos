const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando inyección de productos a granel, servicios y variables para la tienda de pruebas (test-store-123)...');
  const storeId = 'test-store-123';

  // Buscar o crear la categoría de Abarrotes y Lácteos para asociarlos adecuadamente
  const catAbarrotes = await prisma.category.findFirst({
    where: { storeId, name: 'Abarrotes' }
  });
  const catLacteos = await prisma.category.findFirst({
    where: { storeId, name: 'Lácteos' }
  });

  const catServicios = await prisma.category.upsert({
    where: { storeId_name: { storeId, name: 'Servicios' } },
    update: {},
    create: { storeId, name: 'Servicios' }
  });

  const catPreparados = await prisma.category.upsert({
    where: { storeId_name: { storeId, name: 'Preparados' } },
    update: {},
    create: { storeId, name: 'Preparados' }
  });

  const bulkProducts = [
    // 1. PRODUCTOS A GRANEL (Soportan stock/venta con decimales)
    {
      storeId,
      barcode: '740100500901',
      name: 'Frijoles Cocidos Licuados (por Peso)',
      price: 32.0,
      cost: 24.0,
      stock: 18.5, // Stock inicial decimal
      minStock: 5.0,
      unit: 'Libra',
      unitName: 'Libra',
      categoryId: catAbarrotes ? catAbarrotes.id : null,
      trackStock: true,
      isVariablePrice: false
    },
    {
      storeId,
      barcode: '740100500902',
      name: 'Queso Seco Chontaleño (A granel)',
      price: 85.0,
      cost: 65.0,
      stock: 22.4, // Stock inicial decimal
      minStock: 4.5,
      unit: 'Libra',
      unitName: 'Libra',
      categoryId: catLacteos ? catLacteos.id : null,
      trackStock: true,
      isVariablePrice: false
    },
    {
      storeId,
      barcode: '740100500903',
      name: 'Crema Centroamericana por Peso',
      price: 45.0,
      cost: 35.0,
      stock: 12.8, // Stock inicial decimal
      minStock: 3.0,
      unit: 'Libra',
      unitName: 'Libra',
      categoryId: catLacteos ? catLacteos.id : null,
      trackStock: true,
      isVariablePrice: false
    },

    // 2. SERVICIOS CON SALDO DE CRÉDITO (Rastrean stock de crédito, trackStock = true)
    {
      storeId,
      barcode: 'SERV_CLARO',
      name: 'Recarga Telefónica Claro',
      price: 1.0, // Base C$1, se multiplica por el monto ingresado
      cost: 0.93, // Margen de ganancia
      stock: 0.0,
      minStock: 0.0,
      unit: 'Servicio',
      unitName: 'Servicio',
      categoryId: catServicios.id,
      trackStock: true, // Sí descuenta del saldo de crédito disponible
      isVariablePrice: true // El cajero digita el monto de la recarga como precio unitario o cantidad
    },
    {
      storeId,
      barcode: 'SERV_TIGO',
      name: 'Recarga Telefónica Tigo',
      price: 1.0,
      cost: 0.93,
      stock: 0.0,
      minStock: 0.0,
      unit: 'Servicio',
      unitName: 'Servicio',
      categoryId: catServicios.id,
      trackStock: true, // Sí descuenta del saldo de crédito disponible
      isVariablePrice: true
    },

    // 3. PRODUCTOS CON PRECIO VARIABLE (isVariablePrice = true)
    {
      storeId,
      barcode: 'VAR_PAN_DULCE',
      name: 'Pan Dulce Artesanal (Precio Variable)',
      price: 5.0, // Precio sugerido
      cost: 3.5,
      stock: 80.0,
      minStock: 10.0,
      unit: 'Unidad',
      unitName: 'Unidad',
      categoryId: catPreparados.id,
      trackStock: true,
      isVariablePrice: true // Permite modificar el precio libremente según el tamaño/tipo de pan
    },
    {
      storeId,
      barcode: 'VAR_CAFE_CALIENTE',
      name: 'Café Caliente en Vaso (Precio Variable)',
      price: 15.0, // Precio sugerido
      cost: 8.0,
      stock: 50.0,
      minStock: 5.0,
      unit: 'Vaso',
      unitName: 'Vaso',
      categoryId: catPreparados.id,
      trackStock: true,
      isVariablePrice: true // Permite cobrar montos de café según tamaño del vaso
    }
  ];

  console.log('Inyectando nuevos productos avanzados...');
  for (const prod of bulkProducts) {
    await prisma.product.upsert({
      where: { storeId_barcode: { storeId, barcode: prod.barcode } },
      update: {
        price: prod.price,
        cost: prod.cost,
        stock: prod.stock,
        minStock: prod.minStock,
        trackStock: prod.trackStock,
        isVariablePrice: prod.isVariablePrice
      },
      create: prod
    });
    console.log(`• Producto inyectado/actualizado: ${prod.name} (${prod.barcode})`);
  }

  console.log('🎉 ¡Productos avanzados agregados con éxito para pruebas de POS!');
}

main()
  .catch((e) => {
    console.error('❌ Error inyectando productos avanzados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
