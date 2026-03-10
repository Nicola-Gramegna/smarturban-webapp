import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Entry point principale dell'applicazione React.
// Utilizziamo createRoot (introdotto in React 18) per abilitare il rendering concorrente.
createRoot(document.getElementById('root')).render(
  // StrictMode è un tool di sviluppo che attiva controlli aggiuntivi (es. rilevamento di side-effect impuri 
  // eseguendo un doppio render in locale) per garantire la solidità del codice.
  <StrictMode>
    <App />
  </StrictMode>,
);
