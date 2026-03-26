import { Building2, Download, X, FileText, Calendar, BarChart3, AlertTriangle } from "lucide-react";
import SharedMap from "../components/SharedMap";
import { useState, useEffect } from "react";

// Vista Amministrativa (RBAC: ADMIN)
// Funge da Dashboard direzionale per i dipendenti comunali o per l'ente gestore dei parcheggi.
// Attualmente integra la mappa di calore (Heatmap) per il supporto decisionale urbanistico.
export default function AdminView() {
  // Gestione dello stato locale per il controllo della modale di esportazione, filtri temporali e dati della mappa.
  const [zones, setZones] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Funzione di utilità per la generazione dinamica e il download lato client di file CSV (Blob parsing).
  const downloadCSV = (headers, rows, filenamePrefix) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gestione asincrona per l'esportazione dello storico segnalazioni. 
  // Recupera i dati dal backend e li formatta per il file CSV gestendo eventuali caratteri speciali.
  const handleExportAbuse = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (!data || data.length === 0) {
        alert("Nessuna segnalazione trovata.");
        return;
      }
      const headers = ["ID Segnalazione", "Stato Ticket", "Timestamp Creazione", "Latitudine", "Longitudine", "Descrizione", "ID Agente", "Esito"];
      const rows = data.map(r => [
        r.id_segnalazione, 
        r.stato_ticket, 
        r.timestamp_creazione, 
        r.latitudine, 
        r.longitudine, 
        `"${(r.descrizione_abuso || "").replace(/"/g, '""')}"`, 
        r.id_agente || "", 
        r.esito_risoluzione || ""
      ]);
      downloadCSV(headers, rows, "storico_segnalazioni_abusi");
    } catch (err) {
      console.error(err);
      alert("Errore durante l'esportazione.");
    }
  };

  // Esportazione delle transazioni di sosta con filtri temporali (Data Inizio / Data Fine) 
  // passati dinamicamente come Query Parameters all'endpoint REST.
  const handleExportTransactions = async () => {
    try {
      let url = "/api/admin/export/transactions";
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      
      const data = await res.json();
      if (!data || data.length === 0) {
        alert("Nessuna transazione trovata per il periodo selezionato.");
        return;
      }
      const headers = ["ID Transazione", "Targa", "ID Stallo", "Inizio", "Fine Stimata", "Fine Effettiva", "Importo Base", "Sconto", "Importo Finale"];
      const rows = data.map(t => [
        t.id_transazione, 
        t.targa_registrata || "", 
        t.id_stallo, 
        t.orario_inizio, 
        t.orario_fine_stimato || "", 
        t.orario_fine_effettivo || "", 
        t.importo_base || "0", 
        t.sconto_incentivo || "0", 
        t.importo_finale || "0"
      ]);
      downloadCSV(headers, rows, "transazioni_sosta");
    } catch (err) {
      console.error(err);
      alert("Errore durante l'esportazione.");
    }
  };

  // Generazione di un report globale dello stato attuale ricavato direttamente dai dati della mappa (Heatmap data).
  const handleExportGlobal = () => {
    if (!zones || zones.length === 0) {
      alert("Nessun dato globale disponibile.");
      return;
    }
    
    const headers = ["ID Zona", "Nome Zona", "Tariffa Oraria", "ID Stallo", "Stato Stallo", "Latitudine", "Longitudine"];
    const rows = [];
    zones.forEach(zona => {
      zona.stalli.forEach(stallo => {
        rows.push([
          zona.id_zona,
          zona.nome_zona,
          zona.tariffa_oraria,
          stallo.id_stallo,
          stallo.stato,
          stallo.latitudine,
          stallo.longitudine
        ]);
      });
    });
    downloadCSV(headers, rows, "report_globale_parcheggi");
  };

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-hidden">
      <header className="bg-slate-900 text-white p-5 shadow-lg sticky top-0 z-20 border-b border-slate-800 shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight leading-none">SmartUrban Park</h1>
                <p className="text-xs text-slate-400 font-medium mt-1">Amministrazione e Supporto Decisionale</p>
              </div>
            </div>
            <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-semibold tracking-wide text-slate-300 sm:hidden">
              Amministratore
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Esporta Dati
            </button>
            <div className="hidden sm:block text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-semibold tracking-wide text-slate-300">
              Amministratore
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 animate-in fade-in duration-300 min-h-0 flex flex-col">
        <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          {/* Riutilizzo del componente SharedMap attivando la prop "showTimeMachine" */}
          <SharedMap showTimeMachine={true} onDataChange={setZones} />
        </div>
      </main>

      {/* Rendering condizionale della Modale di Esportazione (Export Modal) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <Download className="h-6 w-6 text-emerald-700" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Esportazione Dati Direzionali</h2>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <p className="text-sm text-slate-600">
                Seleziona il tipo di report da esportare in formato CSV. I dati scaricati sono ad uso esclusivo dell'amministrazione.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Storico Segnalazioni Abusi */}
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all bg-white flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-800">Storico Segnalazioni</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 flex-1">
                    Esporta il log completo delle segnalazioni di abuso inviate dai cittadini e dagli agenti.
                  </p>
                  <button 
                    onClick={handleExportAbuse}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-sm transition-colors"
                  >
                    Scarica CSV
                  </button>
                </div>

                {/* Option D: Report Globale */}
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all bg-white flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-800">Report Globale</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 flex-1">
                    Esporta lo stato attuale di tutti gli stalli, le zone e le tariffe (Heatmap data).
                  </p>
                  <button 
                    onClick={handleExportGlobal}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-sm transition-colors"
                  >
                    Scarica CSV
                  </button>
                </div>

                {/* Option B: Transazioni Sosta */}
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all bg-white col-span-1 md:col-span-2 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-800">Transazioni Sosta</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Esporta lo storico delle transazioni di sosta.
                    Puoi filtrare per data di inizio e fine.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Data Inizio</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Data Fine</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleExportTransactions}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
                  >
                    Scarica CSV Transazioni
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}