"""
Helper utilities per gestione dinamica della tassonomia ACN
"""
from typing import Dict, List, Tuple


def build_taxonomy_key(code: str) -> str:
    """
    Estrae la chiave gerarchica dal codice tassonomia per raggruppamento.

    Gestisce automaticamente:
    - Predicati semplici: BC:IM_AC -> BC:IM
    - Predicati con subpredicati: AC:IN_HW-CS_SR -> AC:IN:HW-CS

    Examples:
        >>> build_taxonomy_key("BC:IM_AC")
        'BC:IM'
        >>> build_taxonomy_key("TT:MA_RA")
        'TT:MA'
        >>> build_taxonomy_key("AC:IN_HW-CS_SR")
        'AC:IN:HW-CS'
        >>> build_taxonomy_key("AC:IN_IT_CO")
        'AC:IN:IT'

    Args:
        code: Codice tassonomia completo (es. "BC:IM_AC")

    Returns:
        Chiave gerarchica per raggruppamento (es. "BC:IM" o "AC:IN:HW-CS")
    """
    if ':' not in code:
        return code  # Fallback per codici malformati

    parts = code.split(':')
    if len(parts) != 2:
        return code

    macro, value = parts

    if '_' not in value:
        return code  # Fallback

    # Split sul primo underscore
    value_parts = value.split('_', 1)
    predicate = value_parts[0]

    # Check se è AC:IN (l'unico con subpredicati)
    if macro == "AC" and predicate == "IN" and len(value_parts) > 1:
        # Formato: IN_SUBPRED_VALUE
        # Subpred può essere: HW-CS, SW-SS, IT, PE, LO, OT, ecc.
        rest = value_parts[1]

        # Se contiene underscore, prendiamo la parte prima dell'underscore
        # Altrimenti prendiamo tutto (per subpred a 2 lettere come IT, PE)
        if '_' in rest:
            subpred = rest.split('_')[0]
        else:
            subpred = rest

        return f"{macro}:{predicate}:{subpred}"

    # Predicato semplice
    return f"{macro}:{predicate}"


def parse_taxonomy_key(key: str) -> Tuple[str, str, str | None]:
    """
    Parsea una chiave tassonomia nei suoi componenti.

    Examples:
        >>> parse_taxonomy_key("BC:IM")
        ('BC', 'IM', None)
        >>> parse_taxonomy_key("AC:IN:HW-CS")
        ('AC', 'IN', 'HW-CS')

    Args:
        key: Chiave tassonomia (es. "BC:IM" o "AC:IN:HW-CS")

    Returns:
        Tuple (macrocategory, predicate, subpredicate)
    """
    parts = key.split(':')

    if len(parts) == 2:
        return parts[0], parts[1], None
    elif len(parts) == 3:
        return parts[0], parts[1], parts[2]
    else:
        return key, '', None


def group_codes_by_taxonomy_key(codes: List[str]) -> Dict[str, List[str]]:
    """
    Raggruppa una lista di codici per chiave tassonomia.

    Example:
        >>> codes = ["BC:IM_AC", "BC:IM_DA", "TT:MA_RA", "AC:IN_HW-CS_SR"]
        >>> group_codes_by_taxonomy_key(codes)
        {
            'BC:IM': ['BC:IM_AC', 'BC:IM_DA'],
            'TT:MA': ['TT:MA_RA'],
            'AC:IN:HW-CS': ['AC:IN_HW-CS_SR']
        }

    Args:
        codes: Lista di codici tassonomia

    Returns:
        Dict con codici raggruppati per chiave
    """
    grouped: Dict[str, List[str]] = {}

    for code in codes:
        key = build_taxonomy_key(code)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(code)

    return grouped


def extract_all_codes_from_taxonomy_dict(taxonomy_codes: Dict[str, List[str]]) -> List[str]:
    """
    Estrae tutti i codici da un dizionario taxonomy_codes (flatten).

    Example:
        >>> taxonomy_codes = {'BC:IM': ['BC:IM_AC', 'BC:IM_DA'], 'TT:MA': ['TT:MA_RA']}
        >>> extract_all_codes_from_taxonomy_dict(taxonomy_codes)
        ['BC:IM_AC', 'BC:IM_DA', 'TT:MA_RA']

    Args:
        taxonomy_codes: Dict con codici raggruppati

    Returns:
        Lista flat di tutti i codici
    """
    all_codes = []
    for codes_list in taxonomy_codes.values():
        all_codes.extend(codes_list)
    return all_codes


def get_category_from_key(key: str) -> str:
    """
    Estrae la macrocategoria da una chiave.

    Examples:
        >>> get_category_from_key("BC:IM")
        'BC'
        >>> get_category_from_key("AC:IN:HW-CS")
        'AC'

    Args:
        key: Chiave tassonomia

    Returns:
        Codice macrocategoria
    """
    return key.split(':')[0] if ':' in key else key


def count_codes_by_category(taxonomy_codes: Dict[str, List[str]]) -> Dict[str, int]:
    """
    Conta i codici per macrocategoria.

    Example:
        >>> taxonomy_codes = {
        ...     'BC:IM': ['BC:IM_AC', 'BC:IM_DA'],
        ...     'BC:SE': ['BC:SE_HI'],
        ...     'TT:MA': ['TT:MA_RA']
        ... }
        >>> count_codes_by_category(taxonomy_codes)
        {'BC': 3, 'TT': 1}

    Args:
        taxonomy_codes: Dict con codici raggruppati

    Returns:
        Dict con count per categoria
    """
    counts: Dict[str, int] = {}

    for key, codes in taxonomy_codes.items():
        category = get_category_from_key(key)
        counts[category] = counts.get(category, 0) + len(codes)

    return counts
