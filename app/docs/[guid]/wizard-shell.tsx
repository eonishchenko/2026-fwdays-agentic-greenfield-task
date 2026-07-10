"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type {
  ContactRef,
  DocType,
  DocumentSession,
  ServiceLine,
  WizardStep,
} from "@/lib/document-session/types";
import { ContactsStep } from "./contacts-step";
import { DocumentNumberingStep } from "./document-numbering-step";
import { DocumentTypeStep } from "./document-type-step";
import { ServicesStep } from "./services-step";
import { TemplateFillStep } from "./template-fill-step";

const STEPS: WizardStep[] = [1, 2, 3, 4, 5, 6, 7];

const STEP_STUBS: Record<
  Exclude<WizardStep, 1 | 2 | 3 | 4 | 5 | 6>,
  { title: string; placeholder: string }
> = {
  7: {
    title: "Крок 7 — Фінальний перегляд",
    placeholder: "Тут з’являться PDF та дії редагування.",
  },
};

type ProgressState = "past" | "current" | "future";

function progressState(step: WizardStep, current: WizardStep): ProgressState {
  if (step < current) return "past";
  if (step === current) return "current";
  return "future";
}

function stepTitle(step: WizardStep, completed: boolean): string {
  if (completed) return "Фінальний перегляд";
  if (step === 1) return "Крок 1 — Тип документа";
  if (step === 2) return "Крок 2 — Дата та номери";
  if (step === 3) return "Крок 3 — Замовник";
  if (step === 4) return "Крок 4 — Виконавець";
  if (step === 5) return "Крок 5 — Послуги";
  if (step === 6) return "Крок 6 — Перегляд";
  return STEP_STUBS[step].title;
}

type Props = {
  guid: string;
  initialStep: WizardStep;
  completed: boolean;
  initialDocType: DocType;
  initialCopiedFrom?: string;
  initialDate: string;
  initialInvoiceNumber?: string;
  initialActNumber?: string;
  initialClient?: ContactRef;
  initialDoneBy?: ContactRef;
  initialServices?: ServiceLine[];
};

export function WizardShell({
  guid,
  initialStep,
  completed,
  initialDocType,
  initialCopiedFrom,
  initialDate,
  initialInvoiceNumber,
  initialActNumber,
  initialClient,
  initialDoneBy,
  initialServices = [],
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [docType, setDocType] = useState<DocType>(initialDocType);
  const [client, setClient] = useState<ContactRef | undefined>(initialClient);
  const [doneBy, setDoneBy] = useState<ContactRef | undefined>(initialDoneBy);
  const [services, setServices] = useState<ServiceLine[]>(initialServices);
  const [error, setError] = useState<string | null>(null);
  const [pendingCopyGuid, setPendingCopyGuid] = useState(false);
  const [dateValid, setDateValid] = useState(true);
  const [isPending, startTransition] = useTransition();
  const issueNumbersRef = useRef<
    (() => Promise<DocumentSession | null>) | null
  >(null);
  const saveContactRef = useRef<
    ((nextStep: WizardStep) => Promise<DocumentSession | null>) | null
  >(null);
  const saveServicesRef = useRef<
    ((nextStep: WizardStep) => Promise<DocumentSession | null>) | null
  >(null);

  const displayStep: WizardStep = completed ? 7 : step;
  const canGoBack = !completed && step > 1;
  const canGoNext = !completed && step < 7;

  function applySession(session: DocumentSession) {
    setStep(session["current-step"]);
    setDocType(session["doc-type"]);
    setClient(session.client);
    setDoneBy(session["done-by"]);
    setServices(session.services);
  }

  function navigate(next: WizardStep) {
    if (completed || isPending || next === step) return;
    if (step === 1 && next > step && pendingCopyGuid) {
      setError(
        "Застосуйте копіювання або очистіть поле guid перед переходом далі",
      );
      return;
    }
    if (step === 2 && next > step && !dateValid) {
      setError("Вкажіть коректну дату документа");
      return;
    }
    setError(null);
    startTransition(async () => {
      if (step === 2 && next > step) {
        const issue = issueNumbersRef.current;
        if (!issue) {
          setError("Не вдалося видати номери");
          return;
        }
        const issued = await issue();
        if (!issued) {
          return;
        }
      }

      if ((step === 3 || step === 4) && next > step) {
        const save = saveContactRef.current;
        if (!save) {
          setError("Не вдалося зберегти контакт");
          return;
        }
        const saved = await save(next);
        if (!saved) {
          return;
        }
        applySession(saved);
        router.refresh();
        return;
      }

      if (step === 5 && next > step) {
        const save = saveServicesRef.current;
        if (!save) {
          setError("Не вдалося зберегти послуги");
          return;
        }
        const saved = await save(next);
        if (!saved) {
          return;
        }
        applySession(saved);
        router.refresh();
        return;
      }

      const res = await fetch(`/api/docs/${guid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "current-step": next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? `Не вдалося зберегти крок (${res.status})`);
        return;
      }
      const session = (await res.json()) as DocumentSession;
      applySession(session);
      router.refresh();
    });
  }

  function handleSessionUpdated(session: DocumentSession) {
    setDocType(session["doc-type"]);
    setClient(session.client);
    setDoneBy(session["done-by"]);
    setServices(session.services);
    router.refresh();
  }

  return (
    <div className="wizard-shell flex min-h-full flex-1 flex-col">
      <main
        className={`mx-auto flex w-full flex-1 flex-col px-6 py-10 ${
          displayStep === 6 && !completed ? "max-w-6xl" : "max-w-2xl"
        }`}
      >
        <header className="mb-8">
          <p
            className="text-sm font-medium uppercase tracking-wide"
            style={{ color: "var(--wizard-muted)" }}
          >
            Документ
          </p>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: "var(--wizard-text)" }}
          >
            {stepTitle(displayStep, completed)}
          </h1>
          <p
            className="mt-1 font-mono text-xs"
            style={{ color: "var(--wizard-muted)" }}
          >
            {guid}
          </p>
        </header>

        <nav
          aria-label="Прогрес кроків"
          className="mb-8 flex flex-wrap items-center justify-between gap-2"
        >
          {STEPS.map((n) => {
            const state = progressState(n, displayStep);
            return (
              <div
                key={n}
                className="wizard-progress-circle"
                data-state={state}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={`Крок ${n}${state === "current" ? " (поточний)" : state === "past" ? " (пройдений)" : " (наступний)"}`}
              >
                {n}
              </div>
            );
          })}
        </nav>

        <section
          className="flex-1 rounded-[var(--wizard-radius)] border p-6"
          style={{
            background: "var(--wizard-surface)",
            borderColor: "var(--wizard-border)",
          }}
          aria-live="polite"
        >
          {completed ? (
            <>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--wizard-text)" }}
              >
                Фінальний перегляд
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--wizard-muted)" }}>
                Сеанс завершено. PDF та «Редагувати» з’являться з пізнішими
                можливостями.
              </p>
            </>
          ) : displayStep === 1 ? (
            <DocumentTypeStep
              guid={guid}
              initialDocType={initialDocType}
              initialCopiedFrom={initialCopiedFrom}
              onSessionUpdated={handleSessionUpdated}
              onCopyFieldChange={setPendingCopyGuid}
            />
          ) : displayStep === 2 ? (
            <DocumentNumberingStep
              guid={guid}
              docType={docType}
              initialDate={initialDate}
              initialInvoiceNumber={initialInvoiceNumber}
              initialActNumber={initialActNumber}
              onSessionUpdated={handleSessionUpdated}
              onDateValidityChange={setDateValid}
              onIssueRequest={(issue) => {
                issueNumbersRef.current = issue;
              }}
            />
          ) : displayStep === 3 ? (
            <ContactsStep
              key="client"
              guid={guid}
              role="client"
              initialContact={client}
              onSessionUpdated={handleSessionUpdated}
              onSaveRequest={(save) => {
                saveContactRef.current = save;
              }}
            />
          ) : displayStep === 4 ? (
            <ContactsStep
              key="done-by"
              guid={guid}
              role="done-by"
              initialContact={doneBy}
              onSessionUpdated={handleSessionUpdated}
              onSaveRequest={(save) => {
                saveContactRef.current = save;
              }}
            />
          ) : displayStep === 5 ? (
            <ServicesStep
              guid={guid}
              initialServices={services}
              onSessionUpdated={handleSessionUpdated}
              onSaveRequest={(save) => {
                saveServicesRef.current = save;
              }}
            />
          ) : displayStep === 6 ? (
            <TemplateFillStep guid={guid} docType={docType} />
          ) : (
            <>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--wizard-text)" }}
              >
                {STEP_STUBS[displayStep].title}
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--wizard-muted)" }}>
                {STEP_STUBS[displayStep].placeholder}
              </p>
            </>
          )}
        </section>

        {error ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {!completed ? (
          <div className="mt-8 flex items-center justify-between gap-4">
            {canGoBack ? (
              <button
                type="button"
                className="wizard-btn wizard-btn-secondary"
                disabled={isPending}
                onClick={() => navigate((step - 1) as WizardStep)}
              >
                Назад
              </button>
            ) : (
              <span />
            )}
            {canGoNext ? (
              <button
                type="button"
                className="wizard-btn wizard-btn-primary"
                disabled={isPending}
                onClick={() => navigate((step + 1) as WizardStep)}
              >
                Далі
              </button>
            ) : (
              <span />
            )}
          </div>
        ) : null}

        <a
          href={`/api/docs/${guid}/export`}
          className="wizard-btn wizard-btn-secondary mt-8 w-fit"
        >
          Download JSON
        </a>
      </main>
    </div>
  );
}
