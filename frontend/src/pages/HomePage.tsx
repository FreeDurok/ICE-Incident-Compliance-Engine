import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>
          ICE - Incident Compliance Engine
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Piattaforma modulare per la generazione guidata di report basata sulla Tassonomia Cyber ACN (TC-ACN)
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/builder" className="btn btn-primary btn-lg">
            🔧 Apri Builder
          </Link>
          <Link to="/incidents" className="btn btn-outline btn-lg">
            Visualizza Incidenti
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', margin: '3rem 0' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Drag & Drop Builder</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Costruisci incidenti trascinando blocchi dalla libreria della tassonomia ACN
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Export Multipli</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Genera report PDF e JSON basati sulla tassonomia
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Tassonomia ACN</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Basato sulla Tassonomia Cyber TC-ACN v2.0
          </p>
        </div>
      </div>

      <div className="card" style={{ margin: '3rem 0', padding: '2rem' }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Tassonomia ACN TC-ACN v2.0</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          La piattaforma utilizza la tassonomia ufficiale dell'Agenzia per la
          Cybersicurezza Nazionale italiana, organizzata in quattro macrocategorie:
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {[
            { code: 'BC', name: 'Baseline Characterization', desc: 'Caratterizzazione degli impatti, cause e gravità' },
            { code: 'TT', name: 'Threat Type', desc: 'Aspetti tecnici dell\'evento cyber' },
            { code: 'TA', name: 'Threat Actor', desc: 'Informazioni sull\'attore malevolo' },
            { code: 'AC', name: 'Additional Context', desc: 'Contesto aggiuntivo e asset coinvolti' },
          ].map((item) => (
            <li key={item.code} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name} ({item.code})</strong> - {item.desc}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HomePage;
