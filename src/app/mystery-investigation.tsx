"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import type { MysteryWorkspaceViewId } from "../domain/mystery/mystery-view-model";
import type { PublicMysteryWorkspaceViewModel } from "./mystery-page-data";

type MysteryInvestigationPageProps = {
  viewModel: PublicMysteryWorkspaceViewModel | null;
};

function toFixtureImageUrl(path: string) {
  const fileName = path.split("/").at(-1);

  return fileName ? `/fixtures/web-images/${fileName}` : path;
}

function formatSource(source: string) {
  return source.replace(/_/g, " ");
}

export function MysteryInvestigationPage({ viewModel }: MysteryInvestigationPageProps) {
  const [activeView, setActiveView] = useState<MysteryWorkspaceViewId>("detail");
  const [showFullColor, setShowFullColor] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [normalized, setNormalized] = useState(false);
  const [promptStatus, setPromptStatus] = useState("Safe prompt ready");
  const pasteFieldRef = useRef<HTMLTextAreaElement>(null);

  if (!viewModel) {
    return (
      <main className="mystery-shell">
        <section className="mystery-device" aria-labelledby="mystery-missing-title">
          <h1 id="mystery-missing-title">Mystery not found</h1>
        </section>
      </main>
    );
  }

  const detail = viewModel.views.detail;
  const externalHandoff = viewModel.views.externalHandoff;
  const pasteNormalize = viewModel.views.pasteNormalize;
  const resolveCandidate = viewModel.views.resolveCandidate;
  const activeCandidate = resolveCandidate.activeCandidate;

  async function copyPrompt() {
    if (!navigator.clipboard?.writeText) {
      setPromptStatus("Copy failed. Select and copy the prompt manually.");
      return;
    }

    try {
      await navigator.clipboard.writeText(externalHandoff.promptPreview);
      setPromptStatus("Prompt copied for external LLM");
    } catch {
      setPromptStatus("Copy failed. Select and copy the prompt manually.");
    }
  }

  function normalizePaste() {
    const pastedResolution = pasteText.trim() || pasteFieldRef.current?.value.trim() || "";

    if (pastedResolution) {
      setPasteText(pastedResolution);
      setNormalized(true);
    }
  }

  function updatePasteText(value: string) {
    setPasteText(value);
    setNormalized(false);
  }

  return (
    <main className="mystery-shell">
      <section className="mystery-device" aria-labelledby="mystery-title">
        <header className="device-header mystery-device__header">
          <div className="device-brand">
            <span className="device-lens" aria-hidden="true" />
            <div>
              <span>Hill Country DripDex</span>
              <strong>Mystery Investigation</strong>
            </div>
          </div>
          <div className="device-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </header>

        <div className="mystery-screen">
          <section className="mystery-hero" aria-labelledby="mystery-title">
            <div>
              <p>Fixture-backed workflow</p>
              <h1 id="mystery-title">{viewModel.title}</h1>
            </div>
            <span>{viewModel.status.replace("_", " ").toUpperCase()}</span>
          </section>

          <nav className="mystery-tabs" aria-label="Mystery workflow navigation">
            {viewModel.navigation.map((item) => (
              <button
                key={item.id}
                aria-pressed={activeView === item.id}
                onClick={() => setActiveView(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {activeView === "detail" ? (
            <section className="mystery-panel mystery-panel--detail" aria-label="Mystery detail">
              <figure className="mystery-photo">
                <Image
                  alt={`${detail.photo.altText} mystery`}
                  className={showFullColor ? "mystery-photo__image" : "mystery-photo__image mystery-photo__image--muted"}
                  height={detail.photo.files.full ? 1200 : 840}
                  priority
                  src={toFixtureImageUrl(detail.photo.files.full)}
                  unoptimized
                  width={1600}
                />
                <span aria-hidden="true">?</span>
              </figure>
              <div className="mystery-detail-stack">
                <button
                  className="mystery-color-toggle"
                  onClick={() => setShowFullColor((current) => !current)}
                  type="button"
                >
                  {showFullColor ? "Return to Mystery Grayscale" : "Show Full Color"}
                </button>
                <section className="mystery-card" aria-label="Known clues">
                  <h2>Known Clues</h2>
                  <dl>
                    <div>
                      <dt>Place</dt>
                      <dd>{detail.knownClues.publicLocationLabel}</dd>
                    </div>
                    <div>
                      <dt>Public State</dt>
                      <dd>{detail.privacyState.publicMystery ? "Published mystery" : "Private mystery"}</dd>
                    </div>
                    <div>
                      <dt>Notes</dt>
                      <dd>{detail.knownClues.notes}</dd>
                    </div>
                  </dl>
                </section>
                <section className="mystery-card" aria-label="Candidate history">
                  <h2>Candidate IDs</h2>
                  <div className="mystery-candidates">
                    {detail.candidateHistory.map((candidate) => (
                      <article key={candidate.id}>
                        <strong>{candidate.commonName}</strong>
                        <span>{candidate.notes}</span>
                        <p>
                          {candidate.status} / {formatSource(candidate.source)}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </section>
          ) : null}

          {activeView === "external_handoff" ? (
            <section className="mystery-panel" aria-label="External LLM handoff">
              <div className="mystery-panel__header">
                <div>
                  <h2>Ask Your Chatbot</h2>
                  <p>Copy a safe prompt, download the photo, and investigate elsewhere.</p>
                </div>
                <span>Exact GPS hidden from public prompt</span>
              </div>
              <div className="mystery-actions">
                <button onClick={() => void copyPrompt()} type="button">
                  Copy Prompt for LLM
                </button>
                <a
                  download
                  href={toFixtureImageUrl(externalHandoff.downloadPhoto.file)}
                >
                  Download Photo
                </a>
              </div>
              <p className="mystery-prompt-status">{promptStatus}</p>
              <pre className="mystery-prompt">{externalHandoff.promptPreview}</pre>
            </section>
          ) : null}

          {activeView === "paste_normalize" ? (
            <section className="mystery-panel" aria-label="Paste and normalize">
              <div className="mystery-panel__header">
                <div>
                  <h2>Paste Resolution</h2>
                  <p>Bring back any useful answer. DripDex shapes it.</p>
                </div>
                <span>Draft normalization</span>
              </div>
              <label className="mystery-paste">
                Paste Resolution from LLM
                <textarea
                  ref={pasteFieldRef}
                  onChange={(event) => {
                    updatePasteText(event.currentTarget.value);
                  }}
                  onInput={(event) => {
                    updatePasteText(event.currentTarget.value);
                  }}
                  placeholder={pasteNormalize.pastePlaceholder}
                  value={pasteText}
                />
              </label>
              <div className="mystery-actions">
                <button onClick={normalizePaste} type="button">
                  Normalize with AI
                </button>
                <button
                  onClick={() => {
                    setPasteText("");
                    setNormalized(false);
                  }}
                  type="button"
                >
                  Clear Paste
                </button>
              </div>
              <div className="mystery-validation" data-state={normalized ? "normalized" : "pending"} role="status">
                <strong>Owner review required</strong>
                <span>Normalized output is a candidate suggestion only, not an authority.</span>
              </div>
            </section>
          ) : null}

          {activeView === "resolve_candidate" ? (
            <section className="mystery-panel" aria-label="Resolve candidate">
              <div className="mystery-panel__header">
                <div>
                  <h2>Review Candidate</h2>
                  <p>External output is valid. Owner still decides.</p>
                </div>
                <span>{activeCandidate ? "Candidate" : "No candidate"}</span>
              </div>
              {activeCandidate ? (
                <article className="mystery-resolution">
                  <strong>{activeCandidate.commonName}</strong>
                  <span>{activeCandidate.scientificName ?? "Scientific name unknown"}</span>
                  <p>{activeCandidate.notes}</p>
                </article>
              ) : null}
              <div className="mystery-actions mystery-actions--resolve">
                {resolveCandidate.actions.map((action) => (
                  <button key={action.id} type="button">
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
