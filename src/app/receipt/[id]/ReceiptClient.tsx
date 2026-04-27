"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";

type SaleProp = {
  id: number;
  total: number;
  date: Date;
  customer?: { name: string } | null;
  items: {
    id: number;
    quantity: number;
    price: number;
    product: { name: string };
  }[];
};

export default function ReceiptClient({ sale }: { sale: SaleProp }) {
  const router = useRouter();

  // Autodisparar impresión al cargar
  useEffect(() => {
    // Pequeño delay para asegurar que los estilos cargaron
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem 0" }}>
      <div className="no-print" style={{ display: "flex", gap: "1rem", marginBottom: "2rem", justifyContent: "center" }}>
        <button className="btn btn-outline" onClick={() => router.push("/pos")}>
          <ArrowLeft size={18} /> Volver al POS
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={18} /> Imprimir Recibo
        </button>
      </div>

      {/* Formato Ticket para impresión */}
      <div className="receipt" style={{ 
        backgroundColor: "white", 
        color: "black", 
        padding: "2rem 1rem", 
        fontFamily: "'Courier New', Courier, monospace",
        border: "1px dashed #ccc",
        width: "100%",
        maxWidth: "350px",
        margin: "0 auto"
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>MI PULPERÍA</h2>
          <p style={{ margin: "0.25rem 0" }}>Ticket de Venta #{sale.id.toString().padStart(6, '0')}</p>
          <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
            Fecha: {new Date(sale.date).toLocaleString()}
          </p>
          {sale.customer && (
            <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
              Cliente: {sale.customer.name}
            </p>
          )}
        </div>

        <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "0.5rem 0", marginBottom: "1rem" }}>
          <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ paddingBottom: "0.5rem" }}>Cant</th>
                <th style={{ paddingBottom: "0.5rem" }}>Descripción</th>
                <th style={{ textAlign: "right", paddingBottom: "0.5rem" }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map(item => (
                <tr key={item.id}>
                  <td style={{ verticalAlign: "top" }}>{item.quantity}</td>
                  <td style={{ verticalAlign: "top", paddingRight: "0.5rem" }}>{item.product.name}</td>
                  <td style={{ textAlign: "right", verticalAlign: "top" }}>{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 700, marginTop: "1rem" }}>
          <span>TOTAL:</span>
          <span>C$ {sale.total.toFixed(2)}</span>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.875rem" }}>
          <p>¡Gracias por su compra!</p>
        </div>
      </div>


    </div>
  );
}
