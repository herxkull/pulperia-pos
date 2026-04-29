import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReceiptClient from "./ReceiptClient";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saleId = parseInt(id);
  
  if (isNaN(saleId)) return notFound();

  // WORKAROUND: Usamos SQL crudo para obtener la venta porque el cliente de Prisma 
  // está desactualizado y no "ve" la columna receivedAmount al hacer findUnique.
  const sales = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM Sale WHERE id = ?`,
    saleId
  );

  if (!sales || sales.length === 0) return notFound();
  const saleData = sales[0];

  // Obtenemos los items y el cliente por separado usando el cliente (que sí ve las relaciones viejas)
  const fullSale = await (prisma as any).sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        }
      }
    }
  });

  if (!fullSale) return notFound();

  // Mezclamos la data cruda (con receivedAmount) y la data relacionada
  const sale = {
    ...fullSale,
    receivedAmount: saleData.receivedAmount // Forzamos el valor de la base de datos
  };

  return <ReceiptClient sale={sale} />;
}
