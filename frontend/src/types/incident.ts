export interface Incident {
  id: string;
  title: string;
  description?: string;
  discovered_at?: string;

  // Baseline Characterization
  impact: string[];
  root_cause?: string;
  severity?: string;
  victim_geography: string[];

  // Threat Type
  threat_types: string[];

  // Threat Actor
  adversary_motivation?: string;
  adversary_type?: string;

  // Additional Context
  involved_assets: string[];
  vectors: string[];
  outlook?: string;
  physical_security: string[];
  abusive_content: string[];

  // Metadata
  tags: string[];
  notes?: string;
  block_details?: Record<string, string>;

  created_at: string;
  updated_at: string;
}

export interface IncidentCreate {
  title: string;
  description?: string;
  impact?: string[];
  root_cause?: string;
  severity?: string;
  victim_geography?: string[];
  threat_types?: string[];
  adversary_motivation?: string;
  adversary_type?: string;
  involved_assets?: string[];
  vectors?: string[];
  outlook?: string;
  physical_security?: string[];
  abusive_content?: string[];
  tags?: string[];
  notes?: string;
  block_details?: Record<string, string>;
  discovered_at?: string;
}

export interface IncidentSummary {
  id: string;
  title: string;
  severity?: string;
  created_at: string;
  impact_count: number;
  threat_types_count: number;
}
