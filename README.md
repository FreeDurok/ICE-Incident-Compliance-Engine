# ICE - Incident Compliance Engine

Piattaforma modulare per la generazione guidata di report di incidente basati sulla **Tassonomia Cyber ACN** (TC-ACN v2.0). Include GUI dinamica tipo wizard, modello dati estendibile, workflow di validazione. Completamente containerizzabile con Docker.

## 🚀 Caratteristiche

- ✅ **Wizard Guidato**: Costruisci incidenti step-by-step seguendo la tassonomia ACN
- 📊 **Export Multipli**: Genera report PDF, JSON
- 🏢 **Tassonomia ACN**: Basato sulla Tassonomia Cyber v2.0
- 🐳 **Docker Ready**: Deployment completo con docker-compose
- 🔗 **Integrazione MISP**: Export automatico in formato MISP Event

## 📋 Requisiti

- Docker 20.10+
- Docker Compose 2.0+

## 🛠️ Installazione

### Quick Start

```bash
# Clona il repository
git clone git@github.com:FreeDurok/ICE-Incident-Compliance-Engine.git
cd ICE-Incident-Compliance-Engine

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


## 📝 Tassonomia ACN

Questa piattaforma implementa la **Tassonomia Cyber CLEAR v2.0** dell'Agenzia per la Cybersicurezza Nazionale (ACN).

**Macrocategorie**:
- **BC** - Baseline Characterization
- **TT** - Threat Type
- **TA** - Threat Actor
- **AC** - Additional Context

Fonte: [ACN Tassonomia Cyber CLEAR](https://www.acn.gov.it/portale/documents/20119/552690/ACN_Tassonomia_Cyber_CLEAR.pdf/9595cc35-1c0b-4007-07b2-8f0468e5b82e?t=1762269780518)



