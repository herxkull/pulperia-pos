import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReceiptClient from "./ReceiptClient";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saleId = parseInt(id);
  
  if (isNaN(saleId)) return notFound();

  // Obtenemos la venta completa con todas sus relaciones usando Prisma estándar compatible con PostgreSQL
  const sale = await prisma.sale.findUnique({
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

  if (!sale) return notFound();

  return <ReceiptClient sale={sale} />;
}
