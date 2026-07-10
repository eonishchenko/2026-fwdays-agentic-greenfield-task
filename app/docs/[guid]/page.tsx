import Link from "next/link";
import {
  InvalidGuidError,
  SessionNotFoundError,
  isValidGuid,
  readSession,
} from "@/lib/document-session";
import { SessionStubControls } from "./session-stub-controls";

type PageProps = {
  params: Promise<{ guid: string }>;
};

function ErrorPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1A1D21]">
        {title}
      </h1>
      <p className="mt-3 text-base text-[#5C6370]">{detail}</p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit rounded-md bg-[#3D5A80] px-4 py-2 text-sm text-white"
      >
        Start a new document
      </Link>
    </main>
  );
}

export default async function DocumentSessionPage({ params }: PageProps) {
  const { guid } = await params;

  if (!isValidGuid(guid)) {
    return (
      <ErrorPanel
        title="Invalid document link"
        detail={`The guid “${guid}” is not a valid session id. No file was created.`}
      />
    );
  }

  let session;
  try {
    session = await readSession(guid);
  } catch (error) {
    if (
      error instanceof SessionNotFoundError ||
      error instanceof InvalidGuidError
    ) {
      return (
        <ErrorPanel
          title="Document not found"
          detail={`No session exists for guid ${guid}. No file was created for this request.`}
        />
      );
    }
    throw error;
  }

  const isCompleted = session.completed;
  const stepLabel = isCompleted
    ? "Final review (step 7)"
    : `Step ${session["current-step"]}`;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-[#5C6370]">
        Document session
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1A1D21]">
        {stepLabel}
      </h1>
      <p className="mt-2 text-sm text-[#5C6370]">
        Stub UI until wizard-shell. Reload keeps the same guid and step.
      </p>

      <dl className="mt-8 grid gap-3 text-sm">
        <div>
          <dt className="text-[#5C6370]">guid</dt>
          <dd className="font-mono text-[#1A1D21]">{session.guid}</dd>
        </div>
        <div>
          <dt className="text-[#5C6370]">doc-type</dt>
          <dd className="text-[#1A1D21]">{session["doc-type"]}</dd>
        </div>
        <div>
          <dt className="text-[#5C6370]">current-step</dt>
          <dd className="text-[#1A1D21]">{session["current-step"]}</dd>
        </div>
        <div>
          <dt className="text-[#5C6370]">completed</dt>
          <dd className="text-[#1A1D21]">{String(session.completed)}</dd>
        </div>
        <div>
          <dt className="text-[#5C6370]">date</dt>
          <dd className="text-[#1A1D21]">{session.date}</dd>
        </div>
        <div>
          <dt className="text-[#5C6370]">updated-at</dt>
          <dd className="text-[#1A1D21]">{session["updated-at"]}</dd>
        </div>
      </dl>

      {isCompleted ? (
        <div className="mt-8 rounded-md border border-[#E2E4E8] bg-white p-4">
          <p className="font-medium text-[#1A1D21]">Final review placeholder</p>
          <p className="mt-1 text-sm text-[#5C6370]">
            PDF and edit actions will land with later capabilities.
          </p>
        </div>
      ) : null}

      <a
        href={`/api/docs/${guid}/export`}
        className="mt-8 inline-flex w-fit rounded-md border border-[#E2E4E8] bg-white px-4 py-2 text-sm text-[#1A1D21]"
      >
        Download JSON
      </a>

      <SessionStubControls
        guid={guid}
        initialStep={session["current-step"]}
        initialCompleted={session.completed}
      />
    </main>
  );
}
