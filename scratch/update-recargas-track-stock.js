const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Actualizando trackStock a true para las recargas de Claro y Tigo...');
  const result = await prisma.product.updateMany({
    where: {
      storeId: 'test-store-123',
      barcode: { in: ['SERV_CLARO', 'SERV_TIGO'] }
    },
    data: {
      trackStock: true
    }
  });
  console.log(`🎉 ¡Éxito! Se actualizaron ${result.count} productos de recargas para habilitar su control de saldo de crédito.`);
}

main()
  .catch((e) => {
    console.error('❌ Error actualizando:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
