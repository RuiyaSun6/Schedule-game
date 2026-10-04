import type { WorldArea } from '../types/world';

export const worldAreas: WorldArea[] = [
  { id: 'home', name: 'Home', requiredLevel: 1, buildCost: 0 },
  { id: 'garden', name: 'Garden', requiredLevel: 2, buildCost: 50 },
  { id: 'cafe', name: 'Café', requiredLevel: 3, buildCost: null },
  { id: 'studio', name: 'Creative Studio', requiredLevel: 4, buildCost: null },
  { id: 'town', name: 'Town Square', requiredLevel: 5, buildCost: null },
];
