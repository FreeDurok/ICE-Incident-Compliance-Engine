from io import BytesIO
from typing import Dict, Any
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors


def _build_block_lookup(taxonomy_service) -> Dict[str, Dict[str, str]]:
    """Crea una lookup code -> {label, description} dalla tassonomia."""
    lookup: Dict[str, Dict[str, str]] = {}
    taxonomy = taxonomy_service.get_taxonomy()
    for mc in taxonomy.get("taxonomy", {}).get("macrocategories", []):
        for predicate in mc.get("predicates", []):
            for value in predicate.get("values", []):
                lookup[value["code"]] = {"label": value.get("label", ""), "description": value.get("description", "")}
            for subpred in predicate.get("subpredicates", []):
                for value in subpred.get("values", []):
                    lookup[value["code"]] = {"label": value.get("label", ""), "description": value.get("description", "")}
    return lookup


def _color_for_codes(codes: list):
    palette = {
        "BC": colors.HexColor("#2563eb"),  # blue
        "TT": colors.HexColor("#f59e0b"),  # amber
        "TA": colors.HexColor("#ef4444"),  # red
        "AC": colors.HexColor("#10b981"),  # green
    }
    if not codes:
        return colors.HexColor("#2563eb")
    first = codes[0]
    prefix = first.split(":")[0] if isinstance(first, str) and ":" in first else first
    return palette.get(prefix, colors.HexColor("#2563eb"))


def _group_codes_by_predicate(codes: list, macro_code: str, taxonomy_service):
    """Raggruppa codici per predicato, restituendo (pred_code, pred_name) -> list[codes]."""
    pred_lookup = {}
    macro = taxonomy_service.get_macrocategory(macro_code)
    if macro:
        for pred in macro.get("predicates", []):
            pred_lookup[pred.get("code")] = pred.get("name", pred.get("code"))

    grouped = {}
    for code in codes or []:
        if not isinstance(code, str) or ":" not in code:
            continue
        after = code.split(":")[1]
        pred_code = after.split("_")[0] if "_" in after else after
        pred_name = pred_lookup.get(pred_code, pred_code)
        key = (pred_code, pred_name)
        grouped.setdefault(key, []).append(code)
    return grouped


def _collect_codes_for_macro(incident: Dict[str, Any], macro_code: str) -> list:
    """
    Raccoglie tutti i codici di una macrocategoria dal taxonomy_codes dinamico.

    Args:
        incident: Dizionario incidente
        macro_code: Codice macrocategoria (es. "BC", "TT", "TA", "AC")

    Returns:
        Lista di codici appartenenti alla macrocategoria
    """
    codes: list = []
    taxonomy_codes = incident.get("taxonomy_codes", {})

    # Itera su tutte le chiavi e filtra per macrocategoria
    for key, codes_list in taxonomy_codes.items():
        # Estrae la macrocategoria dalla chiave (es. "BC:IM" -> "BC")
        if ":" in key:
            key_macro = key.split(":")[0]
            if key_macro == macro_code:
                codes.extend(codes_list)

    return codes


def _format_datetime(value) -> str:
    if not value:
        return ""
    try:
        if isinstance(value, str):
            v = value.replace("Z", "+00:00")
            return datetime.fromisoformat(v).strftime("%Y-%m-%d %H:%M:%S")
        return value.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return str(value)


def generate_pdf_report(incident: Dict[str, Any], taxonomy_service) -> bytes:
    """Genera un report PDF dell'incidente"""

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    story = []
    styles = getSampleStyleSheet()

    # Stili personalizzati
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12,
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        spaceAfter=2,
    )

    # Lookup blocchi
    block_lookup = _build_block_lookup(taxonomy_service)
    code_details: Dict[str, str] = incident.get("code_details", {}) or {}

    def add_block_table(title: str, codes: list):
        """Aggiunge una tabella con codice, etichetta, descrizione e note utente."""
        if not codes:
            return
        accent = _color_for_codes(codes)
        code_style = ParagraphStyle('Code', parent=cell_style, textColor=accent, fontName='Helvetica-Bold')

        story.append(Paragraph(title, ParagraphStyle(
            'ColoredHeading',
            parent=heading_style,
            textColor=accent
        )))
        data = [[
            Paragraph("<b>Codice</b>", ParagraphStyle('Head', parent=cell_style, textColor=colors.white)),
            Paragraph("<b>Etichetta</b>", cell_style),
            Paragraph("<b>Descrizione</b>", cell_style),
            Paragraph("<b>Dettagli</b>", cell_style),
        ]]
        for code in codes:
            info = block_lookup.get(code, {})
            data.append([
                Paragraph(code, code_style),
                Paragraph(info.get("label", "") or "", cell_style),
                Paragraph(info.get("description", "") or "", cell_style),
                Paragraph(code_details.get(code, "") or "", cell_style),
            ])
        table = Table(
            data,
            colWidths=[3.5*cm, 4.0*cm, 4.9*cm, 4.6*cm],
            repeatRows=1
        )
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), accent),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.25, accent),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.5*cm))

    # Titolo
    story.append(Paragraph("Incident Taxonomy Report", title_style))
    story.append(Spacer(1, 0.5*cm))

    # Info generali
    story.append(Paragraph(f"<b>Titolo:</b> {incident['title']}", styles['Normal']))
    story.append(Spacer(1, 0.3*cm))

    if incident.get('description'):
        story.append(Paragraph(f"<b>Descrizione:</b> {incident['description']}", styles['Normal']))
        story.append(Spacer(1, 0.3*cm))

    created_str = _format_datetime(incident.get('created_at'))
    if created_str:
        story.append(Paragraph(f"<b>Data creazione (UTC):</b> {created_str}", styles['Normal']))
        story.append(Spacer(1, 0.2*cm))

    updated_str = _format_datetime(incident.get('updated_at'))
    if updated_str:
        story.append(Paragraph(f"<b>Ultimo aggiornamento (UTC):</b> {updated_str}", styles['Normal']))
        story.append(Spacer(1, 0.2*cm))

    discovered_str = _format_datetime(incident.get('discovered_at'))
    if discovered_str:
        story.append(Paragraph(f"<b>Scoperta incidente (UTC):</b> {discovered_str}", styles['Normal']))
        story.append(Spacer(1, 0.5*cm))

    # Baseline Characterization (gruppato per predicato)
    bc_codes = _collect_codes_for_macro(incident, "BC")
    if bc_codes:
        grouped = _group_codes_by_predicate(bc_codes, "BC", taxonomy_service)
        for (_code, pred_name), codes in grouped.items():
            add_block_table(f"Baseline Characterization - {pred_name}", codes)

    # Threat Type (tutti i predicati TT)
    tt_codes = _collect_codes_for_macro(incident, "TT")
    if tt_codes:
        grouped = _group_codes_by_predicate(tt_codes, "TT", taxonomy_service)
        for (_code, pred_name), codes in grouped.items():
            add_block_table(f"Threat Type - {pred_name}", codes)

    # Threat Actor (raggruppato per predicato)
    ta_codes = _collect_codes_for_macro(incident, "TA")
    if ta_codes:
        grouped = _group_codes_by_predicate(ta_codes, "TA", taxonomy_service)
        for (_code, pred_name), codes in grouped.items():
            add_block_table(f"Threat Actor - {pred_name}", codes)

    # Additional Context (raggruppato per predicato)
    ac_codes = _collect_codes_for_macro(incident, "AC")
    if ac_codes:
        grouped = _group_codes_by_predicate(ac_codes, "AC", taxonomy_service)
        for (_code, pred_name), codes in grouped.items():
            add_block_table(f"Additional Context - {pred_name}", codes)

    # Note
    if incident.get('notes'):
        story.append(Paragraph("Note", heading_style))
        story.append(Paragraph(incident['notes'], styles['Normal']))

    # Footer
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        "<i>Report generato da ICE - Incident Compliance Engine</i>",
        styles['Normal']
    ))
    story.append(Paragraph(
        f"<i>Tassonomia: ACN TC-ACN v2.0</i>",
        styles['Normal']
    ))

    # Build PDF
    doc.build(story)

    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
