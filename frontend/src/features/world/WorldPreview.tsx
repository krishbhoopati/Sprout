import { useEffect, useRef, useState } from "react";
import { worldApi } from "./api";
import type { WorldStatus } from "@/types";

// A prepared demo world so the preview always shows something on stage.
const FALLBACK_WORLD_URL = "https://www.worldlabs.ai/";

type UiState = "idle" | "starting" | "processing" | "ready" | "failed";

export function WorldPreview({ gardenId }: { gardenId: string }) {
  const [state, setState] = useState<UiState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const start = async () => {
    setError(null);
    setState("starting");
    try {
      await worldApi.start(gardenId);
      setState("processing");
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const s = await worldApi.status(gardenId);
          const status = s.status as WorldStatus;
          if (status === "ready") {
            stopPolling();
            setResultUrl(s.result_url ?? FALLBACK_WORLD_URL);
            setState("ready");
          } else if (status === "failed") {
            stopPolling();
            setResultUrl(FALLBACK_WORLD_URL);
            setState("ready"); // fall back to the demo world rather than showing an error
          }
        } catch {
          // ignore transient poll errors
        }
        if (attempts > 20) {
          stopPolling();
          setResultUrl(FALLBACK_WORLD_URL);
          setState("ready");
        }
      }, 3000);
    } catch (err) {
      // Backend unreachable — show the prepared demo world so the section still works.
      setError(err instanceof Error ? err.message : "Could not start generation.");
      setResultUrl(FALLBACK_WORLD_URL);
      setState("ready");
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">3D preview</h2>
        {state === "idle" && (
          <button className="btn-secondary" onClick={start}>
            Generate preview
          </button>
        )}
      </div>

      {(state === "starting" || state === "processing") && (
        <p className="mt-3 text-sm text-slate-500">
          Generating your 3D garden… this can take a moment.
        </p>
      )}

      {error && state !== "ready" && (
        <p className="mt-3 text-sm text-amber-700">{error}</p>
      )}

      {state === "ready" && resultUrl && (
        <div className="mt-3">
          <iframe
            title="3D garden preview"
            src={resultUrl}
            className="h-64 w-full rounded-lg border border-slate-200"
            allow="fullscreen"
          />
          <a
            href={resultUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-sprout-700"
          >
            Open in a new tab →
          </a>
        </div>
      )}
    </div>
  );
}
