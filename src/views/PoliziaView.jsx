import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, Clock, MapPin, Loader2 } from "lucide-react";
import SharedMap from "../components/SharedMap";

export default function PoliziaView() {
  // Gestione della navigazione a schede interna alla vista
  const [activeTab, setActiveTab] = useState("map");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight">SmartUrban <span className="text-blue-400">Polizia Locale</span></h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("map")}
              className={"px-4 py-2 rounded-lg font-medium text-sm transition-colors " + (activeTab === "map" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800")}
            >
              Mappa Operativa
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={"px-4 py-2 rounded-lg font-medium text-sm transition-colors " + (activeTab === "tickets" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800")}
            >
              Gestione Segnalazioni
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {activeTab === "map" && <SharedMap showTimeMachine={true} />}
        {activeTab === "tickets" && <TicketsTab />}
      </main>
    </div>
  );
}

// Sotto-componente per la gestione del workflow dei Ticket 
function TicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [esito, setEsito] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error("Error feed segnalazioni", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Short-polling per aggiornare il feed delle emergenze ogni 5 secondi
    const interval = setInterval(fetchTickets, 5000); 
    return () => clearInterval(interval);
  }, []);
  // Presa in carico del ticket (Lock per evitare conflitti tra pattuglie)
  const handleLock = async (id) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/reports/" + id + "/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Simuliamo l'estrazione dell'ID Agente dal token di sessione attuale
        body: JSON.stringify({ idAgente: "AGENTE_001" }), 
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error);
        } else {
          throw new Error(data.error || "Errore nella presa in carico");
        }
      } else {
        setSuccessMsg(data.message);
        fetchTickets();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResolve = async (id) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/reports/" + id + "/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ esito }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Errore nella risoluzione");
      
      setSuccessMsg(data.message);
      setResolvingId(null);
      setEsito("");
      fetchTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-bold">Conflitto di Concorrenza (Errore 409)</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}
      {/* Griglia Feed Segnalazioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id_segnalazione} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {ticket.foto_url ? (
              <img src={ticket.foto_url} alt="Abuso" className="h-48 w-full object-cover" />
            ) : (
              <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                Nessuna foto
              </div>
            )}
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className={"text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider " + (
                  ticket.stato_ticket === 'DA_PRENDERE_IN_CARICO' ? 'bg-amber-100 text-amber-800' :
                  ticket.stato_ticket === 'IN_LAVORAZIONE' ? 'bg-blue-100 text-blue-800' :
                  'bg-emerald-100 text-emerald-800'
                )}>
                  {ticket.stato_ticket.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(ticket.timestamp_creazione).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              <p className="text-slate-800 text-sm mb-4 flex-1">{ticket.descrizione_abuso}</p>
              
              <div className="text-xs text-slate-500 mb-4 flex items-center gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                <MapPin className="h-3 w-3" />
                {ticket.latitudine.toFixed(4)}, {ticket.longitudine.toFixed(4)}
              </div>
               {/* Bottoni di Azione Contestuali allo Stato */}
              {ticket.stato_ticket === 'DA_PRENDERE_IN_CARICO' && (
                <button
                  onClick={() => handleLock(ticket.id_segnalazione)}
                  className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Prendi in Carico
                </button>
              )}

              {ticket.stato_ticket === 'IN_LAVORAZIONE' && ticket.id_agente === 'AGENTE_001' && (
                resolvingId === ticket.id_segnalazione ? (
                  <div className="space-y-3 animate-in fade-in">
                    <textarea
                      value={esito}
                      onChange={(e) => setEsito(e.target.value)}
                      placeholder="Note intervento..."
                      className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResolvingId(null)}
                        className="flex-1 bg-slate-100 text-slate-700 font-medium py-2 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={() => handleResolve(ticket.id_segnalazione)}
                        disabled={!esito.trim()}
                        className="flex-1 bg-emerald-600 text-white font-medium py-2 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        Risolvi
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolvingId(ticket.id_segnalazione)}
                    className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Chiudi Intervento
                  </button>
                )
              )}

              {ticket.stato_ticket === 'RISOLTA' && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Esito:</span>
                  <p className="text-sm text-slate-700">{ticket.esito_risoluzione}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-medium">Nessuna segnalazione attiva</p>
            <p className="text-sm">Il feed è vuoto, ottimo lavoro!</p>
          </div>
        )}
      </div>
    </div>
  );
}
