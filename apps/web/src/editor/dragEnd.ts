import type { EditorLocation, EditorStatement } from "./model.js";

export type PaletteKind = "moveForward" | "turn" | "repeat" | "ifPathAhead" | "ifElsePathAhead";

export interface DragEndItem {
  readonly id: string | number;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface DropTarget {
  readonly id: string | number;
  readonly data?: Readonly<Record<string, unknown>>;
}

export type DragEndRoute =
  | { readonly action: "insert"; readonly kind: PaletteKind; readonly destination: EditorLocation; readonly destinationSource: "metadata" | "id" }
  | { readonly action: "move"; readonly statementId: string; readonly destination: EditorLocation; readonly destinationSource: "metadata" | "id" }
  | { readonly action: "reject"; readonly stage: "active" | "destination"; readonly reason: string };

const paletteKinds: readonly PaletteKind[] = ["moveForward", "turn", "repeat", "ifPathAhead", "ifElsePathAhead"];
let editorIdSequence = 0;

export function createEditorId(fillRandom?: (values: Uint32Array) => void, now: () => number = Date.now): string {
  const values = new Uint32Array(2);
  const fill = fillRandom ?? (typeof globalThis.crypto?.getRandomValues === "function" ? (target: Uint32Array) => { globalThis.crypto.getRandomValues(target); } : undefined);
  if (fill) fill(values);
  editorIdSequence += 1;
  return `editor-${now().toString(36)}-${values[0]!.toString(36)}${values[1]!.toString(36)}-${editorIdSequence.toString(36)}`;
}

export const createPaletteStatement = (kind: PaletteKind, makeId: () => string): EditorStatement => kind === "moveForward"
  ? { id: makeId(), type: "moveForward" }
  : kind === "turn"
    ? { id: makeId(), type: "turn", direction: "right" }
    : kind === "ifPathAhead"
      ? { id: makeId(), type: "ifPathAhead", body: [] }
      : kind === "ifElsePathAhead"
        ? { id: makeId(), type: "ifElsePathAhead", thenBody: [], elseBody: [] }
      : { id: makeId(), type: "repeat", count: 3, body: [] };

const isLocation = (value: unknown): value is EditorLocation => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EditorLocation>;
  return (candidate.containerId === null || typeof candidate.containerId === "string") && Number.isInteger(candidate.index) && Number(candidate.index) >= 0;
};

export function resolveDropDestination(target: DropTarget | null | undefined, canvasEndIndex: number): { readonly location?: EditorLocation; readonly source?: "metadata" | "id"; readonly reason?: string } {
  if (!target) return { reason: "missing-over" };
  const metadataLocation = target.data?.location;
  if (isLocation(metadataLocation)) return { location: metadataLocation, source: "metadata" };

  const id = String(target.id);
  if (id === "drop:root:canvas") return { location: { containerId: null, index: canvasEndIndex }, source: "id" };
  if (!id.startsWith("drop:")) return { reason: `unsupported-over-id:${id}` };

  const encoded = id.slice("drop:".length);
  const separator = encoded.lastIndexOf(":");
  if (separator <= 0) return { reason: `malformed-drop-id:${id}` };
  const container = encoded.slice(0, separator);
  const indexText = encoded.slice(separator + 1);
  if (!/^\d+$/.test(indexText)) return { reason: `invalid-drop-index:${indexText || "empty"}` };
  return { location: { containerId: container === "root" ? null : container, index: Number(indexText) }, source: "id" };
}

export function routeDragEnd(active: DragEndItem, over: DropTarget | null | undefined, canvasEndIndex: number): DragEndRoute {
  const origin = active.data?.origin ?? active.data?.source;
  if (origin !== "palette" && origin !== "workspace") return { action: "reject", stage: "active", reason: `invalid-origin:${String(origin ?? "missing")}` };

  const resolved = resolveDropDestination(over, canvasEndIndex);
  if (!resolved.location || !resolved.source) return { action: "reject", stage: "destination", reason: resolved.reason ?? "destination-invalid" };

  if (origin === "palette") {
    const kind = active.data?.kind;
    if (typeof kind !== "string" || !paletteKinds.includes(kind as PaletteKind)) return { action: "reject", stage: "active", reason: `invalid-palette-kind:${String(kind ?? "missing")}` };
    return { action: "insert", kind: kind as PaletteKind, destination: resolved.location, destinationSource: resolved.source };
  }

  const statementId = active.data?.statementId;
  if (typeof statementId !== "string" || statementId.length === 0) return { action: "reject", stage: "active", reason: "missing-workspace-statement" };
  return { action: "move", statementId, destination: resolved.location, destinationSource: resolved.source };
}
