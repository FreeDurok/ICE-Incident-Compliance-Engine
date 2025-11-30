import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { incidentsAPI } from '../services/api';
import { IncidentSummary } from '../types/incident';

const IncidentsListPage: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const data = await incidentsAPI.list();
      setIncidents(data);
      setLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento incidenti:', error);
      setLoading(false);
    }
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await incidentsAPI.importFromJSON(json);
      await loadIncidents();
      alert('Import completato');
    } catch (error) {
      console.error('Errore import:', error);
      alert('Import fallito: verifica il file JSON esportato');
    } finally {
      setImporting(false);
    }
  };

  const getSeverityBadge = (severityCode?: string) => {
    if (!severityCode) return null;

    const severityMap: { [key: string]: { label: string; class: string } } = {
      'BC:SE_HI': { label: 'High', class: 'badge-danger' },
      'BC:SE_ME': { label: 'Medium', class: 'badge-warning' },
      'BC:SE_LO': { label: 'Low', class: 'badge-primary' },
      'BC:SE_NO': { label: 'None', class: 'badge-success' },
    };

    const info = severityMap[severityCode];
    if (!info) return null;

    return <span className={`badge ${info.class}`}>{info.label}</span>;
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

  if (loading) {
    return <div className="loading">Caricamento...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Incidenti</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
            📥 Import JSON
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => handleImport(e.target.files?.[0] || null)}
              disabled={importing}
            />
          </label>
          <Link to="/builder" className="btn btn-primary">
            + Nuovo Incidente
          </Link>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <h2>Nessun incidente registrato</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Usa il builder per creare il tuo primo incidente
          </p>
          <Link to="/builder" className="btn btn-primary">
            Crea Incidente
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              to={`/incidents/${incident.id}`}
              className="card"
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, flex: 1 }}>{incident.title}</h3>
                {getSeverityBadge(incident.severity_code)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Creato:
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>{formatDate(incident.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {incident.bc_count > 0 && (
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37, 99, 235, 0.35)' }}>
                      BC: {incident.bc_count}
                    </span>
                  )}
                  {incident.tt_count > 0 && (
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#d97706', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                      TT: {incident.tt_count}
                    </span>
                  )}
                  {incident.ta_count > 0 && (
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                      TA: {incident.ta_count}
                    </span>
                  )}
                  {incident.ac_count > 0 && (
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#0f9a76', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                      AC: {incident.ac_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncidentsListPage;
