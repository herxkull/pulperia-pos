import { getProducts } from "@/actions/product";
import { getCategories } from "@/actions/category";
import { getSuppliers } from "@/actions/supplier";
import ProductList from "./ProductList";

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Inventario</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona los productos de tu pulpería.</p>
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
