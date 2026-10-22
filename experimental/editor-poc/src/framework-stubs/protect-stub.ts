// Protect stub — PingOne Signals evaluation posts telemetry to a remote
// endpoint, which the preview sandbox must not do. The factory shape mirrors
// what core/protect/protect.store.ts calls on the client it gets back from
// protect(config): start, getData, pauseBehavioralData, resumeBehavioralData.
// All resolve locally so a protect-callback demo renders without network.
// Types are re-exported as unknown-safe structural stand-ins.
export type Protect = {
  start: () => Promise<void>;
  getData: () => Promise<string | { error: string }>;
  pauseBehavioralData: () => void | { error: string };
  resumeBehavioralData: () => void | { error: string };
};

export function protect(config: unknown): Protect {
  void config;
  return {
    start: async () => undefined,
    getData: async () => 'preview-protect-device-data',
    pauseBehavioralData: () => undefined,
    resumeBehavioralData: () => undefined,
  };
}

export type ProtectConfig = Record<string, unknown>;

export type SignalsInitializationOptions = Record<string, unknown>;
