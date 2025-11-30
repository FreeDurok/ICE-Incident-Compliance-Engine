#!/bin/bash

# Script di avvio ICE - Incident Compliance Engine
# Installa dipendenze se necessario e avvia l'applicazione

set -e  # Esce in caso di errore

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL dell'applicazione
APP_URL="http://localhost:3000"
API_URL="http://localhost:8000"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║       ICE - Incident Compliance Engine                 ║"
echo "║       Setup & Startup Script                           ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Funzione per verificare se un comando esiste
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Funzione per installare Docker su Ubuntu/Debian
install_docker_debian() {
    echo -e "${YELLOW}📦 Installazione Docker su Ubuntu/Debian...${NC}"

    # Aggiorna il sistema
    sudo apt-get update

    # Installa prerequisiti
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # Aggiungi chiave GPG di Docker
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # Aggiungi repository Docker
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Installa Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Aggiungi utente corrente al gruppo docker
    sudo usermod -aG docker $USER

    echo -e "${GREEN}✅ Docker installato con successo${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Esegui 'newgrp docker' o fai logout/login per applicare i permessi del gruppo docker${NC}"
}

# Verifica sistema operativo
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            echo "debian"
        elif [ -f /etc/redhat-release ]; then
            echo "redhat"
        elif [ -f /etc/arch-release ]; then
            echo "arch"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

# Controlla e installa Docker
check_docker() {
    if command_exists docker; then
        echo -e "${GREEN}✅ Docker già installato: $(docker --version)${NC}"
    else
        echo -e "${RED}❌ Docker non trovato${NC}"

        OS=$(detect_os)

        if [ "$OS" == "debian" ]; then
            read -p "Vuoi installare Docker automaticamente? (s/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Ss]$ ]]; then
                install_docker_debian
            else
                echo -e "${RED}Docker è richiesto per eseguire ICE. Installalo manualmente da: https://docs.docker.com/engine/install/${NC}"
                exit 1
            fi
        elif [ "$OS" == "macos" ]; then
            echo -e "${YELLOW}Su macOS, installa Docker Desktop da: https://www.docker.com/products/docker-desktop${NC}"
            exit 1
        else
            echo -e "${YELLOW}Sistema operativo: $OS${NC}"
            echo -e "${RED}Installa Docker manualmente da: https://docs.docker.com/engine/install/${NC}"
            exit 1
        fi
    fi
}

# Controlla Docker Compose
check_docker_compose() {
    if docker compose version >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker Compose già installato: $(docker compose version)${NC}"
    elif command_exists docker-compose; then
        echo -e "${GREEN}✅ Docker Compose (standalone) già installato: $(docker-compose --version)${NC}"
    else
        echo -e "${RED}❌ Docker Compose non trovato${NC}"
        echo -e "${YELLOW}Docker Compose dovrebbe essere installato insieme a Docker. Verifica l'installazione.${NC}"
        exit 1
    fi
}

# Verifica che Docker sia in esecuzione
check_docker_running() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker daemon non è in esecuzione${NC}"
        echo -e "${YELLOW}Avvia Docker e riprova${NC}"

        OS=$(detect_os)
        if [ "$OS" == "debian" ] || [ "$OS" == "linux" ]; then
            echo -e "${YELLOW}Prova con: sudo systemctl start docker${NC}"
        fi
        exit 1
    fi
    echo -e "${GREEN}✅ Docker daemon in esecuzione${NC}"
}

# Ferma container esistenti
stop_existing_containers() {
    echo -e "${YELLOW}🛑 Verifica container esistenti...${NC}"

    if docker compose ps --quiet 2>/dev/null | grep -q .; then
        echo -e "${YELLOW}Fermando container esistenti...${NC}"
        docker compose down
        echo -e "${GREEN}✅ Container fermati${NC}"
    fi
}

# Avvia i servizi
start_services() {
    echo -e "${BLUE}🚀 Avvio dei servizi ICE...${NC}"
    echo ""

    # Build e avvio
    docker compose up -d --build

    echo ""
    echo -e "${GREEN}✅ Servizi avviati con successo!${NC}"
}

# Attendi che i servizi siano pronti
wait_for_services() {
    echo -e "${YELLOW}⏳ Attendo che i servizi siano pronti...${NC}"

    # Attendi MongoDB
    echo -n "   MongoDB: "
    for i in {1..30}; do
        if docker compose exec -T mongo mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done

    # Attendi Backend
    echo -n "   Backend API: "
    for i in {1..30}; do
        if curl -s "$API_URL/api/taxonomy/macrocategories" >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done

    # Attendi Frontend
    echo -n "   Frontend: "
    for i in {1..30}; do
        if curl -s "$APP_URL" >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done

    echo ""
}

# Mostra informazioni di accesso
show_access_info() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║  🎉 ICE è pronto!                                      ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${BLUE}📱 Applicazione Web:${NC}"
    echo -e "   ${GREEN}➜${NC} ${YELLOW}$APP_URL${NC}"
    echo ""
    echo -e "${BLUE}🔧 API Backend:${NC}"
    echo -e "   ${GREEN}➜${NC} ${YELLOW}$API_URL${NC}"
    echo -e "   ${GREEN}➜${NC} Docs: ${YELLOW}$API_URL/docs${NC}"
    echo ""
    echo -e "${BLUE}📊 MongoDB:${NC}"
    echo -e "   ${GREEN}➜${NC} localhost:27017"
    echo ""
    echo -e "${BLUE}📝 Comandi utili:${NC}"
    echo -e "   ${GREEN}➜${NC} Visualizza logs:  ${YELLOW}docker compose logs -f${NC}"
    echo -e "   ${GREEN}➜${NC} Ferma servizi:    ${YELLOW}docker compose down${NC}"
    echo -e "   ${GREEN}➜${NC} Riavvia servizi:  ${YELLOW}docker compose restart${NC}"
    echo -e "   ${GREEN}➜${NC} Stato servizi:    ${YELLOW}docker compose ps${NC}"
    echo ""

    # Prova ad aprire il browser automaticamente
    if command_exists xdg-open; then
        echo -e "${YELLOW}🌐 Apertura automatica del browser...${NC}"
        xdg-open "$APP_URL" 2>/dev/null &
    elif command_exists open; then
        echo -e "${YELLOW}🌐 Apertura automatica del browser...${NC}"
        open "$APP_URL" 2>/dev/null &
    else
        echo -e "${YELLOW}💡 Apri manualmente il browser all'indirizzo: $APP_URL${NC}"
    fi

    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Verifica prerequisiti...${NC}"
    echo ""

    check_docker
    check_docker_compose
    check_docker_running

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    stop_existing_containers

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    start_services

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    wait_for_services

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    show_access_info
}

# Esegui lo script
main
