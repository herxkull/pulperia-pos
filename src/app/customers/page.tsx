import { getCustomers } from "@/actions/customer";
import CustomerList from "./CustomerList";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await getCustomers(q);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Clientes y Fiados</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona los clientes y sus cuentas por cobrar.</p>
        </div>
      </div>
      
      <CustomerList initialCustomers={customers} initialQuery={q || ""} />
    </div>
  );
}
