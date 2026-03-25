import type { FRCallback } from '@forgerock/javascript-sdk';

export function formatCallbackName(callback: FRCallback): string {
  const type = callback.getType();
  return type.replace(/([A-Z])/g, ' $1').trim();
}
