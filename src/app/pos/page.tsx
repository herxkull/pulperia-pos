import { getProducts } from "@/actions/product";
import { getCustomers } from "@/actions/customer";
import POSClient from "./POSClient";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const products = await getProducts();
  const customers = await getCustomers();

  return (
    <div style={{ height: "calc(100vh - 128px)", display: "flex", flexDirection: "column" }}>
      <POSClient products={products} customers={customers} />
    </div>
  );
}
