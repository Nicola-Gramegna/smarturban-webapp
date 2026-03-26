import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2, Calendar, Clock } from "lucide-react";

// Componente "SharedMap": Progettato per essere riutilizzato in due viste (Polizia, Admin)
// centralizzando la logica di rendering cartografico e la fetch dei dati.
// Novità: Supporta la "Time Machine" per la visualizzazione storica e l'innalzamento dello stato (lifting state up) tramite onDataChange.
export default function SharedMap({ showTimeMachine = false, onDataChange }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Gestione dello stato per i filtri temporali della mappa (Time Machine)
  const [targetDate, setTargetDate] = useState("");
  const [targetTime, setTargetTime] = useState("");
  const [isTimeMachineActive, setIsTimeMachineActive] = useState(false);

  useEffect(() => {
    // Funzione asincrona per recuperare lo stato degli stalli dal nostro backend Node.js
    const fetchZones = async () => {
      try {
        let url = "/api/zones";
        
        // Se la Time Machine è attiva, sovrascrive l'URL per richiamare l'API storica
        if (isTimeMachineActive && targetDate && targetTime) {
          url = `/api/zones/history?date=${targetDate}&time=${targetTime}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        setZones(data);
        
        // Callback opzionale per passare i dati elaborati al componente genitore (es. per esportazione CSV in AdminView)
        if (onDataChange) {
          onDataChange(data);
        }
      } catch (err) {
        console.error("Error fetching zones", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchZones();
    
    // Implementazione del pattern "Short-Polling": interroghiamo il server ogni 10 secondi 
    // per simulare un aggiornamento real-time (più leggero rispetto a implementare WebSockets per questa specifica esigenza).
    // Il polling si interrompe automaticamente se l'utente sta consultando dati storici.
    if (!isTimeMachineActive) {
      const interval = setInterval(fetchZones, 10000); // Poll every 10s
      // Cleanup function per evitare memory leaks quando il componente viene smontato
      return () => clearInterval(interval);
    }
  }, [isTimeMachineActive, targetDate, targetTime]);

  // Attiva la modalità Time Machine validando la presenza dei parametri temporali
  const handleApplyFilter = () => {
    if (targetDate && targetTime) {
      setIsTimeMachineActive(true);
    } else {
      setIsTimeMachineActive(false);
    }
  };

  // Disattiva la modalità Time Machine e ripristina la visualizzazione in tempo reale
  const handleResetFilter = () => {
    setTargetDate("");
    setTargetTime("");
    setIsTimeMachineActive(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col xl:flex-row justify-between items-center gap-4 relative z-[1000] shrink-0">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-center xl:text-left w-full xl:w-auto justify-center xl:justify-start">
          <MapPin className="h-5 w-5 text-indigo-600 shrink-0" />
          {showTimeMachine ? "Time-Machine Heatmap" : "Mappa di Calore in Tempo Reale"}
        </h2>
        
        {/* Controlli UI per l'attivazione della Time Machine (Rendering Condizionale) */}
        {showTimeMachine && (
          <div className="flex flex-wrap items-center justify-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full xl:w-auto">
            <div className="flex items-center gap-2 px-2">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <input 
                type="date" 
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent w-32"
              />
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2 px-2">
              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
              <input 
                type="time" 
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent w-24"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center mt-2 sm:mt-0">
              <button 
                onClick={handleApplyFilter}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                Applica Filtro
              </button>
              {isTimeMachineActive && (
                <button 
                  onClick={handleResetFilter}
                  className="bg-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-4 text-sm font-medium w-full xl:w-auto justify-center xl:justify-end">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600">Libero</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-600">Occupato</span>
          </div>
        </div>
      </div>
      <div className="flex-1 relative z-0 min-h-0">
        <MapContainer center={[41.117, 16.87]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {zones.map((zona) =>
            zona.stalli.map((stallo) => (
              <CircleMarker
                key={stallo.id_stallo}
                center={[stallo.latitudine, stallo.longitudine]}
                radius={8}
                pathOptions={{
                  fillColor: stallo.stato === "LIBERO" ? "#10b981" : "#ef4444",
                  color: "white",
                  weight: 1,
                  fillOpacity: 0.8,
                }}
              >
                <Popup>
                  <div className="font-sans">
                    <strong className="block text-sm mb-1">{zona.nome_zona}</strong>
                    <span className="text-xs text-slate-500">Stallo: {stallo.id_stallo}</span><br/>
                    <span className={stallo.stato === "LIBERO" ? "text-xs font-bold text-emerald-600" : "text-xs font-bold text-red-600"}>
                      {stallo.stato}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))
          )}
        </MapContainer>
      </div>
    </div>
  );
}