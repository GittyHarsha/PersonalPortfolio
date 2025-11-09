import type { AppData } from '../types';
import { isDevelopment } from './environment';

const API_BASE_URL = isDevelopment() 
  ? 'http://localhost:7071/api' 
  : '/api';

export async function loadPapers(): Promise<AppData> {
  const response = await fetch(`${API_BASE_URL}/papers`);
  if (!response.ok) {
    throw new Error('Failed to load papers');
  }
  return response.json();
}

export async function savePapers(data: AppData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/papers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save papers');
  }
}
