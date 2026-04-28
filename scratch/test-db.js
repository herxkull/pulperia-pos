const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSale() {
  try {
    const sale = await prisma.sale.create({
      data: {
        ticketNumber: `TEST-${Date.now()}`,
        total: 100,
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        items: {
          create: []
        }
      }
    });
    console.log('Venta de prueba creada:', sale);
    await prisma.sale.delete({ where: { id: sale.id } });
    console.log('Venta de prueba eliminada.');
  } catch (error) {
    console.error('Error en la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSale();
