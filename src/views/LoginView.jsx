import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarFront, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginView() {
  // Gestione dello stato locale (Controlled Components in React).
  // I valori degli input sono legati direttamente allo stato di React per avere validazione in tempo reale.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Stato aggiuntivo per gestire il toggle di visibilità della password (Miglioramento UX)
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  //hook per il routing programmatico lato client
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    //Preveniamo il ricaricamento naturale del form HTML per gestire tutto tramite fetch asincrona
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Invio credenziali. In un ambiente reale, la password verrebbe convertita in hash lato client o inviata sempre sotto HTTPS
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      //Salvataggio del JWT (JSON Web Token) nel LocalStorage per mantenere la sessione
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      
      // Reindirizzamento basato sul ruolo (RBAC) restituito dal backend
      navigate(data.redirectUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-200 selection:text-blue-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg border border-blue-500">
            <CarFront className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          SmartUrban Park
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500 uppercase tracking-wider">
          Portale Ufficiale Mobilità
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white py-10 px-6 shadow-2xl sm:rounded-3xl sm:px-12 border border-slate-200">
    
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2"
              >
                Indirizzo Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  placeholder="nome@dominio.it"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2"
              >
                Password
              </label>
              <div className="mt-1 relative">
                {/* Logica di toggle per la visibilità della password gestita tramite stato booleano (showPassword) */}
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Rendering condizionale per i messaggi di errore (Feedback UI/UX) */}
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 shadow-sm">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-rose-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-70 transition-all"
              >
                {loading ? "Accesso in corso..." : "Accedi al Portale"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400 font-medium text-xs uppercase tracking-wider">
                  Accessi di Test
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 text-xs font-medium text-slate-500 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="flex justify-between px-2"><span>Cittadino:</span> <span className="font-mono text-slate-700">@cittadino.it</span></p>
              <p className="flex justify-between px-2"><span>Polizia Locale:</span> <span className="font-mono text-slate-700">@poliziamunicip.it</span></p>
              <p className="flex justify-between px-2"><span>Amministrazione:</span> <span className="font-mono text-slate-700">@amministrazione.it</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}