export { getDataRoot, getContactsDir, getDocsDir } from "./data-root";
export { InvalidGuidError, SessionNotFoundError } from "./errors";
export { assertValidGuid, isValidGuid, sessionPath } from "./guid";
export {
  copySessionFields,
  createSession,
  isDocType,
  readSession,
  readSessionOrNull,
  updateSession,
  type StoreOptions,
} from "./store";
export type {
  ContactRef,
  DocType,
  DocumentSession,
  DocumentSessionPatch,
  ServiceLine,
  WizardStep,
} from "./types";
