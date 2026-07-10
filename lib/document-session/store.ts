import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDocsDir } from "./data-root";
import { InvalidGuidError, SessionNotFoundError } from "./errors";
import { assertValidGuid, sessionPath } from "./guid";
import type {
  DocumentSession,
  DocumentSessionPatch,
  WizardStep,
} from "./types";

export type StoreOptions = {
  dataRoot?: string;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoDateTime(): string {
  return new Date().toISOString();
}

async function ensureDocsDir(dataRoot?: string): Promise<string> {
  const docsDir = getDocsDir(dataRoot);
  await mkdir(docsDir, { recursive: true });
  return docsDir;
}

async function writeSessionAtomic(
  filePath: string,
  session: DocumentSession,
): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmpPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  const payload = `${JSON.stringify(session, null, 2)}\n`;
  try {
    await writeFile(tmpPath, payload, "utf8");
    await rename(tmpPath, filePath);
  } catch (error) {
    await unlink(tmpPath).catch(() => undefined);
    throw error;
  }
}

function isWizardStep(value: unknown): value is WizardStep {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

export async function createSession(
  options: StoreOptions = {},
): Promise<DocumentSession> {
  await ensureDocsDir(options.dataRoot);
  const guid = randomUUID();
  const session: DocumentSession = {
    guid,
    "doc-type": "invoice_act",
    "current-step": 1,
    completed: false,
    date: todayIsoDate(),
    services: [],
    "updated-at": nowIsoDateTime(),
  };
  const filePath = sessionPath(guid, options.dataRoot);
  await writeSessionAtomic(filePath, session);
  return session;
}

export async function readSession(
  guid: string,
  options: StoreOptions = {},
): Promise<DocumentSession> {
  assertValidGuid(guid);
  const filePath = sessionPath(guid, options.dataRoot);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new SessionNotFoundError(guid);
    }
    throw error;
  }
  return JSON.parse(raw) as DocumentSession;
}

export async function updateSession(
  guid: string,
  patch: DocumentSessionPatch,
  options: StoreOptions = {},
): Promise<DocumentSession> {
  assertValidGuid(guid);
  const current = await readSession(guid, options);

  if (patch["current-step"] !== undefined && !isWizardStep(patch["current-step"])) {
    throw new Error(`Invalid current-step: ${String(patch["current-step"])}`);
  }

  const next: DocumentSession = {
    ...current,
    ...patch,
    guid: current.guid,
    "updated-at": nowIsoDateTime(),
  };

  const filePath = sessionPath(guid, options.dataRoot);
  await writeSessionAtomic(filePath, next);
  return next;
}

export async function readSessionOrNull(
  guid: string,
  options: StoreOptions = {},
): Promise<DocumentSession | null> {
  try {
    return await readSession(guid, options);
  } catch (error) {
    if (
      error instanceof SessionNotFoundError ||
      error instanceof InvalidGuidError
    ) {
      return null;
    }
    throw error;
  }
}
