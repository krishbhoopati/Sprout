import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { marbleWorldUrl, worldApi } from "./api";
import type { WorldStatus } from "@/types";

// Lazy so three.js/Spark are only downloaded when a real Marble world is
// displayed. The splat viewer shows the actual generated 3D world; the
// panorama viewer is a lighter fallback.
const SplatViewer = lazy(() =>
  import("./SplatViewer").then((m) => ({ default: m.SplatViewer }))
);
const PanoramaViewer = lazy(() =>
  import("./PanoramaViewer").then((m) => ({ default: m.PanoramaViewer }))
);

// A prepared, explorable demo world checked into public/demo-world/ so the
// preview always shows a convincing 3D garden on stage — served same-origin,
// so it works even when the backend is unreachable (§18).
const FALLBACK_WORLD_URL = "/demo-world/index.html";

// Real Marble generation takes ~5 minutes; poll patiently before falling back.
const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 180; // ~12 minutes

type UiState = "idle" | "starting" | "processing" | "ready" | "failed";
type ViewMode = "splat" | "pano" | "demo";

export function WorldPreview({
  gardenId,
  demoWorldUrl = FALLBACK_WORLD_URL,
  cropNames,
}: {
  gardenId: string;
  // Personalized demo-world URL (garden grid + crops). Used for the demo/mock
  // and any fallback, so the embedded 3D bed reflects the user's real plan.
  demoWorldUrl?: string;
  // Crop names from the plan; sent to World Labs so the generated world
  // features the vegetables the user actually planned.
  cropNames?: string[];
}) {
  const [state, setState] = useState<UiState>("idle");
  const [mode, setMode] = useState<ViewMode>("demo");
  const [splatUrl, setSplatUrl] = useState<string | null>(null);
  const [panoUrl, setPanoUrl] = useState<string | null>(null);
  const [worldId, setWorldId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panoUrlRef = useRef<string | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const revokePano = () => {
    if (panoUrlRef.current) {
      URL.revokeObjectURL(panoUrlRef.current);
      panoUrlRef.current = null;
    }
  };

  useEffect(
    () => () => {
      stopPolling();
      revokePano();
    },
    []
  );

  // Demo mode ALWAYS renders our own same-origin, personalized demo world.
  // We never iframe an arbitrary external URL: sites like worldlabs.ai /
  // marble.worldlabs.ai send frame-ancestors/X-Frame-Options that block
  // framing and render as broken.
  const showDemo = () => {
    setMode("demo");
    setState("ready");
  };

  const finishReady = async (wid: string | null) => {
    // A real Marble world → render its actual splat scene in-app with Spark
    // (the hosted Marble viewer cannot be iframed, X-Frame-Options: DENY;
    // we still link out to it for the full experience).
    if (wid) {
      setWorldId(wid);
      try {
        const assets = await worldApi.assets(gardenId);
        if (assets.splat_url) {
          setSplatUrl(assets.splat_url);
          setMode("splat");
          setState("ready");
          return;
        }
      } catch {
        // Assets not fetchable — try the flat panorama next.
      }
      if (await tryPano()) return;
    }
    showDemo();
  };

  // Fallback: render the world's equirectangular panorama. Returns success.
  const tryPano = async (): Promise<boolean> => {
    try {
      const url = await worldApi.panoObjectUrl(gardenId);
      revokePano();
      panoUrlRef.current = url;
      setPanoUrl(url);
      setMode("pano");
      setState("ready");
      return true;
    } catch {
      return false;
    }
  };

  const startPolling = () => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const s = await worldApi.status(gardenId);
        const status = s.status as WorldStatus;
        if (status === "ready") {
          stopPolling();
          await finishReady(s.world_id ?? null);
        } else if (status === "failed") {
          stopPolling();
          showDemo(); // fall back to the demo world rather than showing an error
        }
      } catch {
        // ignore transient poll errors
      }
      if (attempts > MAX_ATTEMPTS) {
        stopPolling();
        showDemo();
      }
    }, POLL_INTERVAL_MS);
  };

  const start = async () => {
    setError(null);
    setState("starting");
    try {
      await worldApi.start(gardenId, cropNames);
      setState("processing");
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start generation.");
      showDemo();
    }
  };

  // Generations cost real credits, so on mount resume the garden's existing
  // world (or in-flight generation) instead of asking the user to pay again.
  useEffect(() => {
    let cancelled = false;
    worldApi
      .status(gardenId)
      .then((s) => {
        if (cancelled) return;
        if (s.status === "ready" && s.world_id) {
          void finishReady(s.world_id);
        } else if (s.status === "processing" || s.status === "pending") {
          setState("processing");
          startPolling();
        }
      })
      .catch(() => {
        // No generation yet (or backend unreachable) — stay idle.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gardenId]);

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
          Generating your 3D garden from your photo… this can take a few minutes.
        </p>
      )}

      {error && state !== "ready" && (
        <p className="mt-3 text-sm text-amber-700">{error}</p>
      )}

      {state === "ready" && mode === "splat" && splatUrl && (
        <div className="mt-3">
          <Suspense
            fallback={
              <div className="h-64 w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            }
          >
            <SplatViewer
              src={splatUrl}
              className="h-64 w-full overflow-hidden rounded-lg border border-slate-200"
              onError={() => {
                tryPano().then((ok) => {
                  if (!ok) showDemo();
                });
              }}
            />
          </Suspense>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="text-xs text-slate-500">
              Drag to look around · scroll to move.
            </span>
            {worldId && (
              <a
                href={marbleWorldUrl(worldId)}
                target="_blank"
                rel="noreferrer"
                className="whitespace-nowrap text-sm font-semibold text-sprout-700"
              >
                Explore the full 3D world ↗
              </a>
            )}
          </div>
        </div>
      )}

      {state === "ready" && mode === "pano" && panoUrl && (
        <div className="mt-3">
          <Suspense
            fallback={
              <div className="h-64 w-full animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            }
          >
            <PanoramaViewer
              src={panoUrl}
              className="h-64 w-full overflow-hidden rounded-lg border border-slate-200"
              onError={() => showDemo()}
            />
          </Suspense>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Drag to look around your garden.
            </span>
            {worldId && (
              <a
                href={marbleWorldUrl(worldId)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-sprout-700"
              >
                Explore the full 3D world ↗
              </a>
            )}
          </div>
        </div>
      )}

      {state === "ready" && mode === "demo" && (
        <div className="mt-3">
          <iframe
            title="3D garden preview"
            src={demoWorldUrl}
            className="h-64 w-full rounded-lg border border-slate-200"
            allow="fullscreen"
          />
          <a
            href={demoWorldUrl}
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
