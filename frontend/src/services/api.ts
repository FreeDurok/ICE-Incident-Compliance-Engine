import axios from 'axios';
import { Incident, IncidentCreate, IncidentSummary } from '../types/incident';
import { MacroCategory, WizardStep } from '../types/taxonomy';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Incidents API
export const incidentsAPI = {
  list: async (): Promise<IncidentSummary[]> => {
    const response = await api.get('/api/incidents/');
    return response.data;
  },

  get: async (id: string): Promise<Incident> => {
    const response = await api.get(`/api/incidents/${id}`);
    return response.data;
  },

  create: async (data: IncidentCreate): Promise<Incident> => {
    const response = await api.post('/api/incidents/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<IncidentCreate>): Promise<Incident> => {
    const response = await api.put(`/api/incidents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/incidents/${id}`);
  },

  importFromJSON: async (data: any): Promise<Incident> => {
    const response = await api.post('/api/incidents/import', data);
    return response.data;
  },
};

// Taxonomy API
export const taxonomyAPI = {
  getMacrocategories: async (): Promise<MacroCategory[]> => {
    const response = await api.get('/api/taxonomy/macrocategories');
    return response.data;
  },

  getMacrocategory: async (code: string): Promise<MacroCategory> => {
    const response = await api.get(`/api/taxonomy/macrocategories/${code}`);
    return response.data;
  },

  getWizardStructure: async (): Promise<WizardStep[]> => {
    const response = await api.get('/api/taxonomy/wizard');
    return response.data;
  },

  validateCode: async (code: string): Promise<{ code: string; valid: boolean }> => {
    const response = await api.get(`/api/taxonomy/validate/${code}`);
    return response.data;
  },
};

// Export API
export const exportAPI = {
  downloadJSON: (incidentId: string) => {
    return `${API_URL}/api/export/${incidentId}/json`;
  },

  downloadPDF: (incidentId: string) => {
    return `${API_URL}/api/export/${incidentId}/pdf`;
  },

  getMISPEvent: async (incidentId: string) => {
    const response = await api.get(`/api/export/${incidentId}/misp`);
    return response.data;
  },

  pushToMISP: async (incidentId: string) => {
    const response = await api.post(`/api/export/${incidentId}/misp/push`);
    return response.data;
  },
};

export default api;
