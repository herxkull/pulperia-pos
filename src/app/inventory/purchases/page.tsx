import { getProducts } from "@/actions/product";
import { getSuppliers } from "@/actions/supplier";
import { getRecentPurchases } from "@/actions/purchase";
import PurchasesClient from "./PurchasesClient";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const products = await getProducts();
  const suppliers = await getSuppliers();
  const recentPurchases = await getRecentPurchases();

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Compras (Entrada de Mercancía)</h1>
        <p style={{ color: "var(--text-muted)" }}>Registra las facturas de tus proveedores para actualizar stock.</p>
      </div>

      <PurchasesClient 
        products={products} 
        suppliers={suppliers} 
        recentPurchases={recentPurchases}
      />
    </div>
  );
}
