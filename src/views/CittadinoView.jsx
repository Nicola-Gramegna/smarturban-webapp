import { useState, useRef, useEffect } from "react";
import { Car, MapPin, Camera, MessageSquare, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function CittadinoView() {
  // Gestione della navigazione inferiore (Bottom Tab Navigation) tipica delle app Mobile
  const [activeTab, setActiveTab] = useState("pay");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight">SmartUrban</h1>
          </div>
          <div className="text-xs bg-indigo-500 px-2 py-1 rounded-full font-medium">
            Cittadino
          </div>
        </div>
      </header>
       {/* Area principale di rendering dinamico dei componenti */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 overflow-y-auto pb-24">
        {activeTab === "pay" && <PaymentTab />}
        {activeTab === "report" && <ReportTab />}
        {activeTab === "chat" && <ChatTab />}
      </main>

       {/* Bottom Navigation Bar */}
      <nav className="bg-white border-t border-slate-200 fixed bottom-0 w-full z-10">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <button
            onClick={() => setActiveTab("pay")}
            className={"flex flex-col items-center p-2 rounded-xl w-1/3 transition-colors " + (activeTab === "pay" ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:bg-slate-50")}
          >
            <Car className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Sosta</span>
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={"flex flex-col items-center p-2 rounded-xl w-1/3 transition-colors " + (activeTab === "report" ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:bg-slate-50")}
          >
            <Camera className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Segnala</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={"flex flex-col items-center p-2 rounded-xl w-1/3 transition-colors " + (activeTab === "chat" ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:bg-slate-50")}
          >
            <MessageSquare className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Assistente</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
//Sotto-componente: Gestione Pagamento Smart
function PaymentTab() {
  const [targa, setTarga] = useState("");
  const [idStallo, setIdStallo] = useState("");
  const [durata, setDurata] = useState(1);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState(null);

  const handlePayment = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/parking/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targa, idStallo, durata }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore nel pagamento");
      
      setStatus("success");
      setMessage(data.message);
      setReceipt(data);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Smart Payment</h2>
        <p className="text-sm text-slate-500 mb-6">Paga la sosta e ottieni lo sconto digitale.</p>

        {status === "success" && receipt ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3 text-emerald-700">
              <CheckCircle className="h-6 w-6" />
              <h3 className="font-semibold">Pagamento Confermato</h3>
            </div>
            <div className="space-y-2 text-sm text-emerald-800">
              <div className="flex justify-between">
                <span>Importo Base:</span>
                <span>€{receipt.importoBase.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Sconto Incentivo (15%):</span>
                <span>-€{receipt.scontoIncentivo.toFixed(2)}</span>
              </div>
              <div className="border-t border-emerald-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Totale Pagato:</span>
                <span>€{receipt.importoFinale.toFixed(2)}</span>
              </div>
              <div className="text-xs text-emerald-600 mt-4 opacity-70">
                ID Transazione: {receipt.idTransazione.substring(0, 8)}...
              </div>
            </div>
            <button 
              onClick={() => { setStatus("idle"); setReceipt(null); setTarga(""); setIdStallo(""); }}
              className="mt-5 w-full bg-emerald-600 text-white rounded-lg py-2 font-medium hover:bg-emerald-700 transition-colors"
            >
              Nuova Sosta
            </button>
          </div>
        ) : (
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Targa Veicolo</label>
              <input
                type="text"
                required
                value={targa}
                onChange={(e) => setTarga(e.target.value.toUpperCase())}
                placeholder="AB123CD"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-lg uppercase transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">ID Stallo</label>
              <input
                type="text"
                required
                value={idStallo}
                onChange={(e) => setIdStallo(e.target.value.toUpperCase())}
                placeholder="es. MUR_003"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-lg uppercase transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Durata Stimata (Ore)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={durata}
                  onChange={(e) => setDurata(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="font-bold text-xl text-indigo-600 w-12 text-center">{durata}h</span>
              </div>
            </div>

            {status === "error" && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-indigo-600 text-white font-semibold rounded-xl py-3.5 shadow-sm hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-6"
            >
              {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Paga Ora"}
            </button>
          </form>
        )}
      </div>
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Segnala Abuso</h2>
        <p className="text-sm text-slate-500 mb-6">Aiuta a mantenere l'ordine in città.</p>

        {status === "success" ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-emerald-800 text-lg mb-1">Segnalazione Inviata</h3>
            <p className="text-emerald-600 text-sm mb-6">Grazie per il tuo contributo. La Polizia Locale è stata avvisata.</p>
            <button 
              onClick={() => setStatus("idle")}
              className="w-full bg-emerald-600 text-white rounded-lg py-2.5 font-medium hover:bg-emerald-700 transition-colors"
            >
              Nuova Segnalazione
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Foto dell'infrazione</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden"
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="h-32 w-full object-cover rounded-lg" />
                ) : (
                  <div className="py-6 flex flex-col items-center text-slate-500">
                    <Camera className="h-8 w-8 mb-2 text-slate-400" />
                    <span className="text-sm font-medium">Scatta o carica foto</span>
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
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Posizione GPS</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={status === "locating"}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {status === "locating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  {location ? "Posizione Acquisita" : "Acquisisci Posizione"}
                </button>
              </div>
              {location && (
                <p className="text-xs text-emerald-600 mt-2 font-mono">
                  Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Descrizione</label>
              <textarea
                required
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Es. Auto parcheggiata su strisce pedonali..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all min-h-[100px]"
              />
            </div>

            {status === "error" && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !location}
              className="w-full bg-indigo-600 text-white font-semibold rounded-xl py-3.5 shadow-sm hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {status === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Invia Segnalazione"}
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
    { role: "ai", text: "Ciao! Sono l'assistente virtuale di SmartUrban. Come posso aiutarti oggi? Puoi chiedermi informazioni sui parcheggi liberi o sulle tariffe." }
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
    // Aggiornamento ottimistico della UI
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
      setMessages(prev => [...prev, { role: "ai", text: "Scusa, " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={"max-w-[80%] rounded-2xl px-4 py-2.5 text-sm " + (msg.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm")}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              <span className="text-slate-500">Sto pensando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chiedi all'assistente..."
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white p-3 rounded-full shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
