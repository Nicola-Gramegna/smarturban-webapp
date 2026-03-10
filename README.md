# SmartUrban Park - Piattaforma di Gestione Sosta

Progetto sviluppato per la tesi di laurea. L'applicativo è una Single Page Application (SPA) full-stack progettata per digitalizzare la gestione dei parcheggi urbani, integrando un assistente virtuale e un sistema di segnalazione per la Polizia Locale.

## Architettura e Tecnologie
* **Frontend:** React.js, Vite, Tailwind CSS, React-Router, React-Leaflet
* **Backend:** Node.js, Express.js
* **Database:** SQLite (tramite `better-sqlite3`)
* **Intelligenza Artificiale:** Integrazione RAG (Retrieval-Augmented Generation) per supporto contestuale all'utente.
* **Sicurezza:** Autenticazione stateless basata su JWT e Role-Based Access Control (RBAC).

## Avvio del progetto in locale
1. Installare le dipendenze con `npm install`
2. Avviare l'ambiente di sviluppo con `npm run dev`
3. Il server risponderà all'indirizzo `http://localhost:3000`