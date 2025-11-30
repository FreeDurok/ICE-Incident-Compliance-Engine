/**
 * Helper utilities per gestione dinamica della tassonomia ACN
 * Equivalente TypeScript di backend/app/utils/taxonomy_helpers.py
 */

/**
 * Estrae la chiave gerarchica dal codice tassonomia per raggruppamento.
 *
 * Gestisce automaticamente:
 * - Predicati semplici: BC:IM_AC -> BC:IM
 * - Predicati con subpredicati: AC:IN_HW-CS_SR -> AC:IN:HW-CS
 *
 * @param code - Codice tassonomia completo (es. "BC:IM_AC")
 * @returns Chiave gerarchica per raggruppamento (es. "BC:IM" o "AC:IN:HW-CS")
 *
 * @example
 * buildTaxonomyKey("BC:IM_AC") // "BC:IM"
 * buildTaxonomyKey("TT:MA_RA") // "TT:MA"
 * buildTaxonomyKey("AC:IN_HW-CS_SR") // "AC:IN:HW-CS"
 * buildTaxonomyKey("AC:IN_IT_CO") // "AC:IN:IT"
 */
export function buildTaxonomyKey(code: string): string {
  if (!code.includes(':')) {
    return code; // Fallback per codici malformati
  }

  const parts = code.split(':');
  if (parts.length !== 2) {
    return code;
  }

  const [macro, value] = parts;

  if (!value.includes('_')) {
    return code; // Fallback
  }

  // Split sul primo underscore
  const valueParts = value.split('_');
  const predicate = valueParts[0];

  // Check se è AC:IN (l'unico con subpredicati)
  if (macro === 'AC' && predicate === 'IN' && valueParts.length > 1) {
    // Formato: IN_SUBPRED_VALUE
    // Subpred può essere: HW-CS, SW-SS, IT, PE, LO, OT, ecc.
    const rest = valueParts.slice(1).join('_');

    // Se contiene underscore, prendiamo la parte prima dell'underscore
    // Altrimenti prendiamo tutto (per subpred a 2 lettere come IT, PE)
    const subpred = rest.includes('_') ? rest.split('_')[0] : rest;

    return `${macro}:${predicate}:${subpred}`;
  }

  // Predicato semplice
  return `${macro}:${predicate}`;
}

/**
 * Parsea una chiave tassonomia nei suoi componenti.
 *
 * @param key - Chiave tassonomia (es. "BC:IM" o "AC:IN:HW-CS")
 * @returns Tuple [macrocategory, predicate, subpredicate]
 *
 * @example
 * parseTaxonomyKey("BC:IM") // ["BC", "IM", null]
 * parseTaxonomyKey("AC:IN:HW-CS") // ["AC", "IN", "HW-CS"]
 */
export function parseTaxonomyKey(key: string): [string, string, string | null] {
  const parts = key.split(':');

  if (parts.length === 2) {
    return [parts[0], parts[1], null];
  } else if (parts.length === 3) {
    return [parts[0], parts[1], parts[2]];
  } else {
    return [key, '', null];
  }
}

/**
 * Raggruppa una lista di codici per chiave tassonomia.
 *
 * @param codes - Lista di codici tassonomia
 * @returns Record con codici raggruppati per chiave
 *
 * @example
 * const codes = ["BC:IM_AC", "BC:IM_DA", "TT:MA_RA", "AC:IN_HW-CS_SR"];
 * groupCodesByTaxonomyKey(codes)
 * // {
 * //   'BC:IM': ['BC:IM_AC', 'BC:IM_DA'],
 * //   'TT:MA': ['TT:MA_RA'],
 * //   'AC:IN:HW-CS': ['AC:IN_HW-CS_SR']
 * // }
 */
export function groupCodesByTaxonomyKey(codes: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const code of codes) {
    const key = buildTaxonomyKey(code);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(code);
  }

  return grouped;
}

/**
 * Estrae tutti i codici da un dizionario taxonomy_codes (flatten).
 *
 * @param taxonomyCodes - Record con codici raggruppati
 * @returns Lista flat di tutti i codici
 *
 * @example
 * const taxonomyCodes = {'BC:IM': ['BC:IM_AC', 'BC:IM_DA'], 'TT:MA': ['TT:MA_RA']};
 * extractAllCodesFromTaxonomyDict(taxonomyCodes)
 * // ['BC:IM_AC', 'BC:IM_DA', 'TT:MA_RA']
 */
export function extractAllCodesFromTaxonomyDict(
  taxonomyCodes: Record<string, string[]>
): string[] {
  const allCodes: string[] = [];
  for (const codesList of Object.values(taxonomyCodes)) {
    allCodes.push(...codesList);
  }
  return allCodes;
}

/**
 * Estrae la macrocategoria da una chiave.
 *
 * @param key - Chiave tassonomia
 * @returns Codice macrocategoria
 *
 * @example
 * getCategoryFromKey("BC:IM") // "BC"
 * getCategoryFromKey("AC:IN:HW-CS") // "AC"
 */
export function getCategoryFromKey(key: string): string {
  return key.includes(':') ? key.split(':')[0] : key;
}

/**
 * Conta i codici per macrocategoria.
 *
 * @param taxonomyCodes - Record con codici raggruppati
 * @returns Record con count per categoria
 *
 * @example
 * const taxonomyCodes = {
 *   'BC:IM': ['BC:IM_AC', 'BC:IM_DA'],
 *   'BC:SE': ['BC:SE_HI'],
 *   'TT:MA': ['TT:MA_RA']
 * };
 * countCodesByCategory(taxonomyCodes)
 * // { BC: 3, TT: 1 }
 */
export function countCodesByCategory(
  taxonomyCodes: Record<string, string[]>
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const [key, codes] of Object.entries(taxonomyCodes)) {
    const category = getCategoryFromKey(key);
    counts[category] = (counts[category] || 0) + codes.length;
  }

  return counts;
}
