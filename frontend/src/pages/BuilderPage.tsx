import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BuilderPage.css';
import { taxonomyAPI, incidentsAPI } from '../services/api';
import { MacroCategory, Predicate, SubPredicate } from '../types/taxonomy';
import { IncidentCreate } from '../types/incident';

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

interface GroupedBlocks {
  name: string;
  blocks: Block[];
  subpredicates?: { [key: string]: { name: string; blocks: Block[] } };
}

const BuilderPage: React.FC = () => {
  const navigate = useNavigate();
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
    loadTaxonomy();
  }, []);

  const loadTaxonomy = async () => {
    try {
      const macros = await taxonomyAPI.getMacrocategories();
      setMacrocategories(macros);

      // Converti la tassonomia in blocchi
      const blocks: Block[] = [];
      macros.forEach((mc) => {
        mc.predicates.forEach((pred) => {
          // Blocchi diretti del predicato (senza subpredicates)
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

          // Blocchi dei subpredicates
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
      setLoading(false);
    } catch (error) {
      console.error('Errore caricamento tassonomia:', error);
      setLoading(false);
    }
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

  const togglePredicate = (predicateCode: string) => {
    const newExpanded = new Set(expandedPredicates);
    if (newExpanded.has(predicateCode)) {
      newExpanded.delete(predicateCode);
    } else {
      newExpanded.add(predicateCode);
    }
    setExpandedPredicates(newExpanded);
  };

  const toggleSubpredicate = (key: string) => {
    const newExpanded = new Set(expandedSubpredicates);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubpredicates(newExpanded);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Inserisci un titolo per l\'incidente');
      return;
    }

    const incidentData: IncidentCreate = {
      title,
      description: description || undefined,
      notes: notes || undefined,
      discovered_at: discoveredAt ? new Date(discoveredAt).toISOString() : undefined,
      impact: [],
      victim_geography: [],
      threat_types: [],
      involved_assets: [],
      vectors: [],
      physical_security: [],
      abusive_content: [],
      tags: [],
    };

    selectedBlocks.forEach((block) => {
      const code = block.code;
      const predCode = block.predicate;
      if (block.detail && block.detail.trim()) {
        incidentData.block_details = incidentData.block_details || {};
        incidentData.block_details[code] = block.detail.trim();
      }

      if (predCode === 'IM') incidentData.impact?.push(code);
      else if (predCode === 'RO') incidentData.root_cause = code;
      else if (predCode === 'SE') incidentData.severity = code;
      else if (predCode === 'VG') incidentData.victim_geography?.push(code);
      else if (predCode === 'AM') incidentData.adversary_motivation = code;
      else if (predCode === 'AD') incidentData.adversary_type = code;
      else if (predCode === 'VE') incidentData.vectors?.push(code);
      else if (predCode === 'OU') incidentData.outlook = code;
      else if (predCode === 'IN') incidentData.involved_assets?.push(code);
      else if (predCode === 'PH') incidentData.physical_security?.push(code);
      else if (predCode === 'AB') incidentData.abusive_content?.push(code);
      else if (block.category === 'TT') incidentData.threat_types?.push(code);
    });

    try {
      const incident = await incidentsAPI.create(incidentData);
      navigate(`/incidents/${incident.id}`);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore durante il salvataggio dell\'incidente');
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

  // Raggruppa blocchi per predicato e subpredicato
  const getBlocksGroupedByPredicate = (): { [key: string]: GroupedBlocks } => {
    const filteredBlocks = availableBlocks.filter(
      (b) => b.category === activeCategory && matchesSearch(b)
    );
    const grouped: { [key: string]: GroupedBlocks } = {};

    // Trova la macrocategoria attiva per ottenere i nomi dei subpredicates
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
        // Blocco appartiene a un subpredicato
        const subpredKey = block.subpredicateCode;

        if (!grouped[predKey].subpredicates![subpredKey]) {
          // Trova il nome del subpredicato
          const predicate = activeMacro?.predicates.find((p) => p.code === predKey);
          const subpred = predicate?.subpredicates?.find((sp) => sp.code === subpredKey);

          grouped[predKey].subpredicates![subpredKey] = {
            name: subpred?.name || subpredKey,
            blocks: [],
          };
        }

        grouped[predKey].subpredicates![subpredKey].blocks.push(block);
      } else {
        // Blocco diretto del predicato
        grouped[predKey].blocks.push(block);
      }
    });

    return grouped;
  };

  const blocksGrouped = getBlocksGroupedByPredicate();

  if (loading) {
    return <div className="loading">Caricamento tassonomia...</div>;
  }

  return (
    <div className="builder-page">
      {/* Header */}
      <div className="builder-header">
        <div className="header-content">
          <h1>🔧 Incident Builder</h1>
          <p>Trascina i blocchi dalla libreria per costruire il tuo incidente</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!title || selectedBlocks.length === 0}>
          💾 Salva Incidente
        </button>
      </div>

      <div className="builder-container">
        {/* Canvas (Sinistra) */}
        <div
          className="canvas-panel"
          onDragOver={handleDragOver}
          onDrop={handleDropToCanvas}
        >
          <div className="panel-header">
            <h2>📋 Canvas Incidente</h2>
            <span className="block-count">{selectedBlocks.length} blocchi</span>
          </div>

          {/* Form Info Base */}
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

          {/* Blocchi Selezionati */}
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

          {/* Note Finali */}
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

        {/* Libreria Blocchi (Destra) */}
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

          {/* Tab Categorie */}
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

          {/* Predicati Accordion */}
          <div className="predicates-accordion">
            {Object.entries(blocksGrouped).map(([predicateKey, predicateData]) => {
              const isExpanded = expandedPredicates.has(predicateKey);
              const hasSubpredicates = predicateData.subpredicates && Object.keys(predicateData.subpredicates).length > 0;
              const subpredicateBlocks = predicateData.subpredicates
                ? Object.values(predicateData.subpredicates).reduce((sum, sp) => sum + sp.blocks.length, 0)
                : 0;
              const totalBlocks = predicateData.blocks.length + subpredicateBlocks;

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
                      {/* Blocchi diretti del predicato */}
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

                      {/* Subpredicates */}
                      {hasSubpredicates && (
                        <div className="subpredicates">
                          {Object.entries(predicateData.subpredicates!).map(([subpredKey, subpredData]) => {
                            const subpredFullKey = `${predicateKey}-${subpredKey}`;
                            const isSubExpanded = expandedSubpredicates.has(subpredFullKey);

                            return (
                              <div key={subpredKey} className="subpredicate-group">
                                <button
                                  className="subpredicate-header"
                                  onClick={() => toggleSubpredicate(subpredFullKey)}
                                >
                                  <div className="predicate-title">
                                    <span className="expand-icon" style={{ color: categoryColors[activeCategory] }}>
                                      {isSubExpanded ? '▼' : '▶'}
                                    </span>
                                    <span className="subpredicate-name">{subpredData.name}</span>
                                  </div>
                                  <span className="predicate-count">{subpredData.blocks.length}</span>
                                </button>

                                {isSubExpanded && (
                                  <div className="predicate-blocks subpredicate-blocks">
                                    {subpredData.blocks.map((block) => {
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

export default BuilderPage;
