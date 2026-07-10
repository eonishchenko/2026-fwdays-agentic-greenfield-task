"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  DocumentSession,
  WizardStep,
} from "@/lib/document-session/types";

type Props = {
  guid: string;
  initialStep: WizardStep;
  initialCompleted: boolean;
};

export function SessionStubControls({
  guid,
  initialStep,
  initialCompleted,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [completed, setCompleted] = useState(initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patch(body: Partial<DocumentSession>) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/docs/${guid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? `Save failed (${res.status})`);
        return;
      }
      const session = (await res.json()) as DocumentSession;
      setStep(session["current-step"]);
      setCompleted(session.completed);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-[#E2E4E8] pt-6">
      <p className="text-sm text-[#5C6370]">
        Stub controls (until wizard-shell) — for TC-21 checks
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-[#1A1D21]">
          current-step{" "}
          <select
            className="ml-2 rounded border border-[#E2E4E8] bg-white px-2 py-1"
            value={step}
            disabled={isPending}
            onChange={(e) => {
              const next = Number(e.target.value) as WizardStep;
              setStep(next);
              patch({ "current-step": next });
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-[#1A1D21]">
          <input
            type="checkbox"
            checked={completed}
            disabled={isPending}
            onChange={(e) => {
              const next = e.target.checked;
              setCompleted(next);
              patch({ completed: next });
            }}
          />
          completed
        </label>
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {isPending ? (
        <p className="text-sm text-[#5C6370]">Saving…</p>
      ) : null}
    </div>
  );
}
