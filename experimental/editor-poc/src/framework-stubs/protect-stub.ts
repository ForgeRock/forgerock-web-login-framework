// Protect stub — PingOne Signals evaluation posts telemetry to a remote
// endpoint, which the preview sandbox must not do. The factory + start shape
// mirrors what core/protect/protect.store.ts calls (protect(config) ->
// client.start()); the no-op resolves so a protect-callback demo renders
// without network. Types are re-exported as unknown-safe structural stand-ins.
export function protect(config: unknown): {
  start: () => Promise<void>;
} {
  void config;
  return {
    start: async () => undefined,
  };
}

export type Protect = {
  start: () => Promise<void>;
};

export type ProtectConfig = Record<string, unknown>;

export type SignalsInitializationOptions = Record<string, unknown>;
