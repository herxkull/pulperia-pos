"use server";

import prisma from "@/lib/prisma";

export async function getSalesReport(startDate?: string, endDate?: string) {
  const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0,0,0,0));
  const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23,59,59,999));

  // Obtener ventas en el rango
  const sales = await (prisma as any).sale.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Procesar métricas básicas
  const totalSales = sales.reduce((sum: number, sale: any) => sum + sale.total, 0);
  
  // Agrupar ventas por día para el gráfico
  const dailySales: { [key: string]: number } = {};
  sales.forEach((sale: any) => {
    const day = sale.date.toISOString().split('T')[0];
    dailySales[day] = (dailySales[day] || 0) + sale.total;
  });

  const chartData = Object.keys(dailySales).sort().map(date => ({
    date,
    total: dailySales[date]
  }));

  // Agrupar por método de pago
  const paymentMethods: { [key: string]: number } = {};
  sales.forEach((sale: any) => {
    paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
  });

  const paymentData = Object.keys(paymentMethods).map(name => ({
    name,
    value: paymentMethods[name]
  }));

  // Productos más vendidos
  const productSales: { [key: string]: { name: string, quantity: number, total: number } } = {};
  sales.forEach((sale: any) => {
    sale.items.forEach((item: any) => {
      const pid = item.productId;
      if (!productSales[pid]) {
        productSales[pid] = { name: item.product.name, quantity: 0, total: 0 };
      }
      productSales[pid].quantity += item.quantity;
      productSales[pid].total += item.quantity * item.price;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    summary: {
      totalSales,
      transactionCount: sales.length,
    },
    chartData,
    paymentData,
    topProducts
  };
}
