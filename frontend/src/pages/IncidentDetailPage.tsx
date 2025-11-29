import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { incidentsAPI, exportAPI, taxonomyAPI } from '../services/api';
import { Incident } from '../types/incident';

const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [predicateNames, setPredicateNames] = useState<Record<string, string>>({});
  const categoryColors: { [key: string]: { bg: string; border: string; text: string } } = {
    BC: { bg: 'rgba(37, 99, 235, 0.12)', border: 'rgba(37, 99, 235, 0.35)', text: '#2563eb' },
    TT: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', text: '#d97706' },
    TA: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)', text: '#dc2626' },
    AC: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', text: '#0f9a76' },
  };

  useEffect(() => {
    loadPredicates();
  }, []);

  useEffect(() => {
    if (id) {
      loadIncident(id);
    }
  }, [id]);

  const loadPredicates = async () => {
    try {
      const macros = await taxonomyAPI.getMacrocategories();
      const map: Record<string, string> = {};
      macros.forEach((mc) => {
        mc.predicates.forEach((p) => {
          map[p.code] = p.name;
        });
      });
      setPredicateNames(map);
    } catch (err) {
      console.error('Errore caricamento tassonomia:', err);
    }
  };

  const loadIncident = async (incidentId: string) => {
    try {
      const data = await incidentsAPI.get(incidentId);
      setIncident(data);
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento incidente:', error);
      setLoading(false);
    }
  };

  const handleJsonDownload = async () => {
    if (!id) return;
    setDownloadingJson(true);
    try {
      const url = exportAPI.downloadJSON(id);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Errore download JSON');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `incident_${id}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Errore durante il download del JSON');
    } finally {
      setDownloadingJson(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Sei sicuro di voler eliminare questo incidente?')) {
      return;
    }

    try {
      await incidentsAPI.delete(id);
      navigate('/incidents');
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione dell\'incidente');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderCodes = (codes: string[]) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {codes.map((code, idx) => {
        const prefix = code.includes(':') ? code.split(':')[0] : '';
        const palette = categoryColors[prefix] || { bg: 'var(--bg-secondary)', border: 'var(--border-color)', text: 'var(--text-primary)' };
        return (
          <span
            key={`${code}-${idx}`}
            style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: palette.text,
              background: palette.bg,
              padding: '0.4rem 0.65rem',
              borderRadius: 'var(--radius)',
              border: `1px solid ${palette.border}`,
            }}
          >
            {code}
          </span>
        );
      })}
    </div>
  );

  const groupByPredicate = (codes: string[]) => {
    const groups: Record<string, { name: string; codes: string[] }> = {};
    (codes || []).forEach((code) => {
      const after = code.includes(':') ? code.split(':')[1] : code;
      const pred = after.includes('_') ? after.split('_')[0] : after;
      const name = predicateNames[pred] || pred;
      if (!groups[pred]) groups[pred] = { name, codes: [] };
      groups[pred].codes.push(code);
    });
    return groups;
  };

  const renderGrouped = (codes: string[], accent?: string) => {
    const grouped = groupByPredicate(codes);
    return (
      <>
        {Object.entries(grouped).map(([pred, data]) => {
          const palette = accent || 'var(--text-primary)';
          return (
            <div key={pred} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: palette, marginBottom: '0.35rem' }}>
                {pred} — {data.name}
              </div>
              {renderCodes(data.codes)}
            </div>
          );
        })}
      </>
    );
  };

  if (loading) {
    return <div className="loading">Caricamento...</div>;
  }

  if (!incident) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Incidente non trovato</h2>
        <Link to="/incidents" className="btn btn-primary">
          Torna alla lista
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/incidents" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-block', marginBottom: '0.5rem' }}>
            ← Indietro
          </Link>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{incident.title}</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to={`/incidents/${incident.id}/edit`} className="btn btn-primary">
            ✏️ Modifica
          </Link>
          <a href={exportAPI.downloadPDF(incident.id)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            📄 Export PDF
          </a>
          <button className="btn btn-outline" onClick={handleJsonDownload} disabled={downloadingJson}>
            💾 {downloadingJson ? 'Download...' : 'Export JSON'}
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            🗑️ Elimina
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <Section title="Informazioni Generali" color="var(--primary-color)">
        {incident.description && (
          <div style={{ marginBottom: '1rem' }}>
            <InfoItem label="Descrizione" value={incident.description} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <InfoItem label="Data creazione (UTC)" value={formatDate(incident.created_at)} />
          <InfoItem label="Ultimo aggiornamento (UTC)" value={formatDate(incident.updated_at)} />
          <InfoItem label="ID" value={incident.id} />
          {incident.discovered_at && <InfoItem label="Scoperta (UTC)" value={formatDate(incident.discovered_at)} />}
        </div>

          {incident.tags && incident.tags.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Tag:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {incident.tags.map((tag, idx) => (
                  <span key={idx} className="badge badge-primary">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {(incident.impact?.length > 0 || incident.root_cause || incident.severity || incident.victim_geography?.length > 0) && (
          <Section title="Baseline Characterization" color={categoryColors.BC.text}>
            {renderGrouped(
              [
                ...(incident.impact || []),
                ...(incident.root_cause ? [incident.root_cause] : []),
                ...(incident.severity ? [incident.severity] : []),
                ...(incident.victim_geography || []),
              ],
              categoryColors.BC.text
            )}
          </Section>
        )}

        {incident.threat_types && incident.threat_types.length > 0 && (
          <Section title="Threat Type" color={categoryColors.TT.text}>
            {renderGrouped(incident.threat_types, categoryColors.TT.text)}
          </Section>
        )}

        {(incident.adversary_motivation || incident.adversary_type) && (
          <Section title="Threat Actor" color={categoryColors.TA.text}>
            {renderGrouped(
              [
                ...(incident.adversary_motivation ? [incident.adversary_motivation] : []),
                ...(incident.adversary_type ? [incident.adversary_type] : []),
              ],
              categoryColors.TA.text
            )}
          </Section>
        )}

        {(incident.involved_assets?.length > 0 || incident.vectors?.length > 0 || incident.outlook) && (
          <Section title="Additional Context" color={categoryColors.AC.text}>
            {renderGrouped(
              [
                ...(incident.involved_assets || []),
                ...(incident.vectors || []),
                ...(incident.outlook ? [incident.outlook] : []),
              ],
              categoryColors.AC.text
            )}
          </Section>
        )}

        {incident.notes && (
          <Section title="Note">
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{incident.notes}</p>
          </Section>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; color?: string }> = ({ title, children, color }) => {
  const accent = color || 'var(--primary-color)';
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ color: accent, fontSize: '1.25rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${accent}` }}>
        {title}
      </h2>
      {children}
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value?: string; valueNode?: React.ReactNode }> = ({ label, value, valueNode }) => (
  <div style={{ marginBottom: '0.75rem' }}>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.25rem' }}>
      {label}:
    </div>
    <div style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>
      {valueNode || value}
    </div>
  </div>
);

export default IncidentDetailPage;
