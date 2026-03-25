import type { FRStep } from '@forgerock/javascript-sdk';

export function formatStageName(step: FRStep): string {
  const stage = step?.getStage?.() || 'Unknown';
  return stage.replace(/([A-Z])/g, ' $1').trim();
}
