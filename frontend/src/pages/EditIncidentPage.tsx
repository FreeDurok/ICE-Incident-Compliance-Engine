import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './BuilderPage.css';
import { taxonomyAPI, incidentsAPI } from '../services/api';
import { MacroCategory } from '../types/taxonomy';
import { IncidentCreate, Incident } from '../types/incident';
import { groupCodesByTaxonomyKey, extractAllCodesFromTaxonomyDict } from '../utils/taxonomyHelpers';

interface Block {
  id: string;
  code: string;
  label: string;
  description: string;
  category: string;
  predicate: string;
  predicateName: string;
  subpredicateCode?: string;
  detail?: string;
}

const EditIncidentPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [macrocategories, setMacrocategories] = useState<MacroCategory[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [discoveredAt, setDiscoveredAt] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('BC');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedPredicates, setExpandedPredicates] = useState<Set<string>>(new Set());
  const [expandedSubpredicates, setExpandedSubpredicates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // Carica tassonomia
      const macros = await taxonomyAPI.getMacrocategories();
      setMacrocategories(macros);

      // Converti la tassonomia in blocchi
      const blocks: Block[] = [];
      macros.forEach((mc) => {
        mc.predicates.forEach((pred) => {
          pred.values.forEach((value) => {
            blocks.push({
              id: `${mc.code}-${pred.code}-${value.code}`,
              code: value.code,
              label: value.label,
              description: value.description,
              category: mc.code,
              predicate: pred.code,
              predicateName: pred.name,
            });
          });

          pred.subpredicates?.forEach((subpred) => {
            subpred.values.forEach((value) => {
              blocks.push({
                id: `${mc.code}-${pred.code}-${subpred.code}-${value.code}`,
                code: value.code,
                label: value.label,
                description: value.description,
                category: mc.code,
              predicate: pred.code,
              predicateName: pred.name,
              subpredicateCode: subpred.code,
            });
          });
        });
      });
      });

      setAvailableBlocks(blocks);

      // Carica incidente esistente
      if (id) {
        const incident = await incidentsAPI.get(id);
        populateFromIncident(incident, blocks);
      }

      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento:', error);
      setLoading(false);
    }
  };

  const populateFromIncident = (incident: Incident, blocks: Block[]) => {
    setTitle(incident.title);
    setDescription(incident.description || '');
    setNotes(incident.notes || '');
    setDiscoveredAt(incident.discovered_at ? incident.discovered_at.slice(0, 16) : '');
    const detailsMap = incident.code_details || {};

    // Estrai tutti i codici dal dizionario taxonomy_codes dinamico
    const allCodes = extractAllCodesFromTaxonomyDict(incident.taxonomy_codes || {});

    // Trova tutti i blocchi che corrispondono ai codici
    const selected: Block[] = [];
    allCodes.forEach((code) => {
      const block = blocks.find((b) => b.code === code);
      if (block) {
        selected.push({
          ...block,
          detail: detailsMap[code] || '',
        });
      }
    });

    setSelectedBlocks(selected);
  };

  const handleDragStart = (block: Block) => {
    setDraggedBlock(block);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBlock) {
      const exists = selectedBlocks.find((b) => b.id === draggedBlock.id);
      if (!exists) {
        setSelectedBlocks([...selectedBlocks, { ...draggedBlock, detail: '' }]);
      }
      setDraggedBlock(null);
    }
  };

  const handleRemoveBlock = (blockId: string) => {
    setSelectedBlocks(selectedBlocks.filter((b) => b.id !== blockId));
  };

  const handleBlockDetailChange = (blockId: string, value: string) => {
    setSelectedBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, detail: value } : b))
    );
  };

  const toggleSubpredicate = (key: string) => {
    const next = new Set(expandedSubpredicates);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedSubpredicates(next);
  };

  const togglePredicate = (predicateCode: string) => {
    const newExpanded = new Set(expandedPredicates);
    if (newExpanded.has(predicateCode)) {
      newExpanded.delete(predicateCode);
    } else {
      newExpanded.add(predicateCode);
    }
    setExpandedPredicates(newExpanded);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Inserisci un titolo per l\'incidente');
      return;
    }

    if (!id) {
      alert('Errore: ID incidente mancante');
      return;
    }

    // Raccogli tutti i codici dai blocchi selezionati
    const allCodes = selectedBlocks.map((block) => block.code);

    // Costruisci code_details dai blocchi con dettagli
    const codeDetails: Record<string, string> = {};
    selectedBlocks.forEach((block) => {
      if (block.detail && block.detail.trim()) {
        codeDetails[block.code] = block.detail.trim();
      }
    });

    // Usa l'helper per raggruppare automaticamente i codici
    const taxonomyCodes = groupCodesByTaxonomyKey(allCodes);

    const incidentData: Partial<IncidentCreate> = {
      title,
      description: description || undefined,
      notes: notes || undefined,
      discovered_at: discoveredAt ? new Date(discoveredAt).toISOString() : undefined,
      taxonomy_codes: taxonomyCodes,
      code_details: Object.keys(codeDetails).length > 0 ? codeDetails : undefined,
    };

    try {
      await incidentsAPI.update(id, incidentData);
      navigate(`/incidents/${id}`);
    } catch (error) {
      console.error('Errore aggiornamento:', error);
      alert('Errore durante l\'aggiornamento dell\'incidente');
    }
  };

  const categoryColors: { [key: string]: string } = {
    BC: '#3b82f6',
    TT: '#f59e0b',
    TA: '#ef4444',
    AC: '#10b981',
  };

  const getCategoryName = (code: string): string => {
    const names: { [key: string]: string } = {
      BC: 'Baseline Characterization',
      TT: 'Threat Type',
      TA: 'Threat Actor',
      AC: 'Additional Context',
    };
    return names[code] || code;
  };

  const matchesSearch = (block: Block) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const code = (block.code || '').toLowerCase();
    const label = (block.label || '').toLowerCase();
    const description = (block.description || '').toLowerCase();
    const predicateName = (block.predicateName || '').toLowerCase();
    return (
      code.includes(term) ||
      label.includes(term) ||
      description.includes(term) ||
      predicateName.includes(term)
    );
  };

  const getBlocksGroupedByPredicate = () => {
    const filteredBlocks = availableBlocks.filter(
      (b) => b.category === activeCategory && matchesSearch(b)
    );
    const grouped: {
      [key: string]: { name: string; blocks: Block[]; subpredicates?: { [key: string]: { name: string; blocks: Block[] } } };
    } = {};

    const activeMacro = macrocategories.find((mc) => mc.code === activeCategory);

    filteredBlocks.forEach((block) => {
      const predKey = block.predicate;

      if (!grouped[predKey]) {
        grouped[predKey] = {
          name: block.predicateName,
          blocks: [],
          subpredicates: {},
        };
      }

      if (block.subpredicateCode) {
        const subKey = block.subpredicateCode;
        if (!grouped[predKey].subpredicates![subKey]) {
          const predicate = activeMacro?.predicates.find((p) => p.code === predKey);
          const subpred = predicate?.subpredicates?.find((sp) => sp.code === subKey);
          grouped[predKey].subpredicates![subKey] = { name: subpred?.name || subKey, blocks: [] };
        }
        grouped[predKey].subpredicates![subKey].blocks.push(block);
      } else {
        grouped[predKey].blocks.push(block);
      }
    });

    return grouped;
  };

  const blocksGrouped = getBlocksGroupedByPredicate();

  if (loading) {
    return <div className="loading">Caricamento incidente...</div>;
  }

  return (
    <div className="builder-page">
      <div className="builder-header">
        <div className="header-content">
          <h1>✏️ Modifica Incidente</h1>
          <p>Aggiorna i blocchi del tuo incidente</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/incidents/${id}`)}
          >
            Annulla
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!title || selectedBlocks.length === 0}
          >
            💾 Salva Modifiche
          </button>
        </div>
      </div>

      <div className="builder-container">
        <div
          className="canvas-panel"
          onDragOver={handleDragOver}
          onDrop={handleDropToCanvas}
        >
          <div className="panel-header">
            <h2>📋 Canvas Incidente</h2>
            <span className="block-count">{selectedBlocks.length} blocchi</span>
          </div>

          <div className="incident-info card">
            <div className="form-group">
              <label>Titolo Incidente *</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es: Attacco ransomware su server produzione"
              />
            </div>

            <div className="form-group">
              <label>Descrizione</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione dettagliata dell'incidente..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Data/Ora di scoperta (UTC)</label>
              <input
                type="datetime-local"
                className="input"
                value={discoveredAt}
                onChange={(e) => setDiscoveredAt(e.target.value)}
              />
            </div>
          </div>

          <div className="selected-blocks">
            {selectedBlocks.length === 0 ? (
              <div className="empty-canvas">
                <div className="empty-icon">📦</div>
                <p>Trascina qui i blocchi dalla libreria</p>
                <p className="empty-hint">Seleziona una categoria a destra e apri un predicato →</p>
              </div>
            ) : (
              <div className="blocks-grid">
                {selectedBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="selected-block"
                    style={{ borderLeftColor: categoryColors[block.category] }}
                  >
                    <div className="block-header">
                      <span className="block-category" style={{ backgroundColor: categoryColors[block.category] }}>
                        {block.category}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveBlock(block.id)}
                        title="Rimuovi blocco"
                      >
                        ✕
                      </button>
                    </div>
                <div className="block-code">{block.code}</div>
                <div className="block-label">{block.label}</div>
                <div className="block-description">{block.description}</div>
                <textarea
                  className="textarea block-detail"
                  placeholder="Aggiungi dettagli per questo blocco..."
                  value={block.detail || ''}
                  onChange={(e) => handleBlockDetailChange(block.id, e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
          </div>

          {selectedBlocks.length > 0 && (
            <div className="incident-notes card">
              <div className="form-group">
                <label>Note Aggiuntive</label>
                <textarea
                  className="textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Eventuali note, osservazioni o dettagli aggiuntivi..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <div className="library-panel">
          <div className="panel-header">
            <h2 className="library-title">
              <span className="library-icon">📚</span>
              <span>Libreria Blocchi</span>
            </h2>
          </div>

          <div className="library-search">
            <input
              type="text"
              className="input"
              placeholder="Filtra per codice, etichetta o descrizione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchTerm('')}
                title="Pulisci filtro"
              >
                ✕
              </button>
            )}
          </div>

          <div className="category-tabs">
            {macrocategories.map((mc) => (
              <button
                key={mc.code}
                className={`category-tab ${activeCategory === mc.code ? 'active' : ''}`}
                onClick={() => setActiveCategory(mc.code)}
                style={
                  activeCategory === mc.code
                    ? { borderLeftColor: categoryColors[mc.code], backgroundColor: 'var(--bg-secondary)' }
                    : {}
                }
              >
                <span className="tab-badge" style={{ backgroundColor: categoryColors[mc.code] }}>
                  {mc.code}
                </span>
                <span className="tab-name">{getCategoryName(mc.code)}</span>
              </button>
            ))}
          </div>

          <div className="predicates-accordion">
            {Object.entries(blocksGrouped).map(([predicateKey, predicateData]) => {
              const isExpanded = expandedPredicates.has(predicateKey);
              const hasSubpredicates = predicateData.subpredicates && Object.keys(predicateData.subpredicates).length > 0;
              const subpredBlocks = predicateData.subpredicates
                ? Object.values(predicateData.subpredicates).reduce((sum, sp) => sum + sp.blocks.length, 0)
                : 0;
              const totalBlocks = predicateData.blocks.length + subpredBlocks;

              return (
                <div key={predicateKey} className="predicate-group">
                  <button
                    className="predicate-header"
                    onClick={() => togglePredicate(predicateKey)}
                  >
                    <div className="predicate-title">
                      <span className="expand-icon" style={{ color: categoryColors[activeCategory] }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="predicate-name">{predicateData.name}</span>
                    </div>
                    <span className="predicate-count">{totalBlocks}</span>
                  </button>

                  {isExpanded && (
                    <div className="predicate-content">
                      {predicateData.blocks.length > 0 && (
                        <div className="predicate-blocks">
                          {predicateData.blocks.map((block) => {
                            const isSelected = selectedBlocks.find((b) => b.id === block.id);
                            return (
                              <div
                                key={block.id}
                                className={`library-block ${isSelected ? 'selected' : ''}`}
                                draggable
                                onDragStart={() => handleDragStart(block)}
                                style={{ borderLeftColor: categoryColors[block.category] }}
                              >
                                <div className="block-code">{block.code}</div>
                                <div className="block-label">{block.label}</div>
                                <div className="block-description">{block.description}</div>
                                {isSelected && <div className="selected-badge">✓ Aggiunto</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {hasSubpredicates && (
                        <div className="subpredicates">
                          {Object.entries(predicateData.subpredicates!).map(([subKey, subData]) => {
                            const fullKey = `${predicateKey}-${subKey}`;
                            const isSubExpanded = expandedSubpredicates.has(fullKey);
                            return (
                              <div key={subKey} className="subpredicate-group">
                                <button
                                  className="subpredicate-header"
                                  onClick={() => toggleSubpredicate(fullKey)}
                                >
                                  <div className="predicate-title">
                                    <span className="expand-icon" style={{ color: categoryColors[activeCategory] }}>
                                      {isSubExpanded ? '▼' : '▶'}
                                    </span>
                                    <span className="subpredicate-name">{subData.name}</span>
                                  </div>
                                  <span className="predicate-count">{subData.blocks.length}</span>
                                </button>
                                {isSubExpanded && (
                                  <div className="predicate-blocks subpredicate-blocks">
                                    {subData.blocks.map((block) => {
                                      const isSelected = selectedBlocks.find((b) => b.id === block.id);
                                      return (
                                        <div
                                          key={block.id}
                                          className={`library-block ${isSelected ? 'selected' : ''}`}
                                          draggable
                                          onDragStart={() => handleDragStart(block)}
                                          style={{ borderLeftColor: categoryColors[block.category] }}
                                        >
                                          <div className="block-code">{block.code}</div>
                                          <div className="block-label">{block.label}</div>
                                          <div className="block-description">{block.description}</div>
                                          {isSelected && <div className="selected-badge">✓ Aggiunto</div>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditIncidentPage;
