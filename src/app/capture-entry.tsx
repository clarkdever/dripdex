"use client";

import Image from "next/image";
import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";

type CaptureSource = "upload" | "scanner";
type CaptureStatus = "idle" | "ready" | "thanks" | "located" | "scanning";
type SubjectPoint = {
  x: number;
  y: number;
};
type ImageNaturalSize = {
  width: number;
  height: number;
};

const previewImage = "/fixtures/web-images/texas-spiny-lizard-card.jpg";
const fallbackImageNaturalSize = {
  width: 800,
  height: 420
};

function formatPoint(point: SubjectPoint) {
  return `x ${point.x.toFixed(2)} / y ${point.y.toFixed(2)}`;
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function CaptureEntryPage() {
  const [source, setSource] = useState<CaptureSource | null>(null);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [subjectPoint, setSubjectPoint] = useState<SubjectPoint | null>(null);
  const [displayPoint, setDisplayPoint] = useState<SubjectPoint | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<ImageNaturalSize>(
    fallbackImageNaturalSize
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [candidateName, setCandidateName] = useState<string | null>(null);
  const [candidateScientific, setCandidateScientific] = useState<string | null>(null);

  const hasPreview = source !== null;

  useEffect(
    () => () => {
      if (targetTimer.current) {
        clearTimeout(targetTimer.current);
      }
    },
    []
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setSource("upload");
      setStatus("ready");
      setSubjectPoint(null);
      setDisplayPoint(null);
    }
  }

  function startCapture(nextSource: CaptureSource) {
    if (targetTimer.current) {
      clearTimeout(targetTimer.current);
    }
    
    if (nextSource === "upload" && fileInputRef.current) {
      fileInputRef.current.click();
    }

    setSource(nextSource);
    setStatus("ready");
    setSubjectPoint(null);
    setDisplayPoint(null);
  }

  function recordSubjectPoint(bounds: DOMRect, clientX: number, clientY: number) {
    if (!hasPreview) {
      return;
    }

    const imageAspectRatio = imageNaturalSize.width / imageNaturalSize.height;
    const targetAspectRatio = bounds.width / bounds.height;
    const renderedImage =
      targetAspectRatio > imageAspectRatio
        ? {
            width: bounds.height * imageAspectRatio,
            height: bounds.height,
            left: bounds.left + (bounds.width - bounds.height * imageAspectRatio) / 2,
            top: bounds.top
          }
        : {
            width: bounds.width,
            height: bounds.width / imageAspectRatio,
            left: bounds.left,
            top: bounds.top + (bounds.height - bounds.width / imageAspectRatio) / 2
          };
    const point = {
      x: clamp((clientX - renderedImage.left) / renderedImage.width),
      y: clamp((clientY - renderedImage.top) / renderedImage.height)
    };
    const targetPoint = {
      x: clamp((clientX - bounds.left) / bounds.width),
      y: clamp((clientY - bounds.top) / bounds.height)
    };

    if (targetTimer.current) {
      clearTimeout(targetTimer.current);
    }

    setSubjectPoint(point);
    setDisplayPoint(targetPoint);
    setStatus("thanks");
    targetTimer.current = setTimeout(() => {
      setStatus("scanning");
      submitIdentification(point);
    }, 650);
  }

  async function submitIdentification(point: SubjectPoint) {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("subjectHint", JSON.stringify(point));

      const res = await fetch("/api/identify", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      console.log("Identification result:", data);
      
      if (data.result && data.result.type === "identification_candidate") {
        const topCandidate = data.result.result.identityCandidates[0];
        setCandidateName(topCandidate?.commonName || "Unknown");
        setCandidateScientific(topCandidate?.scientificName || "Unknown");
        
        const updateUI = () => {
          setStatus("located");
          dialogRef.current?.showModal();
        };

        if (document.startViewTransition) {
          document.startViewTransition(updateUI);
        } else {
          updateUI();
        }
      } else {
        alert("Failed to identify");
        setStatus("located");
      }
    } catch (err) {
      console.error(err);
      alert("Error identifying image");
      setStatus("located");
    }
  }

  function recordSubjectTap(event: MouseEvent<HTMLDivElement>) {
    recordSubjectPoint(
      event.currentTarget.getBoundingClientRect(),
      event.clientX,
      event.clientY
    );
  }

  function recordKeyboardSubjectTap(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    recordSubjectPoint(bounds, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  }

  const statusCopy =
    status === "scanning"
      ? "Analyzing biological signature..."
      : status === "located"
        ? "Subject Located"
        : status === "thanks"
          ? "Thank you for your help"
          : status === "ready"
            ? "Tap the subject"
            : "Choose a path";

  return (
    <main className="capture-shell">
      <section className="capture-device" aria-labelledby="capture-title">
        <header className="device-header capture-device__header">
          <div className="device-brand">
            <span className="device-lens" aria-hidden="true" />
            <div>
              <span>DripDex Capture</span>
              <strong>Owner field mode</strong>
            </div>
          </div>
          <div className="device-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </header>

        <div className="capture-screen">
          <section className="capture-entry-panel" aria-labelledby="capture-title">
            <div>
              <p className="capture-kicker">Add Find</p>
              <h1 id="capture-title">Start a field note</h1>
            </div>
            <div className="capture-actions" aria-label="Capture entry actions">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button type="button" onClick={() => startCapture("upload")}>
                Upload Photo
              </button>
              <button type="button" onClick={() => startCapture("scanner")}>
                Open Scanner
              </button>
            </div>
          </section>

          <section
            aria-label="Capture preview"
            className={`capture-preview ${hasPreview ? "is-active" : ""}`}
            data-source={source ?? "none"}
          >
            <div
              aria-label="Shared capture preview target"
              className="capture-preview__target"
              onClick={hasPreview ? recordSubjectTap : undefined}
              onKeyDown={hasPreview ? recordKeyboardSubjectTap : undefined}
              role={hasPreview ? "button" : undefined}
              tabIndex={hasPreview ? 0 : undefined}
            >
              {hasPreview ? (
                <Image
                  alt="Texas Spiny Lizard preview"
                  className="capture-preview__image"
                  height={420}
                  onLoad={(event) => {
                    setImageNaturalSize({
                      width: event.currentTarget.naturalWidth || fallbackImageNaturalSize.width,
                      height: event.currentTarget.naturalHeight || fallbackImageNaturalSize.height
                    });
                  }}
                  priority
                  src={previewUrl || previewImage}
                  unoptimized
                  width={800}
                />
              ) : (
                <div className="capture-preview__empty" aria-hidden="true">
                  <span />
                </div>
              )}
              {hasPreview ? null : (
                <span className="capture-preview__inactive">Choose a path first</span>
              )}
              {displayPoint ? (
                <span
                  aria-hidden="true"
                  className={`capture-crosshair ${
                    status === "located" ? "capture-crosshair--locked" : ""
                  }`}
                  style={{
                    left: `${displayPoint.x * 100}%`,
                    top: `${displayPoint.y * 100}%`
                  }}
                />
              ) : null}
              {status === "scanning" ? <div className="capture-scanner-sweep" /> : null}
            </div>

            <aside className="capture-hud" aria-live="polite" role="status">
              <span>{source === "scanner" ? "Scanner path" : source === "upload" ? "Upload path" : "Ready"}</span>
              <strong>{statusCopy}</strong>
              <p>
                {subjectPoint
                  ? formatPoint(subjectPoint)
                  : "Both paths meet here before review."}
              </p>
            </aside>
          </section>
        </div>
      </section>
      
      <dialog ref={dialogRef} className="reveal-dialog" style={{ viewTransitionName: 'reveal' }}>
        <h2>{candidateName}</h2>
        <p className="scientific-name">{candidateScientific}</p>
        <div className="reveal-actions">
          <button type="button" className="btn-primary" onClick={() => dialogRef.current?.close()}>
            Save to Field Notes
          </button>
          <button type="button" className="btn-secondary" onClick={() => dialogRef.current?.close()}>
            Discard
          </button>
        </div>
      </dialog>
    </main>
  );
}
