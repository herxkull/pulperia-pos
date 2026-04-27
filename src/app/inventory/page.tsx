import { getProducts, getInventoryValuation } from "@/actions/product";
import { getCategories } from "@/actions/category";
import { getSuppliers } from "@/actions/supplier";
import ProductList from "./ProductList";
import { DollarSign, Package, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getProducts(q);
  const categories = await getCategories();
  const suppliers = await getSuppliers();
  const valuation = await getInventoryValuation();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Inventario</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona los productos de tu pulpería.</p>
        </div>
      </div>

      {/* Resumen de Valoración */}
      <div className="grid grid-cols-4" style={{ gap: "1rem", marginBottom: "2rem" }}>
        <div className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--primary)" }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stock Total</p>
            <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{valuation.totalItems}</p>
          </div>
        </div>
        
        <div className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--success)" }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Costo Inventario</p>
            <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>C$ {valuation.totalCost.toLocaleString()}</p>
          </div>
        </div>

        <div className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--warning)" }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Valor Venta</p>
            <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>C$ {valuation.totalValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", border: "1px solid var(--primary)" }}>
          <div style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", padding: "0.75rem", borderRadius: "12px", color: "var(--accent)" }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ganancia Proyectada</p>
            <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--primary)" }}>C$ {valuation.expectedProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <ProductList 
        initialProducts={products} 
        initialQuery={q || ""} 
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}
