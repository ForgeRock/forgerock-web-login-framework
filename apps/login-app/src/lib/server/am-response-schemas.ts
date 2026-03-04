/**
 * AM response schemas — defines the external contract with ForgeRock AM's
 * /authenticate endpoint. Used by both cookie serialization and response parsing.
 */
import { Option, Schema } from 'effect';

// ─── Shared Callback Schema ────────────────────────────────────────────────

/** Schema for a single AM callback structure, shared across step cookies and AM responses. */
export const AmCallbackSchema = Schema.Struct({
  type: Schema.String,
  output: Schema.Array(Schema.Struct({ name: Schema.String, value: Schema.Unknown })),
  input: Schema.Array(Schema.Struct({ name: Schema.String, value: Schema.Unknown })),
  _id: Schema.Number,
}).annotations({ identifier: 'AmCallback' });

// ─── AM Step Response ───────────────────────────────────────────────────────

/**
 * Schema for an intermediate AM authenticate response (next step).
 * Contains an authId JWT and an array of callbacks for the UI to render.
 */
export const AmStepResponse = Schema.Struct({
  authId: Schema.String,
  callbacks: Schema.Array(AmCallbackSchema),
  stage: Schema.optional(Schema.String),
  header: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
}).annotations({ identifier: 'AmStepResponse' });

// ─── AM Auth Complete ───────────────────────────────────────────────────────

/**
 * Schema for an AM authentication completion response.
 * AM returns `{ tokenId }` on success — `authId` is explicitly absent.
 */
export const AmAuthCompleteBody = Schema.Struct({
  tokenId: Schema.String,
  authId: Schema.optional(Schema.Undefined),
}).annotations({ identifier: 'AmAuthComplete' });

/**
 * Check whether an AM response body represents auth completion.
 * Uses Schema.parseJson to combine JSON parsing + schema validation.
 */
export const isAuthComplete = (body: string): boolean =>
  Schema.decodeUnknownOption(Schema.parseJson(AmAuthCompleteBody))(body).pipe(Option.isSome);
