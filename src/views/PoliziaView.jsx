import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, Clock, MapPin, Loader2 } from "lucide-react";
import SharedMap from "../components/SharedMap";

export default function PoliziaView() {
  // Gestione della navigazione a schede interna alla vista (Tab Navigation)
  const [activeTab, setActiveTab] = useState("map");

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 overflow-hidden">
      <header className="bg-slate-900 text-white p-5 shadow-lg sticky top-0 z-20 border-b border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight leading-none">SmartUrban Park</h1>
                <p className="text-xs text-slate-400 font-medium mt-1">Centrale Operativa Polizia Locale</p>
              </div>
            </div>
            <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-semibold tracking-wide text-slate-300 md:hidden">
              Agente
            </div>
          </div>
          {/* Controlli di navigazione ottimizzati per dispositivi mobili e desktop (Responsive UI) */}
          <div className="flex gap-2 md:gap-4 items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar lg:hidden">
            <button
              onClick={() => setActiveTab("map")}
              className={"whitespace-nowrap px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-sm " + (activeTab === "map" ? "bg-blue-600 text-white shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700")}
            >
              Mappa Operativa
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={"whitespace-nowrap px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-sm " + (activeTab === "tickets" ? "bg-blue-600 text-white shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700")}
            >
              Gestione Segnalazioni
            </button>
            <div className="hidden md:block text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-semibold tracking-wide text-slate-300 ml-2">
              Agente
            </div>
          </div>
          <div className="hidden lg:block text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-semibold tracking-wide text-slate-300">
            Agente
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 animate-in fade-in duration-300 min-h-0 flex flex-col">
        <div className="flex-1 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start h-full min-h-0">
          <div className={`h-full ${activeTab === "map" ? "block" : "hidden lg:block"}`}>
            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-200 overflow-hidden h-full flex flex-col">
              {/* Il componente SharedMap viene riutilizzato qui senza la TimeMachine per una visione live */}
              <SharedMap showTimeMachine={false} />
            </div>
          </div>
          <div className={`h-full overflow-y-auto ${activeTab === "tickets" ? "block" : "hidden lg:block"}`}>
            <TicketsTab />
          </div>
        </div>
      </main>
    </div>
  );
}

// Sotto-componente per la gestione del workflow dei Ticket e degli abusi
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
      console.error("Error fetching tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // Short-polling per aggiornare il feed delle emergenze ogni 5 secondi in tempo reale
    const interval = setInterval(fetchTickets, 5000); 
    return () => clearInterval(interval);
  }, []);

  // Presa in carico del ticket (Lock ottimistico per evitare conflitti di concorrenza tra pattuglie)
  const handleLock = async (id) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/reports/" + id + "/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Simuliamo l'estrazione dell'ID Agente dal token di sessione attuale per tracciare l'operatore
        body: JSON.stringify({ idAgente: "AGENTE_001" }), 
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          // Gestione specifica dell'errore 409 Conflict se un altro agente ha già preso in carico il ticket
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

  // Risoluzione finale del ticket con inserimento dell'esito
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
      {/* Feedback UI: Segnalazione visiva di eventuali errori di concorrenza */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id_segnalazione} className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-2xl">
            {ticket.foto_url ? (
              <img src={ticket.foto_url} alt="Abuso" className="h-56 w-full object-cover border-b border-slate-100" />
            ) : (
              <div className="h-56 bg-slate-50 flex flex-col items-center justify-center text-slate-400 border-b border-slate-100">
                <Shield className="h-10 w-10 mb-2 opacity-20" />
                <span className="text-sm font-medium uppercase tracking-wider">Nessuna foto</span>
              </div>
            )}
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                {/* Badge dinamico che cambia stile in base allo stato del ticket */}
                <span className={"text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm border " + (
                  ticket.stato_ticket === 'DA_PRENDERE_IN_CARICO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  ticket.stato_ticket === 'IN_LAVORAZIONE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}>
                  {ticket.stato_ticket.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(ticket.timestamp_creazione).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              <p className="text-slate-700 text-base font-medium mb-5 flex-1 leading-relaxed">{ticket.descrizione_abuso}</p>
              
              <div className="text-xs text-slate-600 mb-6 flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono shadow-inner">
                <MapPin className="h-4 w-4 text-blue-500" />
                {ticket.latitudine.toFixed(5)}, {ticket.longitudine.toFixed(5)}
              </div>

              {/* Bottoni di Azione Contestuali allo Stato */}
              {ticket.stato_ticket === 'DA_PRENDERE_IN_CARICO' && (
                <button
                  onClick={() => handleLock(ticket.id_segnalazione)}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-slate-200"
                >
                  Prendi in Carico
                </button>
              )}

              {ticket.stato_ticket === 'IN_LAVORAZIONE' && ticket.id_agente === 'AGENTE_001' && (
                resolvingId === ticket.id_segnalazione ? (
                  <div className="space-y-3 animate-in fade-in bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
                    <textarea
                      value={esito}
                      onChange={(e) => setEsito(e.target.value)}
                      placeholder="Note intervento ufficiale..."
                      className="w-full text-sm p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setResolvingId(null)}
                        className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={() => handleResolve(ticket.id_segnalazione)}
                        disabled={!esito.trim()}
                        className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-md"
                      >
                        Risolvi
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolvingId(ticket.id_segnalazione)}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-200"
                  >
                    Chiudi Intervento
                  </button>
                )
              )}

              {ticket.stato_ticket === 'RISOLTA' && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-inner">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Esito Ufficiale:</span>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{ticket.esito_risoluzione}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 mb-1">Nessuna segnalazione attiva</p>
            <p className="text-sm font-medium text-slate-500">Il feed operativo è vuoto, la situazione è sotto controllo.</p>
          </div>
        )}
      </div>
    </div>
  );
}