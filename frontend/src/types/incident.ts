/**
 * Tipi TypeScript per gli incidenti
 * Struttura v3.0: schema dinamico basato su taxonomy_codes
 */

export interface Incident {
  id: string;
  title: string;
  description?: string;
  discovered_at?: string;

  // SCHEMA DINAMICO - Indipendente dalla struttura della tassonomia
  // Le chiavi sono nel formato "BC:IM", "TT:MA", "AC:IN:HW-CS" ecc.
  // I valori sono array di codici completi (es. ["BC:IM_AC", "BC:IM_DA"])
  taxonomy_codes: Record<string, string[]>;

  // Dettagli/note per ogni codice specifico
  code_details?: Record<string, string>;

  // Metadati
  tags: string[];
  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface IncidentCreate {
  title: string;
  description?: string;
  discovered_at?: string;

  // Schema dinamico
  taxonomy_codes?: Record<string, string[]>;
  code_details?: Record<string, string>;

  // Metadati
  tags?: string[];
  notes?: string;
}

export interface IncidentSummary {
  id: string;
  title: string;
  created_at: string;

  // Conteggi dinamici per macrocategoria
  bc_count: number;
  tt_count: number;
  ta_count: number;
  ac_count: number;

  // Primo codice severity per display veloce
  severity_code?: string;
}
