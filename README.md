# ICE - Incident Compliance Engine

Piattaforma modulare per la generazione guidata di report di incidente basati sulla **Tassonomia Cyber ACN** (TC-ACN v2.0). Include GUI dinamica tipo wizard, modello dati estendibile, workflow di validazione. Completamente containerizzabile con Docker.

## 🚀 Caratteristiche

- ✅ **Wizard Guidato**: Costruisci incidenti step-by-step seguendo la tassonomia ACN
- 📊 **Export Multipli**: Genera report PDF, JSON
- 🏢 **Tassonomia ACN**: Basato sulla Tassonomia Cyber v2.0
- 🐳 **Docker Ready**: Deployment completo con docker-compose

## 📋 Requisiti

- Docker 20.10+
- Docker Compose 2.0+

## 🛠️ Installazione

### Quick Start

```bash
# Clona il repository
git clone git@github.com:FreeDurok/ICE-Incident-Compliance-Engine.git
cd ICE-Incident-Compliance-Engine

# Script di installazione dipendenze e avvio
./start.sh

# Oppure manualmente
docker-compose up -d
```

### Accesso ai Servizi

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📚 Utilizzo

### 1. Crea un Nuovo Incidente

1. Vai su http://localhost:3000
2. Clicca "Crea Nuovo Incidente"
3. Segui il wizard step-by-step:
   - **Step 1**: Info generali (titolo, descrizione)
   - **Step 2**: Baseline Characterization (Impact, Root Cause, Severity, Geography)
   - **Step 3**: Threat Type (tipologie di minaccia)
   - **Step 4**: Threat Actor (attore e motivazioni)
   - **Step 5**: Additional Context (asset, vettori, ecc.)
   - **Step 6**: Review e salvataggio

### 2. Visualizza Incidenti

- Lista completa: http://localhost:3000/incidents
- Dettaglio incidente con azioni di export

### 3. Export

Da ogni incidente puoi:
- 📄 **Export PDF**: Report formattato
- 💾 **Export JSON**: Dati strutturati

## 📸 Sreenshots

<img width="1157" height="764" alt="image" src="https://github.com/user-attachments/assets/63274e0a-5d17-41fa-8fd1-4f4356c53465" />
<img width="2494" height="1294" alt="image" src="https://github.com/user-attachments/assets/7feca546-6ff0-4a38-9fe7-f2b202fb913d" />
<img width="2489" height="1257" alt="image" src="https://github.com/user-attachments/assets/1df57ee8-828f-47bd-9eca-bfe943b1c1bd" />
<img width="2490" height="1224" alt="image" src="https://github.com/user-attachments/assets/c95045e8-3a82-494b-93cb-97a7ed4a894b" />
<img width="2491" height="1290" alt="image" src="https://github.com/user-attachments/assets/928d2835-fb2a-4f35-9c00-138b3e34a662" />
<img width="991" height="1249" alt="image" src="https://github.com/user-attachments/assets/156aca96-e843-4036-9364-fbf22c4dc115" />


## 📝 Tassonomia ACN

Questa piattaforma implementa la **Tassonomia Cyber CLEAR v2.0** dell'Agenzia per la Cybersicurezza Nazionale (ACN).

**Macrocategorie**:
- **BC** - Baseline Characterization
- **TT** - Threat Type
- **TA** - Threat Actor
- **AC** - Additional Context

Fonte: [ACN Tassonomia Cyber CLEAR](https://www.acn.gov.it/portale/documents/20119/552690/ACN_Tassonomia_Cyber_CLEAR.pdf/9595cc35-1c0b-4007-07b2-8f0468e5b82e?t=1762269780518)



