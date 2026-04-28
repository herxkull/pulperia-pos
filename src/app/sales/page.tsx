import { getSalesHistory } from "@/actions/sale";
import SalesHistoryClient from "./SalesHistoryClient";

export default async function SalesHistoryPage() {
  const initialSales = await getSalesHistory({});
  
  return (
    <SalesHistoryClient initialSales={initialSales} />
  );
}
