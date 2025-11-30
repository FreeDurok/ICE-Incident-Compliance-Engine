FROM python:3.11-slim

WORKDIR /app

# Copia requirements e installa dipendenze Python
# Non servono dipendenze di sistema: psycopg2-binary è pre-compilato
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice dell'applicazione
COPY . .

# Esponi porta
EXPOSE 8000

# Comando di avvio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
