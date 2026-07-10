import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDocsDir } from "./data-root";
import { InvalidGuidError, SessionNotFoundError } from "./errors";
import { isValidGuid, sessionPath } from "./guid";
import { createSession, readSession, updateSession } from "./store";

describe("document-session store", () => {
  let dataRoot: string;

  beforeEach(async () => {
    dataRoot = await mkdtemp(path.join(tmpdir(), "doc-session-"));
  });

  afterEach(async () => {
    await rm(dataRoot, { recursive: true, force: true });
  });

  it("createSession writes defaults and UUID file", async () => {
    const session = await createSession({ dataRoot });

    expect(isValidGuid(session.guid)).toBe(true);
    expect(session["doc-type"]).toBe("invoice_act");
    expect(session["current-step"]).toBe(1);
    expect(session.completed).toBe(false);
    expect(session.services).toEqual([]);
    expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(session["updated-at"]).toBeTruthy();

    const onDisk = JSON.parse(
      await readFile(sessionPath(session.guid, dataRoot), "utf8"),
    );
    expect(onDisk).toEqual(session);
    expect(getDocsDir(dataRoot)).toBe(path.join(dataRoot, "docs"));
  });

  it("readSession round-trips created session", async () => {
    const created = await createSession({ dataRoot });
    const read = await readSession(created.guid, { dataRoot });
    expect(read).toEqual(created);
  });

  it("updateSession merges fields and bumps updated-at", async () => {
    const created = await createSession({ dataRoot });
    const before = created["updated-at"];

    await new Promise((r) => setTimeout(r, 5));

    const updated = await updateSession(
      created.guid,
      { "current-step": 4, completed: false },
      { dataRoot },
    );

    expect(updated["current-step"]).toBe(4);
    expect(updated.guid).toBe(created.guid);
    expect(updated["updated-at"]).not.toBe(before);

    const read = await readSession(created.guid, { dataRoot });
    expect(read["current-step"]).toBe(4);
  });

  it("rejects invalid guid without writing", async () => {
    await expect(readSession("../etc/passwd", { dataRoot })).rejects.toBeInstanceOf(
      InvalidGuidError,
    );
    await expect(readSession("not-a-uuid", { dataRoot })).rejects.toBeInstanceOf(
      InvalidGuidError,
    );
    await expect(sessionPath.bind(null, "abc")).toThrow(InvalidGuidError);

    await expect(
      access(path.join(dataRoot, "docs", "not-a-uuid.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("missing file is not-found and does not create a file", async () => {
    const guid = "550e8400-e29b-41d4-a716-446655440000";
    const file = sessionPath(guid, dataRoot);

    await expect(readSession(guid, { dataRoot })).rejects.toBeInstanceOf(
      SessionNotFoundError,
    );
    await expect(access(file)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
