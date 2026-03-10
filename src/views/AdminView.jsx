import { Building2 } from "lucide-react";
import SharedMap from "../components/SharedMap";

// Vista Amministrativa (RBAC: ADMIN)
// Funge da Dashboard direzionale per i dipendenti comunali o per l'ente gestore dei parcheggi.
// Attualmente integra la mappa di calore (Heatmap) per il supporto decisionale urbanistico.
export default function AdminView() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">SmartUrban <span className="text-emerald-400">Amministrazione</span></h1>
          </div>
          <div className="text-sm font-medium bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            Supporto Decisionale Urbanistico
          </div>
        </div>
      </header>
      {/* Riutilizzo del componente SharedMap attivando la prop "showTimeMachine"
      */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        <SharedMap showTimeMachine={true} />
      </main>
    </div>
  );
}
