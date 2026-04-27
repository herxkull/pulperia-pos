import { getOpenShift, getRecentShifts } from "@/actions/shift";
import CashRegisterClient from "@/app/cash-register/CashRegisterClient";

export const dynamic = "force-dynamic";

export default async function CashRegisterPage() {
  const openShift = await getOpenShift();
  const recentShifts = await getRecentShifts();

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Arqueo de Caja</h1>
        <p style={{ color: "var(--text-muted)" }}>Gestiona los turnos y el flujo de efectivo de tu negocio.</p>
      </div>

      <CashRegisterClient 
        initialOpenShift={openShift} 
        recentShifts={recentShifts}
      />
    </div>
  );
}
