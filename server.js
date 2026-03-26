import express from "express";
// Inizializzazione sicura delle variabili d'ambiente (Dotenv) prima di ogni altra operazione
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Variabile di sicurezza per la firma dei Token JWT
// In produzione, questa chiave deve essere complessa e tenuta segreta
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-thesis";

// Inizializzazione del Database locale SQLite
const db = new Database("smarturban.db");

// DEFINIZIONE SCHEMA DATABASE (DDL)
// Creazione delle tabelle relazionali per il dominio "SmartUrban Park"
db.exec(`
  CREATE TABLE IF NOT EXISTS Zona_Parcheggio (
    id_zona TEXT PRIMARY KEY,
    nome_zona TEXT,
    tariffa_base_oraria REAL,
    capienza_totale_stalli INTEGER
  );

  CREATE TABLE IF NOT EXISTS Stallo (
    id_stallo TEXT PRIMARY KEY,
    id_zona TEXT,
    latitudine REAL,
    longitudine REAL,
    stato TEXT,
    FOREIGN KEY(id_zona) REFERENCES Zona_Parcheggio(id_zona)
  );

  CREATE TABLE IF NOT EXISTS Transazione (
    id_transazione TEXT PRIMARY KEY,
    targa_registrata TEXT,
    id_stallo TEXT,
    orario_inizio DATETIME,
    orario_fine_stimato DATETIME,
    orario_fine_effettivo DATETIME,
    importo_base REAL,
    sconto_incentivo REAL,
    importo_finale REAL,
    FOREIGN KEY(id_stallo) REFERENCES Stallo(id_stallo)
  );

  CREATE TABLE IF NOT EXISTS Segnalazione (
    id_segnalazione TEXT PRIMARY KEY,
    foto_url TEXT,
    descrizione_abuso TEXT,
    latitudine REAL,
    longitudine REAL,
    stato_ticket TEXT,
    timestamp_lock DATETIME,
    esito_risoluzione TEXT,
    id_agente TEXT,
    timestamp_creazione DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrazione dello schema a caldo (Hot Migration) per supportare il check-out anticipato
try {
  db.exec("ALTER TABLE Transazione ADD COLUMN orario_fine_effettivo DATETIME");
} catch (e) {
  // Column might already exist
}

// POPOLAMENTO DATI DI BASE (SEEDING)
// Inserimento dei dati demo per le zone e gli stalli se il DB è vuoto
const countZones = db.prepare("SELECT COUNT(*) as count FROM Zona_Parcheggio").get();
if (countZones.count === 0) {
  const seedData = [
    {
      "id_zona": "ZONA_MURAT",
      "nome_zona": "Murat",
      "tariffa_base_oraria": 2.00,
      "capienza_totale_stalli": 10,
      "stalli": [
        { "id_stallo": "MUR_001", "latitudine": 41.1214647, "longitudine": 16.8704423, "stato": "OCCUPATO" },
        { "id_stallo": "MUR_002", "latitudine": 41.1214355, "longitudine": 16.8699625, "stato": "OCCUPATO" },
        { "id_stallo": "MUR_003", "latitudine": 41.1214173, "longitudine": 16.8699644, "stato": "LIBERO" },
        { "id_stallo": "MUR_004", "latitudine": 41.1214465, "longitudine": 16.8704443, "stato": "OCCUPATO" },
        { "id_stallo": "MUR_005", "latitudine": 41.1213933, "longitudine": 16.8704512, "stato": "LIBERO" },
        { "id_stallo": "MUR_006", "latitudine": 41.1214123, "longitudine": 16.8704487, "stato": "OCCUPATO" },
        { "id_stallo": "MUR_007", "latitudine": 41.1213887, "longitudine": 16.8700732, "stato": "OCCUPATO" },
        { "id_stallo": "MUR_008", "latitudine": 41.1213701, "longitudine": 16.8700752, "stato": "OCCUPATO" },
        { "id_stallo": "MUR_009", "latitudine": 41.1254007, "longitudine": 16.8698302, "stato": "LIBERO" },
        { "id_stallo": "MUR_010", "latitudine": 41.1253811, "longitudine": 16.8698319, "stato": "OCCUPATO" }
      ]
    },
    {
      "id_zona": "ZONA_POGGIOFRANCO",
      "nome_zona": "Poggiofranco",
      "tariffa_base_oraria": 1.00,
      "capienza_totale_stalli": 10,
      "stalli": [
        { "id_stallo": "POG_001", "latitudine": 41.0960479, "longitudine": 16.8539146, "stato": "OCCUPATO" },
        { "id_stallo": "POG_002", "latitudine": 41.0958467, "longitudine": 16.8538392, "stato": "OCCUPATO" },
        { "id_stallo": "POG_003", "latitudine": 41.0957422, "longitudine": 16.8543709, "stato": "OCCUPATO" },
        { "id_stallo": "POG_004", "latitudine": 41.0958064, "longitudine": 16.8543616, "stato": "LIBERO" },
        { "id_stallo": "POG_005", "latitudine": 41.0958798, "longitudine": 16.8543530, "stato": "OCCUPATO" },
        { "id_stallo": "POG_006", "latitudine": 41.0960059, "longitudine": 16.8543406, "stato": "OCCUPATO" },
        { "id_stallo": "POG_007", "latitudine": 41.0960132, "longitudine": 16.8543094, "stato": "OCCUPATO" },
        { "id_stallo": "POG_008", "latitudine": 41.0960912, "longitudine": 16.8539662, "stato": "LIBERO" },
        { "id_stallo": "POG_009", "latitudine": 41.0960578, "longitudine": 16.8539528, "stato": "OCCUPATO" },
        { "id_stallo": "POG_010", "latitudine": 41.0960525, "longitudine": 16.8539470, "stato": "LIBERO" }
      ]
    },
    {
      "id_zona": "ZONA_CARRASSI",
      "nome_zona": "Carrassi",
      "tariffa_base_oraria": 1.50,
      "capienza_totale_stalli": 10,
      "stalli": [
        { "id_stallo": "CAR_001", "latitudine": 41.1063161, "longitudine": 16.8749534, "stato": "OCCUPATO" },
        { "id_stallo": "CAR_002", "latitudine": 41.1063111, "longitudine": 16.8748971, "stato": "OCCUPATO" },
        { "id_stallo": "CAR_003", "latitudine": 41.1057036, "longitudine": 16.8749746, "stato": "LIBERO" },
        { "id_stallo": "CAR_004", "latitudine": 41.1056833, "longitudine": 16.8750327, "stato": "OCCUPATO" },
        { "id_stallo": "CAR_005", "latitudine": 41.1061680, "longitudine": 16.8763222, "stato": "LIBERO" },
        { "id_stallo": "CAR_006", "latitudine": 41.1061409, "longitudine": 16.8762089, "stato": "OCCUPATO" },
        { "id_stallo": "CAR_007", "latitudine": 41.1060163, "longitudine": 16.8762072, "stato": "OCCUPATO" },
        { "id_stallo": "CAR_008", "latitudine": 41.1059734, "longitudine": 16.8762061, "stato": "LIBERO" },
        { "id_stallo": "CAR_009", "latitudine": 41.1059730, "longitudine": 16.8764517, "stato": "OCCUPATO" },
        { "id_stallo": "CAR_010", "latitudine": 41.1059730, "longitudine": 16.8765207, "stato": "OCCUPATO" }
      ]
    },
    {
      "id_zona": "ZONA_SAN_PASQUALE",
      "nome_zona": "San Pasquale",
      "tariffa_base_oraria": 1.50,
      "capienza_totale_stalli": 10,
      "stalli": [
        { "id_stallo": "SAN_001", "latitudine": 41.1118741, "longitudine": 16.8821952, "stato": "OCCUPATO" },
        { "id_stallo": "SAN_002", "latitudine": 41.1118854, "longitudine": 16.8822450, "stato": "OCCUPATO" },
        { "id_stallo": "SAN_003", "latitudine": 41.1119021, "longitudine": 16.8822987, "stato": "OCCUPATO" },
        { "id_stallo": "SAN_004", "latitudine": 41.1119315, "longitudine": 16.8823514, "stato": "LIBERO" },
        { "id_stallo": "SAN_005", "latitudine": 41.1119572, "longitudine": 16.8824151, "stato": "OCCUPATO" },
        { "id_stallo": "SAN_006", "latitudine": 41.1119854, "longitudine": 16.8824589, "stato": "OCCUPATO" },
        { "id_stallo": "SAN_007", "latitudine": 41.1120012, "longitudine": 16.8825121, "stato": "LIBERO" },
        { "id_stallo": "SAN_008", "latitudine": 41.1120456, "longitudine": 16.8825745, "stato": "OCCUPATO" },
        { "id_stallo": "SAN_009", "latitudine": 41.1120752, "longitudine": 16.8826214, "stato": "OCCUPATO" },
        { "id_stallo": "SAN_010", "latitudine": 41.1120984, "longitudine": 16.8826642, "stato": "LIBERO" }
      ]
    },
    {
      "id_zona": "ZONA_JAPIGIA",
      "nome_zona": "Japigia",
      "tariffa_base_oraria": 1.00,
      "capienza_totale_stalli": 10,
      "stalli": [
        { "id_stallo": "JAP_001", "latitudine": 41.1065142, "longitudine": 16.8924512, "stato": "OCCUPATO" },
        { "id_stallo": "JAP_002", "latitudine": 41.1065415, "longitudine": 16.8924884, "stato": "OCCUPATO" },
        { "id_stallo": "JAP_003", "latitudine": 41.1065752, "longitudine": 16.8925412, "stato": "LIBERO" },
        { "id_stallo": "JAP_004", "latitudine": 41.1065987, "longitudine": 16.8925945, "stato": "OCCUPATO" },
        { "id_stallo": "JAP_005", "latitudine": 41.1066314, "longitudine": 16.8926315, "stato": "LIBERO" },
        { "id_stallo": "JAP_006", "latitudine": 41.1066542, "longitudine": 16.8926887, "stato": "OCCUPATO" },
        { "id_stallo": "JAP_007", "latitudine": 41.1066874, "longitudine": 16.8927451, "stato": "OCCUPATO" },
        { "id_stallo": "JAP_008", "latitudine": 41.1067125, "longitudine": 16.8927842, "stato": "LIBERO" },
        { "id_stallo": "JAP_009", "latitudine": 41.1067458, "longitudine": 16.8928315, "stato": "OCCUPATO" },
        { "id_stallo": "JAP_010", "latitudine": 41.1067712, "longitudine": 16.8928742, "stato": "OCCUPATO" }
      ]
    },
    {
      "id_zona": "ZONA_LIBERTA",
      "nome_zona": "Libertà",
      "tariffa_base_oraria": 1.50,
      "capienza_totale_stalli": 10,
      "stalli": [
        { "id_stallo": "LIB_001", "latitudine": 41.1251458, "longitudine": 16.8554125, "stato": "OCCUPATO" },
        { "id_stallo": "LIB_002", "latitudine": 41.1251745, "longitudine": 16.8554652, "stato": "LIBERO" },
        { "id_stallo": "LIB_003", "latitudine": 41.1252012, "longitudine": 16.8555147, "stato": "OCCUPATO" },
        { "id_stallo": "LIB_004", "latitudine": 41.1252245, "longitudine": 16.8555612, "stato": "OCCUPATO" },
        { "id_stallo": "LIB_005", "latitudine": 41.1252514, "longitudine": 16.8556045, "stato": "OCCUPATO" },
        { "id_stallo": "LIB_006", "latitudine": 41.1252745, "longitudine": 16.8556512, "stato": "LIBERO" },
        { "id_stallo": "LIB_007", "latitudine": 41.1252984, "longitudine": 16.8556945, "stato": "OCCUPATO" },
        { "id_stallo": "LIB_008", "latitudine": 41.1253215, "longitudine": 16.8557412, "stato": "OCCUPATO" },
        { "id_stallo": "LIB_009", "latitudine": 41.1253542, "longitudine": 16.8557845, "stato": "LIBERO" },
        { "id_stallo": "LIB_010", "latitudine": 41.1253812, "longitudine": 16.8558314, "stato": "OCCUPATO" }
      ]
    },
    {
      "id_zona": "ZONA_MADONNELLA",
      "nome_zona": "Madonnella",
      "tariffa_base_oraria": 2.00,
      "capienza_totale_stalli": 10,
      "stalli": [
        { "id_stallo": "MAD_001", "latitudine": 41.1184512, "longitudine": 16.8851452, "stato": "OCCUPATO" },
        { "id_stallo": "MAD_002", "latitudine": 41.1184814, "longitudine": 16.8851945, "stato": "OCCUPATO" },
        { "id_stallo": "MAD_003", "latitudine": 41.1185045, "longitudine": 16.8852312, "stato": "LIBERO" },
        { "id_stallo": "MAD_004", "latitudine": 41.1185312, "longitudine": 16.8852745, "stato": "OCCUPATO" },
        { "id_stallo": "MAD_005", "latitudine": 41.1185645, "longitudine": 16.8853124, "stato": "OCCUPATO" },
        { "id_stallo": "MAD_006", "latitudine": 41.1185812, "longitudine": 16.8853645, "stato": "LIBERO" },
        { "id_stallo": "MAD_007", "latitudine": 41.1186124, "longitudine": 16.8854012, "stato": "OCCUPATO" },
        { "id_stallo": "MAD_008", "latitudine": 41.1186452, "longitudine": 16.8854452, "stato": "OCCUPATO" },
        { "id_stallo": "MAD_009", "latitudine": 41.1186714, "longitudine": 16.8854914, "stato": "OCCUPATO" },
        { "id_stallo": "MAD_010", "latitudine": 41.1187012, "longitudine": 16.8855312, "stato": "LIBERO" }
      ]
    }
  ];
  // Prepared Statements per ottimizzare l'inserimento massivo
  const insertZona = db.prepare("INSERT INTO Zona_Parcheggio (id_zona, nome_zona, tariffa_base_oraria, capienza_totale_stalli) VALUES (?, ?, ?, ?)");
  const insertStallo = db.prepare("INSERT INTO Stallo (id_stallo, id_zona, latitudine, longitudine, stato) VALUES (?, ?, ?, ?, ?)");
  
  // Transazione Atomica: se un inserimento fallisce, viene fatto il rollback di tutto
  db.transaction(() => {
    for (const zona of seedData) {
      insertZona.run(zona.id_zona, zona.nome_zona, zona.tariffa_base_oraria, zona.capienza_totale_stalli);
      for (const stallo of zona.stalli) {
        insertStallo.run(stallo.id_stallo, zona.id_zona, stallo.latitudine, stallo.longitudine, stallo.stato);
      }
    }
  })();
}

// Configurazione cartella uploads per le foto delle segnalazioni
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: "uploads/" });

// INIZIALIZZAZIONE SERVER E ROTTE API
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // API Routes

  // 1 Autenticazione (RBAC - Role Based Access Control)
  app.post("/api/auth/login", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    let role = "";
    let redirectUrl = "";

    // Assegnazione del ruolo e della route di destinazione in base al dominio email
    if (email.endsWith("@cittadino.it")) {
      role = "CITTADINO";
      redirectUrl = "/mobile-cittadino";
    } else if (email.endsWith("@poliziamunicip.it")) {
      role = "POLIZIA";
      redirectUrl = "/dashboard-polizia";
    } else if (email.endsWith("@amministrazione.it")) {
      role = "ADMIN";
      redirectUrl = "/dashboard-amministrazione";
    } else {
      return res.status(401).json({ error: "Dominio non riconosciuto" });
    }

    // Generazione del JSON Web Token per gestire la sessione in modo stateless
    const token = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, role, redirectUrl });
  });

  // 2 Gestione Parcheggi (Mappa)
  app.get("/api/zones", (req, res) => {
    const zones = db.prepare("SELECT * FROM Zona_Parcheggio").all();
    const stalli = db.prepare("SELECT * FROM Stallo").all();
    
    // Unione dei dati relazionali per il frontend
    const zonesWithStalls = zones.map((z) => ({
      ...z,
      stalli: stalli.filter((s) => s.id_zona === z.id_zona)
    }));

    res.json(zonesWithStalls);
  });

  // 2b. API Storica per Time Machine (Supporto Decisionale)
  // Permette di ricostruire lo stato di occupazione degli stalli a una data e ora specifica
  app.get("/api/zones/history", (req, res) => {
    const { date, time } = req.query;
    if (!date || !time) {
      return res.status(400).json({ error: "Missing date or time parameters" });
    }

    const targetDateTime = new Date(`${date}T${time}`).toISOString();

    const zones = db.prepare("SELECT * FROM Zona_Parcheggio").all();
    const stalli = db.prepare("SELECT * FROM Stallo").all();
    
    const zonesWithStalls = zones.map((z) => {
      const stalliForZone = stalli.filter((s) => s.id_zona === z.id_zona);
      
      const stalliHistory = stalliForZone.map((stallo) => {
        const transazione = db.prepare(`
          SELECT * FROM Transazione 
          WHERE id_stallo = ? 
          AND orario_inizio <= ? 
          AND COALESCE(orario_fine_effettivo, orario_fine_stimato) >= ?
          ORDER BY orario_inizio DESC LIMIT 1
        `).get(stallo.id_stallo, targetDateTime, targetDateTime);

        return {
          ...stallo,
          stato: transazione ? "OCCUPATO" : "LIBERO"
        };
      });

      return {
        ...z,
        stalli: stalliHistory
      };
    });

    res.json(zonesWithStalls);
  });

  // 3 Motore di Pagamento e Check-in Sosta
  app.post("/api/parking/checkin", (req, res) => {
    const { targa, idStallo, durata, hasCrowdsourcingBonus } = req.body; // durata in hours
    if (!targa || !idStallo || !durata) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const stallo = db.prepare("SELECT * FROM Stallo WHERE id_stallo = ?").get(idStallo);
    if (!stallo) {
      return res.status(404).json({ error: "Stallo not found" });
    }
    if (stallo.stato === "OCCUPATO") {
      return res.status(400).json({ error: "Stallo is already occupied" });
    }

    const zona = db.prepare("SELECT * FROM Zona_Parcheggio WHERE id_zona = ?").get(stallo.id_zona);
    
    // Logica di Business: Calcolo tariffa dinamica con applicazione incentivo Smart e bonus Crowdsourcing (Gamification)
    const importoBase = zona.tariffa_base_oraria * durata;
    const scontoPercentuale = hasCrowdsourcingBonus ? 0.20 : 0.15;
    const scontoIncentivo = importoBase * scontoPercentuale;
    const importoFinale = importoBase - scontoIncentivo;

    const idTransazione = crypto.randomUUID();
    const orarioInizio = new Date();
    const orarioFineStimato = new Date(orarioInizio.getTime() + durata * 60 * 60 * 1000);

    // Transazione per garantire la coerenza tra l'occupazione dello stallo e il pagamento
    db.transaction(() => {
      db.prepare("UPDATE Stallo SET stato = 'OCCUPATO' WHERE id_stallo = ?").run(idStallo);
      db.prepare(`
        INSERT INTO Transazione (id_transazione, targa_registrata, id_stallo, orario_inizio, orario_fine_stimato, importo_base, sconto_incentivo, importo_finale)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(idTransazione, targa, idStallo, orarioInizio.toISOString(), orarioFineStimato.toISOString(), importoBase, scontoIncentivo, importoFinale);
    })();

    res.json({
      success: true,
      idTransazione,
      importoBase,
      scontoIncentivo,
      importoFinale,
      message: "Sosta attivata con successo!"
    });
  });

  // 3b. Check-out Anticipato
  // Libera lo stallo prima della scadenza naturale e registra l'orario effettivo per analytics
  app.post("/api/parking/checkout", (req, res) => {
    const { idStallo, idTransazione } = req.body;
    
    if (!idStallo || !idTransazione) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const stallo = db.prepare("SELECT * FROM Stallo WHERE id_stallo = ?").get(idStallo);
    if (!stallo) return res.status(404).json({ error: "Stallo non trovato" });
    if (stallo.stato === "LIBERO") return res.status(400).json({ error: "Lo stallo è già libero" });

    db.transaction(() => {
      db.prepare("UPDATE Stallo SET stato = 'LIBERO' WHERE id_stallo = ?").run(idStallo);
      db.prepare("UPDATE Transazione SET orario_fine_effettivo = CURRENT_TIMESTAMP WHERE id_transazione = ?").run(idTransazione);
    })();

    res.json({
      success: true,
      message: "Sosta terminata con successo. Lo stallo è ora libero."
    });
  });

  // 3c. Sistema di Crowdsourcing: Segnala Stallo Libero
  // Gli utenti possono segnalare stalli appena liberati per ottenere un bonus sulla sosta successiva
  app.post("/api/parking/report-free", (req, res) => {
    const { idStallo } = req.body;
    
    if (!idStallo) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const stallo = db.prepare("SELECT * FROM Stallo WHERE id_stallo = ?").get(idStallo);
    if (!stallo) return res.status(404).json({ error: "Stallo non trovato" });
    if (stallo.stato === "LIBERO") return res.status(400).json({ error: "Lo stallo risulta già libero nel sistema." });

    db.transaction(() => {
      db.prepare("UPDATE Stallo SET stato = 'LIBERO' WHERE id_stallo = ?").run(idStallo);
      db.prepare(`
        UPDATE Transazione 
        SET orario_fine_effettivo = CURRENT_TIMESTAMP 
        WHERE id_stallo = ? AND orario_fine_effettivo IS NULL AND orario_fine_stimato > CURRENT_TIMESTAMP
      `).run(idStallo);
    })();

    res.json({
      success: true,
      message: "Grazie per il tuo contributo! Lo stallo è stato aggiornato come libero."
    });
  });

  // 4 Sistema Segnalazioni (Creazione)
  app.post("/api/reports", upload.single("foto"), (req, res) => {
    const { descrizione, lat, lng } = req.body;
    const fotoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!descrizione || !lat || !lng) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const idSegnalazione = crypto.randomUUID();
    db.prepare(`
      INSERT INTO Segnalazione (id_segnalazione, foto_url, descrizione_abuso, latitudine, longitudine, stato_ticket)
      VALUES (?, ?, ?, ?, ?, 'DA_PRENDERE_IN_CARICO')
    `).run(idSegnalazione, fotoUrl, descrizione, parseFloat(lat), parseFloat(lng));

    res.status(201).json({ idSegnalazione, message: "Segnalazione inviata con successo!" });
  });

  // 5 Sistema Segnalazioni (Lettura per la Polizia)
  app.get("/api/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM Segnalazione ORDER BY timestamp_creazione DESC").all();
    res.json(reports);
  });

  // 6 Sistema Segnalazioni (Presa in carico - Lock Optimistico)
  app.post("/api/reports/:id/lock", (req, res) => {
    const { id } = req.params;
    const { idAgente } = req.body;

    // Utilizziamo lo stato 'DA_PRENDERE_IN_CARICO' come condizione per evitare Race Conditions
    // tra agenti che provano ad accettare lo stesso ticket simultaneamente.
    const info = db.prepare(`
      UPDATE Segnalazione 
      SET stato_ticket = 'IN_LAVORAZIONE', id_agente = ?, timestamp_lock = CURRENT_TIMESTAMP
      WHERE id_segnalazione = ? AND stato_ticket = 'DA_PRENDERE_IN_CARICO'
    `).run(idAgente || "AGENTE_SCONOSCIUTO", id);

    if (info.changes === 0) {
      return res.status(409).json({ error: "Attenzione: Questa segnalazione è appena stata presa in carico da un'altra pattuglia." });
    }

    res.json({ success: true, message: "Ticket preso in carico. Recati sul posto, la segnalazione è nascosta ai colleghi." });
  });

  // 7 Sistema Segnalazioni (Chiusura Intervento)
  app.post("/api/reports/:id/resolve", (req, res) => {
    const { id } = req.params;
    const { esito } = req.body;

    db.prepare(`
      UPDATE Segnalazione 
      SET stato_ticket = 'RISOLTA', esito_risoluzione = ?
      WHERE id_segnalazione = ? AND stato_ticket = 'IN_LAVORAZIONE'
    `).run(esito, id);

    res.json({ success: true, message: "Intervento concluso. Feed aggiornato." });
  });

  // 8 Assistente AI (Agentic Pattern tramite Google Gemini)
  app.post("/api/ai/chat", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const getParkingAvailability = {
        name: "getParkingAvailability",
        description: "Recupera la disponibilità dei parcheggi. Se viene fornita una zona, restituisce gli stalli liberi in quella zona. Altrimenti, restituisce un riepilogo generale.",
        parameters: {
          type: "OBJECT",
          properties: {
            zona: {
              type: "STRING",
              description: "Il nome della zona (es. Murat, Poggiofranco, Carrassi, San Pasquale, Japigia, Libertà, Madonnella). Opzionale."
            }
          }
        }
      };

      const systemPrompt = `Sei l'assistente di SmartUrban Park.
      Il tuo compito è aiutare i cittadini a trovare parcheggio.
      Usa lo strumento getParkingAvailability per interrogare il database in tempo reale.
      Rispondi in modo conciso, utile e in italiano.
      Se l'utente chiede di una zona specifica, usa lo strumento passando il nome della zona.
      Se l'utente fa una richiesta generica, usa lo strumento senza parametri per ottenere un riepilogo.`;

      // 1° Chiamata a Gemini: L'AI valuta la domanda dell'utente e decide se ha bisogno di dati dal DB
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: [getParkingAvailability] }]
        }
      });

      let replyText = response.text;

      // Se Gemini ha deciso di utilizzare il nostro strumento (Function Calling)
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];

        if (call.name === "getParkingAvailability") {
          const args = call.args || {};

          let dbResult = "";
          
          // Esecuzione query SQL in base alla richiesta formulata da Gemini
          if (args.zona) {
            const zonaName = args.zona.toLowerCase();

            const zona = db.prepare("SELECT * FROM Zona_Parcheggio WHERE LOWER(nome_zona) LIKE ?").get(`%${zonaName}%`);

            if (zona) {
              const stalliLiberi = db.prepare("SELECT id_stallo FROM Stallo WHERE id_zona = ? AND stato = 'LIBERO'").all(zona.id_zona);

              if (stalliLiberi.length > 0) {
                const ids = stalliLiberi.map(s => s.id_stallo).join(", ");

                dbResult = `Nella zona ${zona.nome_zona} ci sono ${stalliLiberi.length} stalli liberi. Gli ID degli stalli liberi sono: ${ids}.
                La tariffa è di ${zona.tariffa_base_oraria}€/h.`;
              } else {
                dbResult = `Purtroppo nella zona ${zona.nome_zona} non ci sono stalli liberi al momento.`;
              }
            } else {
              dbResult = `Non ho trovato nessuna zona corrispondente a "${args.zona}".
              Le zone disponibili sono: Murat, Poggiofranco, Carrassi, San Pasquale, Japigia, Libertà, Madonnella.`;
            }
          } else {
            const zones = db.prepare("SELECT * FROM Zona_Parcheggio").all();

            const riepilogo = zones.map(z => {
              const liberi = db.prepare("SELECT COUNT(*) as count FROM Stallo WHERE id_zona = ? AND stato = 'LIBERO'").get(z.id_zona).count;
              return `${z.nome_zona}: ${liberi} posti liberi`;
            }).join("\\n");

            dbResult = `Riepilogo disponibilità:\\n${riepilogo}`;
          }

          // 2° Chiamata a Gemini: Passiamo i dati grezzi estratti dal DB per fargli elaborare una risposta naturale
          const secondResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              { role: "user", parts: [{ text: message }] },
              // Includiamo l'intero array 'parts' originale per preservare il thought_signature richiesto dall'API
              { role: "model", parts: response.candidates[0].content.parts },
              { role: "user", parts: [{ functionResponse: { name: call.name, response: { result: dbResult } } }] }
            ],
            config: {
              systemInstruction: systemPrompt
            }
          });

          replyText = secondResponse.text;
        }
      }

      res.json({ reply: replyText });

    } catch (error) {
      console.error("AI Error:", error);

      res.status(503).json({ error: "L'Assistente AI è momentaneamente sovraccarico. Riprova più tardi." });
    }
  });

  // API Export per Amministrazione
  // Generazione dinamica di dati per il download CSV con filtri temporali
  app.get("/api/admin/export/transactions", (req, res) => {
    const { startDate, endDate } = req.query;
    let query = "SELECT * FROM Transazione";
    const params = [];

    if (startDate && endDate) {
      query += " WHERE orario_inizio >= ? AND orario_inizio <= ?";
      params.push(`${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`);
    }

    query += " ORDER BY orario_inizio DESC";
    
    try {
      const transactions = db.prepare(query).all(...params);
      res.json(transactions);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export transactions" });
    }
  });

  // Integrazione del bundler Vite come middleware per l'ambiente di sviluppo
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Configurazione statica per l'ambiente di produzione
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();