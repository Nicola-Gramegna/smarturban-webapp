import { useState, useRef, useEffect } from "react";
import { CarFront, MapPin, Camera, MessageSquare, Send, CheckCircle, AlertCircle, Loader2, Clock, X, Info, Download, FileText, ShieldCheck, FileBadge } from "lucide-react";
import { jsPDF } from "jspdf";

// --- COMPONENTE MODAL RIUTILIZZABILE ---
// Gestione centralizzata delle finestre modali per la UI/UX.
function InfoModal({ isOpen, onClose, title, text, icon: Icon, colorClass, onConfirm, confirmText, preventCloseOnConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`p-6 ${colorClass} text-white flex justify-between items-start`}>
          <div className="flex items-center gap-4">
            {Icon && <div className="bg-white/20 p-3 rounded-2xl shadow-inner"><Icon className="h-8 w-8" /></div>}
            <h3 className="font-extrabold text-xl tracking-tight leading-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-8 text-slate-700 text-lg leading-relaxed font-medium">
          {text}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors shadow-sm text-lg"
          >
            {onConfirm ? "Annulla" : "Ho capito"}
          </button>
          {onConfirm && (
            <button 
              onClick={() => { 
                onConfirm(); 
                if (!preventCloseOnConfirm) onClose(); 
              }} 
              className={`flex-1 py-3.5 ${colorClass} hover:opacity-90 text-white font-bold rounded-xl transition-colors shadow-sm text-lg`}
            >
              {confirmText || "Conferma"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MODALE CHECKOUT CON PDF ---
// Gestisce l'intento di fine sosta offrendo il download opzionale della ricevuta PDF.
function CheckoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/20"><FileBadge className="h-8 w-8 text-blue-400" /></div>
            <h3 className="font-extrabold text-xl tracking-tight leading-tight">Termine Sosta</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-8 text-slate-700 text-lg leading-relaxed font-medium">
          La sosta sta per terminare. La ricevuta attuale non sarà più visibile. Desideri salvare una copia in PDF per le tue note spese?
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <button 
            onClick={() => onConfirm(true)} 
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg flex justify-center items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Sì, scarica PDF e termina
          </button>
          <button 
            onClick={() => onConfirm(false)} 
            className="w-full py-4 bg-white border-2 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all shadow-sm text-lg"
          >
            No, termina sosta
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CittadinoView() {
  // Gestione della navigazione inferiore (Bottom Tab Navigation) tipica delle app Mobile.
  const [activeTab, setActiveTab] = useState("pay");
  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 overflow-hidden">
      <header className="bg-slate-900 text-white p-5 shadow-lg sticky top-0 z-20 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <CarFront className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight leading-none">SmartUrban Park</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Portale Ufficiale Mobilità</p>
            </div>
          </div>
          <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full font-semibold tracking-wide text-slate-300">
            Cittadino
          </div>
        </div>
      </header>

      {/* Area principale di rendering dinamico dei componenti */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 pb-28 pt-6 lg:pb-6 min-h-0 flex flex-col">
        <div className="flex-1 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start h-full min-h-0">
          <div className={`h-full overflow-y-auto hide-scrollbar ${activeTab === "pay" ? "block" : "hidden lg:block"}`}>
            <ParkingTab />
          </div>
          <div className={`h-full overflow-y-auto hide-scrollbar ${activeTab === "report" ? "block" : "hidden lg:block"}`}>
            <ReportTab />
          </div>
          <div className={`h-full overflow-y-auto hide-scrollbar ${activeTab === "chat" ? "block" : "hidden lg:block"}`}>
            <ChatTab />
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full z-10 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:hidden">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <button
            onClick={() => setActiveTab("pay")}
            className={"flex flex-col items-center p-3 rounded-2xl w-1/3 transition-all duration-200 " + (activeTab === "pay" ? "text-blue-700 bg-blue-50 shadow-sm" : "text-slate-500 hover:bg-slate-50")}
          >
            <CarFront className={"h-6 w-6 mb-1.5 " + (activeTab === "pay" ? "stroke-[2.5px]" : "")} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Sosta</span>
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={"flex flex-col items-center p-3 rounded-2xl w-1/3 transition-all duration-200 " + (activeTab === "report" ? "text-blue-700 bg-blue-50 shadow-sm" : "text-slate-500 hover:bg-slate-50")}
          >
            <Camera className={"h-6 w-6 mb-1.5 " + (activeTab === "report" ? "stroke-[2.5px]" : "")} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Segnala</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={"flex flex-col items-center p-3 rounded-2xl w-1/3 transition-all duration-200 " + (activeTab === "chat" ? "text-blue-700 bg-blue-50 shadow-sm" : "text-slate-500 hover:bg-slate-50")}
          >
            <MessageSquare className={"h-6 w-6 mb-1.5 " + (activeTab === "chat" ? "stroke-[2.5px]" : "")} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Assistente</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// Sotto-componente: Gestione Pagamento Smart e Crowdsourcing
function ParkingTab() {
  const [targa, setTarga] = useState("");
  const [zones, setZones] = useState([]);
  const [selectedZonaId, setSelectedZonaId] = useState("");
  const [selectedStalloId, setSelectedStalloId] = useState("");
  const [orarioFine, setOrarioFine] = useState("");
  
  // Stato per il calcolo dinamico dell'importo stimato (Surge Pricing)
  const [liveImporto, setLiveImporto] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  // Stato della sessione attiva persistente nel localStorage
  const [activeSession, setActiveSession] = useState(() => {
    const saved = localStorage.getItem("activeParkingSession");
    return saved ? JSON.parse(saved) : null;
  });

  // Gestione incentivo Gamification (sconto) acquisito tramite crowdsourcing
  const [hasCrowdsourcingBonus, setHasCrowdsourcingBonus] = useState(() => {
    return localStorage.getItem("crowdsourcingBonus") === "true";
  });

  const [showReportFreeModal, setShowReportFreeModal] = useState(false);
  const [showStrictConfirmModal, setShowStrictConfirmModal] = useState(false);
  const [reportStalloId, setReportStalloId] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showIncentivoInfo, setShowIncentivoInfo] = useState(false);

  const fetchZones = () => {
    fetch("/api/zones")
      .then(res => res.json())
      .then(data => setZones(data))
      .catch(err => console.error("Failed to load zones", err));
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Persistenza della sessione di sosta ad ogni aggiornamento
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem("activeParkingSession", JSON.stringify(activeSession));
    } else {
      localStorage.removeItem("activeParkingSession");
    }
  }, [activeSession]);

  // Hook per il calcolo reattivo dell'importo stimato basato sulla zona selezionata e il bonus
  useEffect(() => {
    if (selectedZonaId && orarioFine) {
      const zona = zones.find(z => z.id_zona === selectedZonaId);
      if (zona) {
        const now = new Date();
        const [hours, minutes] = orarioFine.split(":");
        const endTime = new Date();
        endTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        
        if (endTime > now) {
          const diffMs = endTime - now;
          const diffHours = diffMs / (1000 * 60 * 60);
          const importoBase = diffHours * zona.tariffa_base_oraria;
          const scontoPercentuale = hasCrowdsourcingBonus ? 0.20 : 0.15;
          const sconto = importoBase * scontoPercentuale;
          setLiveImporto(importoBase - sconto);
        } else {
          setLiveImporto(0);
        }
      }
    } else {
      setLiveImporto(0);
    }
  }, [selectedZonaId, orarioFine, zones, hasCrowdsourcingBonus]);

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!selectedZonaId || !selectedStalloId || !orarioFine) {
      setMessage("Compila tutti i campi");
      setStatus("error");
      return;
    }

    const now = new Date();
    const [hours, minutes] = orarioFine.split(":");
    const endTime = new Date();
    endTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    if (endTime <= now) {
      setMessage("L'orario di fine sosta deve essere nel futuro");
      setStatus("error");
      return;
    }

    const durata = (endTime - now) / (1000 * 60 * 60);

    setStatus("loading");
    try {
      const res = await fetch("/api/parking/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targa, idStallo: selectedStalloId, durata, hasCrowdsourcingBonus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore nel check-in");
      
      setStatus("idle");
      // Creazione della sessione in locale a seguito del successo lato server
      setActiveSession({
        idTransazione: data.idTransazione,
        targa,
        idStallo: selectedStalloId,
        inizio: new Date().toISOString(),
        scadenza: endTime.toISOString(),
        importo: data.importoFinale,
        importoBase: data.importoBase,
        scontoIncentivo: data.scontoIncentivo
      });
      setMessage("");
      
      // Reset del bonus crowdsourcing una volta utilizzato
      if (hasCrowdsourcingBonus) {
        setHasCrowdsourcingBonus(false);
        localStorage.removeItem("crowdsourcingBonus");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  // Funzione lato client per la generazione documentale (PDF) tramite jsPDF.
  const generatePDF = async (session) => {
    const doc = new jsPDF();
    // Colori istituzionali
    const primaryColor = [15, 23, 42]; // slate-900
    const secondaryColor = [71, 85, 105]; // slate-600
    const accentColor = [37, 99, 235]; // blue-600
    
    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Draw Vector Logo (Stylized P for Parking)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.5);
    doc.roundedRect(95, 8, 20, 20, 4, 4, 'S'); // Outer box
    doc.setFillColor(255, 255, 255);
    doc.rect(102, 13, 2, 10, 'F'); // P stem
    doc.path([
      { op: 'm', c: [102, 13] },
      { op: 'l', c: [106, 13] },
      { op: 'c', c: [106, 13, 110, 13, 110, 16] },
      { op: 'c', c: [110, 19, 106, 19, 106, 19] },
      { op: 'l', c: [102, 19] }
    ]);
    doc.fill();
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Comune di Bari", 105, 38, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("SmartUrban Park - Ricevuta Ufficiale di Sosta", 105, 44, { align: "center" });
    
    // Body
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Dettagli Transazione", 20, 65);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(20, 70, 190, 70);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    
    const startY = 82;
    const lineSpacing = 8;
    
    const drawRow = (label, value, y) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...secondaryColor);
      doc.text(label, 20, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text(value, 80, y);
    };

    drawRow("ID Transazione:", session.idTransazione.toString(), startY);
    drawRow("Targa Veicolo:", session.targa, startY + lineSpacing);
    drawRow("ID Stallo:", session.idStallo, startY + lineSpacing * 2);
    
    const startDate = new Date(session.inizio).toLocaleString('it-IT');
    const endDate = new Date(session.scadenza).toLocaleString('it-IT');
    drawRow("Inizio Sosta:", startDate, startY + lineSpacing * 3);
    drawRow("Fine Sosta:", endDate, startY + lineSpacing * 4);
    
    // Pricing Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.5);
    doc.roundedRect(20, 130, 170, 55, 3, 3, 'FD');
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text("Importo Base", 30, 145);
    doc.text(`€ ${session.importoBase ? session.importoBase.toFixed(2) : "0.00"}`, 180, 145, { align: "right" });

    doc.text("Sconti Applicati", 30, 155);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`- € ${session.scontoIncentivo ? session.scontoIncentivo.toFixed(2) : "0.00"}`, 180, 155, { align: "right" });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(30, 162, 180, 162);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("Importo Totale Pagato", 30, 175);
    
    doc.setFontSize(20);
    doc.setTextColor(...accentColor);
    doc.text(`€ ${session.importo.toFixed(2)}`, 180, 175, { align: "right" });
    
    // Institutional Box
    doc.setFillColor(240, 249, 255); // sky-50
    doc.setDrawColor(186, 230, 253); // sky-200
    doc.roundedRect(20, 195, 170, 45, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(3, 105, 161); // sky-700
    doc.text("Incentivo Mobilità Sostenibile", 25, 205);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42); // slate-900
    const instText = "Iniziativa finanziata tramite fondi PNRR Missione Mobilità Sostenibile 2026 e PN Metro Plus 2021-2027 per la decongestione urbana.";
    const splitText = doc.splitTextToSize(instText, 160);
    doc.text(splitText, 25, 213);
    
    doc.setFont("helvetica", "bold");
    const discountText = "Sconto fisso per i residenti dell'Area Metropolitana di Bari pari al 15% sul totale della sosta.";
    const splitDiscountText = doc.splitTextToSize(discountText, 160);
    doc.text(splitDiscountText, 25, 228);
    
    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("Documento generato automaticamente dal sistema SmartUrban Park.", 105, 270, { align: "center" });
    doc.text("Conservare per i propri registri fiscali o note spese.", 105, 275, { align: "center" });
    
    doc.save(`Ricevuta_Sosta_${session.targa}_${session.idTransazione}.pdf`);
  };

  const handleCheckoutIntent = () => {
    setShowCheckoutModal(true);
  };

  // Funzione di check-out anticipato: libera lo stallo sul backend e gestisce il PDF
  const confirmCheckout = async (downloadPdf) => {
    if (downloadPdf) {
      await generatePDF(activeSession);
    }
    
    setStatus("loading");
    try {
      const res = await fetch("/api/parking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idTransazione: activeSession.idTransazione, idStallo: activeSession.idStallo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore nel check-out");
      
      setStatus("idle");
      setActiveSession(null);
      setTarga("");
      setSelectedZonaId("");
      setSelectedStalloId("");
      setOrarioFine("");
      setShowCheckoutModal(false);
      setMessage("Sosta terminata con successo.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
      setShowCheckoutModal(false);
    }
  };

  // Funzionalità di Crowdsourcing: permette ai cittadini di segnalare gli stalli liberati non ancora censiti dal sistema
  const handleReportFree = async () => {
    if (!reportStalloId) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/parking/report-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idStallo: reportStalloId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore nella segnalazione");
      
      setStatus("idle");
      setReportStalloId("");
      setMessage("Stallo segnalato come libero. Grazie per il contributo!");
      
      // Assegnazione del bonus (Gamification) nel local storage
      setHasCrowdsourcingBonus(true);
      localStorage.setItem("crowdsourcingBonus", "true");
      
      fetchZones(); // Aggiorna la disponibilità zone per gli stalli successivi
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  // Rendering della sessione attiva (Ticket di sosta digitale)
  if (activeSession) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          
          <div className="flex items-center justify-between mb-8 mt-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Sosta Attiva</h2>
            <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-emerald-200 shadow-sm">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              In corso
            </div>
          </div>

          <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Targa</span>
              <span className="font-mono font-bold text-slate-900 text-xl bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{activeSession.targa}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Stallo</span>
              <span className="font-mono font-bold text-slate-900 text-xl">{activeSession.idStallo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Scadenza</span>
              <span className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {new Date(activeSession.scadenza).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-5 border-t border-slate-200 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Incentivo Sostenibilità</span>
                <button onClick={() => setShowIncentivoInfo(true)} className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 p-1 rounded-full">
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <span className="font-bold text-emerald-600 text-lg">- € {activeSession.scontoIncentivo ? activeSession.scontoIncentivo.toFixed(2) : "0.00"}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Importo Finale</span>
              <span className="font-black text-3xl text-blue-600">€ {activeSession.importo.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckoutIntent}
            disabled={status === "loading"}
            className="w-full bg-slate-900 text-white font-bold rounded-2xl py-4 shadow-lg hover:shadow-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-lg"
          >
            {status === "loading" ? <Loader2 className="h-6 w-6 animate-spin" /> : "Termina Sosta Anticipatamente"}
          </button>
        </div>
        
        <CheckoutModal 
          isOpen={showCheckoutModal} 
          onClose={() => setShowCheckoutModal(false)} 
          onConfirm={confirmCheckout} 
        />

        <InfoModal
          isOpen={showIncentivoInfo}
          onClose={() => setShowIncentivoInfo(false)}
          title="Incentivo Mobilità"
          icon={Info}
          colorClass="bg-blue-600"
          text={
            <div className="space-y-4">
              <p>Iniziativa finanziata tramite fondi PNRR Missione Mobilità Sostenibile 2026 e PN Metro Plus 2021-2027 per la decongestione urbana.</p>
              <p className="font-bold text-blue-900 bg-blue-50 p-3 rounded-xl border border-blue-200">Sconto fisso per i residenti dell'Area Metropolitana di Bari pari al 15% sul totale della sosta.</p>
            </div>
          }
        />
      </div>
    );
  }

  // Rendering del form di nuova sosta
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-7 w-7 text-blue-600" />
          <h2 className="text-2xl font-extrabold text-slate-900">Nuova Sosta</h2>
        </div>
        <p className="text-slate-500 mb-8 font-medium">Portale Ufficiale Mobilità - Inserisci i dati del veicolo.</p>

        <form onSubmit={handleCheckin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Targa Veicolo</label>
            <input
              type="text"
              required
              value={targa}
              onChange={(e) => setTarga(e.target.value.toUpperCase())}
              placeholder="AB123CD"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xl uppercase transition-all shadow-inner"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Zona</label>
              <select
                required
                value={selectedZonaId}
                onChange={(e) => {
                  setSelectedZonaId(e.target.value);
                  setSelectedStalloId("");
                }}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-medium transition-all shadow-inner appearance-none"
              >
                <option value="" disabled>Seleziona Zona</option>
                {zones.map(z => (
                  <option key={z.id_zona} value={z.id_zona}>
                    {z.nome_zona} (€{z.tariffa_base_oraria.toFixed(2)}/h)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Stallo</label>
              <select
                required
                value={selectedStalloId}
                onChange={(e) => setSelectedStalloId(e.target.value)}
                disabled={!selectedZonaId}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 font-medium transition-all shadow-inner appearance-none disabled:opacity-50"
              >
                <option value="" disabled>Seleziona Stallo</option>
                {selectedZonaId && zones.find(z => z.id_zona === selectedZonaId)?.stalli.map(s => (
                  <option key={s.id_stallo} value={s.id_stallo} disabled={s.stato === "OCCUPATO"}>
                    {s.id_stallo} {s.stato === "OCCUPATO" ? "(Occupato)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Orario Fine Sosta</label>
            <div className="flex items-center gap-4">
              <input
                type="time"
                required
                value={orarioFine}
                onChange={(e) => setOrarioFine(e.target.value)}
                className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xl transition-all shadow-inner"
              />
              <div className="bg-blue-50 border border-blue-200 px-5 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[100px] shadow-sm">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Costo Stimato</span>
                <span className="font-black text-xl text-blue-700">€ {liveImporto.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {status === "error" && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <span className="font-medium">{message}</span>
            </div>
          )}
          
          {message && status === "idle" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              <span className="font-medium">{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-blue-600 text-white font-bold rounded-2xl py-4 shadow-lg hover:shadow-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-8 text-lg"
          >
            {status === "loading" ? <Loader2 className="h-6 w-6 animate-spin" /> : "Autorizza Pagamento"}
          </button>
        </form>
      </div>

      {/* Sezione Segnala Stallo Libero (Crowdsourcing) */}
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200">
            <MapPin className="h-6 w-6 text-slate-700" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Segnala stallo libero</h3>
            <p className="text-sm text-slate-500 mb-2 font-medium leading-relaxed">Contribuisci alla comunità segnalando un parcheggio appena liberato. Riceverai un extra sconto del 5% sulla tua prossima sosta.</p>
            <p className="text-xs text-amber-600 font-bold mb-4 bg-amber-50 p-2 rounded-lg border border-amber-200 inline-block">Attenzione: l'incentivo non è cumulabile (massimo 5% di extra sconto totale)</p>
            <br />
            <button
              onClick={() => setShowReportFreeModal(true)}
              className="bg-white text-slate-700 font-bold px-5 py-2.5 rounded-xl shadow-sm border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm"
            >
              Segnala Stallo Libero
            </button>
          </div>
        </div>
      </div>

      <InfoModal
        isOpen={showReportFreeModal}
        onClose={() => { setShowReportFreeModal(false); setReportStalloId(""); }}
        title="Segnala Stallo Libero"
        icon={MapPin}
        colorClass="bg-slate-800"
        text={
          <div className="space-y-4">
            <p className="text-sm">Inserisci l'ID dello stallo che hai trovato libero per aggiornare la mappa in tempo reale.</p>
            <input
              type="text"
              value={reportStalloId}
              onChange={(e) => setReportStalloId(e.target.value.toUpperCase())}
              placeholder="es. MUR_003"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-lg uppercase transition-all"
            />
          </div>
        }
        onConfirm={() => {
          setShowReportFreeModal(false);
          setShowStrictConfirmModal(true);
        }}
        confirmText="Procedi"
        preventCloseOnConfirm={true}
      />

      <InfoModal
        isOpen={showStrictConfirmModal}
        onClose={() => setShowStrictConfirmModal(false)}
        title="Conferma Segnalazione"
        icon={AlertCircle}
        colorClass="bg-rose-600"
        text="ATTENZIONE: Stai per inviare una segnalazione ufficiale al sistema di mobilità cittadina. L'abuso di questa funzione (es. segnalazioni false per accumulare credito) comporta la sospensione dell'account e possibili sanzioni amministrative. Confermi che lo stallo è realmente libero?"
        onConfirm={handleReportFree}
        confirmText="Comprendo e Confermo"
      />
    </div>
  );
}

// Sotto-componente: Segnalazione Abusi
function ReportTab() {
  const [descrizione, setDescrizione] = useState("");
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  // Gestione della preview dell'immagine lato client tramite FileReader API
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Integrazione con HTML5 Geolocation API
  const getLocation = () => {
    setStatus("locating");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setStatus("idle");
        },
        (error) => {
          console.warn("GPS error, using fallback", error);
          //Coordinate di fallback (Centro direzionale) nel caso il device non abbia il GPS attivo
          setLocation({ lat: 41.125, lng: 16.866 });
          setStatus("idle");
        },
        { timeout: 5000 }
      );
    } else {
      setLocation({ lat: 41.125, lng: 16.866 });
      setStatus("idle");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setMessage("Acquisisci prima la posizione GPS");
      setStatus("error");
      return;
    }
    
    setStatus("loading");
    try {
      // Utilizzo di FormData per permettere l'invio combinato di testo e file binari (immagini) al backend
      const formData = new FormData();
      formData.append("descrizione", descrizione);
      formData.append("lat", location.lat.toString());
      formData.append("lng", location.lng.toString());
      if (foto) {
        formData.append("foto", foto);
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        body: formData, // Non impostare il Content-Type manualmente con FormData, il browser aggiungerà automaticamente il boundary multipart
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore nell'invio");
      
      setStatus("success");
      setMessage(data.message);
      setDescrizione("");
      setFoto(null);
      setFotoPreview(null);
      setLocation(null);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="h-7 w-7 text-rose-600" />
          <h2 className="text-2xl font-extrabold text-slate-900">Segnala Abuso</h2>
        </div>
        <p className="text-slate-500 mb-8 font-medium">Invia una segnalazione ufficiale alla Polizia Locale.</p>

        {status === "success" ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-inner">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-bold text-emerald-900 text-xl mb-2">Segnalazione Inviata</h3>
            <p className="text-emerald-700 font-medium mb-8">Grazie per il tuo contributo. La Polizia Locale è stata avvisata e prenderà in carico la richiesta.</p>
            <button 
              onClick={() => setStatus("idle")}
              className="w-full bg-emerald-600 text-white rounded-xl py-3.5 font-bold hover:bg-emerald-700 transition-colors shadow-md"
            >
              Nuova Segnalazione
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Prova Fotografica</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-all relative overflow-hidden bg-slate-50/50"
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="h-40 w-full object-cover rounded-xl shadow-sm" />
                ) : (
                  <div className="py-8 flex flex-col items-center text-slate-500">
                    <div className="bg-white p-3 rounded-full shadow-sm border border-slate-200 mb-3">
                      <Camera className="h-8 w-8 text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Scatta o carica foto</span>
                    <span className="text-xs text-slate-400 mt-1">Obbligatoria per la validità</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" // Richiama la fotocamera posteriore sui dispositivi mobile
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Coordinate GPS</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={status === "locating"}
                  className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  {status === "locating" ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                  {location ? "Posizione Acquisita" : "Acquisisci Posizione"}
                </button>
              </div>
              {location && (
                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-slate-600 font-mono font-medium">
                    Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Dettagli Infrazione</label>
              <textarea
                required
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Es. Auto parcheggiata su strisce pedonali, targa visibile..."
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all min-h-[120px] shadow-inner resize-none"
              />
            </div>

            {status === "error" && (
               <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
                 <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                 <span className="font-medium">{message}</span>
               </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !location}
              className="w-full bg-slate-900 text-white font-bold rounded-2xl py-4 shadow-lg hover:shadow-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-4 text-lg"
            >
              {status === "loading" ? <Loader2 className="h-6 w-6 animate-spin" /> : "Invia Segnalazione Ufficiale"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Sotto-componente: Interfaccia Conversazionale (Chatbot)
function ChatTab() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Benvenuto nel servizio di assistenza virtuale SmartUrban Park. Come posso supportarla oggi?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll all'ultimo messaggio inserito
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    
    // Aggiornamento ottimistico della UI prima della ricezione della risposta dal server
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Errore di comunicazione");
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Si è verificato un errore di sistema: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-4 px-2 shrink-0">
        <MessageSquare className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-extrabold text-slate-900">Assistente Virtuale</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white rounded-3xl shadow-xl border border-slate-200 p-5 mb-4 space-y-5 min-h-[400px]">
        {messages.map((msg, i) => (
          <div key={i} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={"max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm " + (msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm font-medium" : "bg-slate-100 text-slate-800 rounded-bl-sm font-medium border border-slate-200")}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm px-5 py-4 text-sm flex items-center gap-3 border border-slate-200 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-slate-500 font-medium">Elaborazione richiesta...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi la tua richiesta..."
          className="flex-1 px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-md text-sm font-medium transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white p-4 rounded-2xl shadow-md hover:shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 shrink-0 flex items-center justify-center"
        >
          <Send className="h-6 w-6 ml-1" />
        </button>
      </form>
    </div>
  );
}