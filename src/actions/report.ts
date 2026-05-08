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
const storeId = "test-store-123";

export async function getSalesReport(startDate?: string, endDate?: string) {
  const { start, end } = getDateRange(startDate, endDate);

  const sales = await (prisma as any).sale.findMany({
    where: {
      date: { gte: start, lte: end },
      status: "COMPLETED",
      storeId
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

  // Calcular ventas por hora (0-23)
  const hourlySales: { [key: number]: number } = {};
  for (let h = 0; h < 24; h++) {
    hourlySales[h] = 0;
  }
  sales.forEach((sale: any) => {
    const hour = new Date(sale.date).getHours();
    hourlySales[hour] = (hourlySales[hour] || 0) + sale.total;
  });
  const hourlyData = Object.keys(hourlySales).map(h => {
    const hourNum = parseInt(h);
    const label = `${hourNum.toString().padStart(2, '0')}:00`;
    return { hour: label, total: hourlySales[hourNum] };
  });

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
    hourlyData,
    topProducts
  };
}

/**
 * 1. REPORTES DE INVENTARIO
 */
export async function getInventoryReports() {
  const lowStock = await prisma.product.findMany({
    where: {
      stock: { lte: prisma.product.fields.minStock },
      storeId
    },
    orderBy: { stock: 'asc' }
  });

  const allProducts = await prisma.product.findMany({
    where: { storeId }
  });
  const valuation = allProducts.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const potentialRevenue = allProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const soldProductIds = await (prisma as any).saleItem.findMany({
    where: { sale: { date: { gte: thirtyDaysAgo }, storeId }, storeId },
    select: { productId: true },
    distinct: ['productId']
  });
  const ids = soldProductIds.map((p: any) => p.productId);

  const slowMoving = await prisma.product.findMany({
    where: {
      id: { notIn: ids },
      stock: { gt: 0 },
      storeId
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
    where: { date: { gte: start, lte: end }, status: "COMPLETED", storeId },
    include: { items: { include: { product: true } } }
  });

  // IMPORTANTE: Obtenemos TODOS los gastos del periodo
  const expenses = await (prisma as any).expense.findMany({
    where: { date: { gte: start, lte: end }, storeId }
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

  // Calcular tendencia diaria de utilidad neta
  const dailyData: { [key: string]: { revenue: number, cogs: number, expenses: number } } = {};

  sales.forEach((sale: any) => {
    const day = sale.date.toISOString().split('T')[0];
    if (!dailyData[day]) dailyData[day] = { revenue: 0, cogs: 0, expenses: 0 };
    dailyData[day].revenue += sale.total;
    sale.items.forEach((item: any) => {
      dailyData[day].cogs += (item.product.cost || 0) * item.quantity;
    });
  });

  expenses.forEach((exp: any) => {
    if (exp.category === "OPERATIONAL_EXPENSE") {
      const day = exp.date.toISOString().split('T')[0];
      if (!dailyData[day]) dailyData[day] = { revenue: 0, cogs: 0, expenses: 0 };
      dailyData[day].expenses += exp.amount;
    }
  });

  const trendData = Object.keys(dailyData).sort().map(date => ({
    date,
    revenue: dailyData[date].revenue,
    cogs: dailyData[date].cogs,
    expenses: dailyData[date].expenses,
    netProfit: dailyData[date].revenue - dailyData[date].cogs - dailyData[date].expenses
  }));

  // Agrupar gastos por subcategoría para PieChart/DonutChart
  const expenseGroups: { [key: string]: number } = {};
  expenses.forEach((exp: any) => {
    if (exp.category === "OPERATIONAL_EXPENSE") {
      const sub = exp.subCategory || "Otros";
      expenseGroups[sub] = (expenseGroups[sub] || 0) + exp.amount;
    }
  });
  const expenseBreakdown = Object.keys(expenseGroups).map(name => ({
    name,
    value: expenseGroups[name]
  }));

  return { 
    totalRevenue, 
    totalCOGS, 
    totalExpenses, 
    netProfit, 
    topMargins,
    trendData,
    expenseBreakdown,
    expensesList: expenses
  };
}

/**
 * 3. REPORTES DE AUDITORÍA
 */
export async function getAuditReports() {
  const shifts = await (prisma as any).shift.findMany({
    where: { status: "CLOSED", storeId },
    orderBy: { closedAt: 'desc' },
    take: 20
  });

  const mismatches = shifts.filter((s: any) => Math.abs(s.actualCash - s.expectedCash) > 0.01);

  const voidedSales = await (prisma as any).sale.findMany({
    where: { status: "VOIDED", storeId },
    include: { customer: true },
    orderBy: { date: 'desc' },
    take: 15
  });

  // Calcular la suma de descuadres y mercadería anulada
  const mismatchesTotal = shifts.reduce((sum: number, s: any) => sum + ((s.actualCash ?? 0) - s.expectedCash), 0);
  const voidedTotal = voidedSales.reduce((sum: number, s: any) => sum + s.total, 0);

  // Obtener usuarios cajeros de la tienda
  const cashiers = await prisma.user.findMany({
    where: { storeId },
    select: { username: true }
  });

  return { mismatches, voidedSales, mismatchesTotal, voidedTotal, cashiers };
}

/**
 * 4. REPORTES DE CRÉDITO
 */
export async function getCreditReports() {
  const customers = await prisma.customer.findMany({
    where: { currentDebt: { gt: 0 }, storeId },
    orderBy: { currentDebt: 'desc' }
  });

  const totalInStreet = customers.reduce((sum, c) => sum + c.currentDebt, 0);

  const agingDebt = await Promise.all(customers.map(async (c) => {
    const lastSale = await (prisma as any).sale.findFirst({
      where: { customerId: c.id, paymentMethod: "CREDIT", status: "COMPLETED", storeId },
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
