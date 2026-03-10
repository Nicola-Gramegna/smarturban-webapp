import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginView from "./views/LoginView";
import CittadinoView from "./views/CittadinoView";
import PoliziaView from "./views/PoliziaView";
import AdminView from "./views/AdminView";

// Componente Radice che gestisce il Routing dell'applicazione.
// Implementiamo un'architettura SPA (Single Page Application) per evitare ricaricamenti 
// completi della pagina e mantenere lo stato globale fluido.
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginView />} />
        {/* Viste Protette basate sui Ruoli (RBAC - Role Based Access Control).
            Nota architetturale: la vera protezione avviene lato backend tramite JWT, 
            qui separiamo puramente i layout e i flussi per i diversi attori del sistema. */}
        <Route path="/mobile-cittadino" element={<CittadinoView />} />
        <Route path="/dashboard-polizia" element={<PoliziaView />} />
        <Route path="/dashboard-amministrazione" element={<AdminView />} />

        {/* Fallback Catch-all: Reindirizza qualsiasi URL non riconosciuto alla pagina di login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
