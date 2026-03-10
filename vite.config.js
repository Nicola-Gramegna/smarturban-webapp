import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// Questa è la configurazione principale di Vite per l'ambiente React
export default defineConfig(({mode}) => {
  // Carichiamo le variabili d'ambiente dal file .env.local per renderle disponibili durante il build
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Iniettiamo la chiave API per le chiamate dirette 
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        // Creiamo un alias '@' per importare comodamente i file partendo dalla root del progetto
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Abilitiamo l'Hot Module Replacement (HMR) per ricaricare automaticamente la pagina durante lo sviluppo locale
      hmr: true,
    },
  };
});
