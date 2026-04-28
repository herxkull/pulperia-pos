"use server";

import prisma from "@/lib/prisma";

/**
 * Normaliza las fechas para cubrir el día completo en la zona horaria local
 */
function getDateRange(startDate?: string, endDate?: string) {
  let start: Date;
  let end: Date;

  if (startDate) {
    // Si viene de un input date (YYYY-MM-DD), lo tomamos como inicio del día
    start = new Date(startDate + 'T00:00:00');
  } else {
    start = new Date();
    start.setHours(0, 0, 0, 0);
  }

  if (endDate) {
    // Fin del día para la fecha final
    end = new Date(endDate + 'T23:59:59');
  } else {
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

/**
 * REPORTES DE VENTAS Y GENERALES
 */
export async function getSalesReport(startDate?: string, endDate?: string) {
  const { start, end } = getDateRange(startDate, endDate);

  const sales = await (prisma as any).sale.findMany({
    where: {
      date: { gte: start, lte: end },
      status: "COMPLETED"
    },
    include: {
      items: { include: { product: true } },
    },
  });

  const totalSales = sales.reduce((sum: number, sale: any) => sum + sale.total, 0);
  
  const dailySales: { [key: string]: number } = {};
  sales.forEach((sale: any) => {
    const day = sale.date.toISOString().split('T')[0];
    dailySales[day] = (dailySales[day] || 0) + sale.total;
  });

  const chartData = Object.keys(dailySales).sort().map(date => ({ date, total: dailySales[date] }));

  const paymentMethods: { [key: string]: number } = {};
  sales.forEach((sale: any) => {
    paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
  });

  const paymentData = Object.keys(paymentMethods).map(name => ({ name, value: paymentMethods[name] }));

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

  const topProducts = Object.values(productSales).sort((a, b) => b.total - a.total).slice(0, 10);

  return {
    summary: { totalSales, transactionCount: sales.length },
    chartData,
    paymentData,
    topProducts
  };
}

/**
 * 1. REPORTES DE INVENTARIO
 */
export async function getInventoryReports() {
  const lowStock = await prisma.product.findMany({
    where: {
      stock: { lte: prisma.product.fields.minStock }
    },
    orderBy: { stock: 'asc' }
  });

  const allProducts = await prisma.product.findMany();
  const valuation = allProducts.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const potentialRevenue = allProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const soldProductIds = await (prisma as any).saleItem.findMany({
    where: { sale: { date: { gte: thirtyDaysAgo } } },
    select: { productId: true },
    distinct: ['productId']
  });
  const ids = soldProductIds.map((p: any) => p.productId);

  const slowMoving = await prisma.product.findMany({
    where: {
      id: { notIn: ids },
      stock: { gt: 0 }
    },
    orderBy: { updatedAt: 'asc' },
    take: 15
  });

  return { lowStock, valuation, potentialRevenue, slowMoving };
}

/**
 * 2. REPORTES DE RENTABILIDAD
 */
export async function getProfitabilityReport(startDate?: string, endDate?: string) {
  const { start, end } = getDateRange(startDate, endDate);

  const sales = await (prisma as any).sale.findMany({
    where: { date: { gte: start, lte: end }, status: "COMPLETED" },
    include: { items: { include: { product: true } } }
  });

  // IMPORTANTE: Obtenemos TODOS los gastos del periodo
  const expenses = await (prisma as any).expense.findMany({
    where: { date: { gte: start, lte: end } }
  });

  let totalRevenue = 0;
  let totalCOGS = 0; 
  const productMargins: { [key: string]: { name: string, margin: number, sold: number } } = {};

  sales.forEach((sale: any) => {
    totalRevenue += sale.total;
    sale.items.forEach((item: any) => {
      const cost = item.product.cost * item.quantity;
      totalCOGS += cost;

      const pid = item.productId;
      if (!productMargins[pid]) {
        productMargins[pid] = { name: item.product.name, margin: 0, sold: 0 };
      }
      productMargins[pid].margin += (item.price - item.product.cost) * item.quantity;
      productMargins[pid].sold += item.quantity;
    });
  });

  // Clasificamos los gastos:
  // Solo los gastos OPERATIVOS se restan de la utilidad neta aquí, 
  // ya que los gastos de INVENTARIO ya están contemplados en el COGS (Costo de ventas).
  const totalExpenses = expenses
    .filter((e: any) => e.category === "OPERATIONAL_EXPENSE")
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const netProfit = totalRevenue - totalCOGS - totalExpenses;

  const topMargins = Object.values(productMargins).sort((a, b) => b.margin - a.margin).slice(0, 10);

  return { 
    totalRevenue, 
    totalCOGS, 
    totalExpenses, 
    netProfit, 
    topMargins,
    expensesList: expenses // Para depuración o detalle si fuera necesario
  };
}

/**
 * 3. REPORTES DE AUDITORÍA
 */
export async function getAuditReports() {
  const shifts = await (prisma as any).shift.findMany({
    where: { status: "CLOSED" },
    orderBy: { closedAt: 'desc' },
    take: 10
  });

  const mismatches = shifts.filter((s: any) => Math.abs(s.actualCash - s.expectedCash) > 0.01);

  const voidedSales = await (prisma as any).sale.findMany({
    where: { status: "VOIDED" },
    include: { customer: true },
    orderBy: { date: 'desc' },
    take: 15
  });

  return { mismatches, voidedSales };
}

/**
 * 4. REPORTES DE CRÉDITO
 */
export async function getCreditReports() {
  const customers = await prisma.customer.findMany({
    where: { currentDebt: { gt: 0 } },
    orderBy: { currentDebt: 'desc' }
  });

  const totalInStreet = customers.reduce((sum, c) => sum + c.currentDebt, 0);

  const agingDebt = await Promise.all(customers.map(async (c) => {
    const lastSale = await (prisma as any).sale.findFirst({
      where: { customerId: c.id, paymentMethod: "CREDIT", status: "COMPLETED" },
      orderBy: { date: 'desc' }
    });
    return {
      name: c.name,
      debt: c.currentDebt,
      lastPurchase: lastSale?.date || null
    };
  }));

  return { totalInStreet, agingDebt };
}
