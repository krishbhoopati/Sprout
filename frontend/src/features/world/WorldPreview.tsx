import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { marbleWorldUrl, worldApi } from "./api";
import type { WorldStatus } from "@/types";

// Lazy so three.js/Spark are only downloaded when a Marble world is displayed.
// The splat viewer shows the actual generated 3D world; the panorama viewer is
// a lighter fallback rendering the same world's pano image.
const SplatViewer = lazy(() =>
  import("./SplatViewer").then((m) => ({ default: m.SplatViewer }))
);
const PanoramaViewer = lazy(() =>
  import("./PanoramaViewer").then((m) => ({ default: m.PanoramaViewer }))
);

// Real Marble generation takes ~5 minutes; poll patiently.
const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 180; // ~12 minutes

type UiState = "idle" | "starting" | "processing" | "ready" | "failed";
type ViewMode = "splat" | "pano";

export function WorldPreview({
  gardenId,
  cropNames,
}: {
  gardenId: string;
  // Crop names from the plan; sent to World Labs so the generated world
  // features the vegetables the user actually planned.
  cropNames?: string[];
}) {
  const [state, setState] = useState<UiState>("idle");
  const [mode, setMode] = useState<ViewMode>("splat");
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

  const fail = (message: string) => {
    setError(message);
    setState("failed");
  };

  const finishReady = async (wid: string | null) => {
    // Render the world's actual splat scene in-app with Spark (the hosted
    // Marble viewer cannot be iframed, X-Frame-Options: DENY; we still link
    // out to it for the full experience).
    if (!wid) {
      fail("The generator did not return a world. Try again.");
      return;
    }
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
    fail("Could not load the generated world.");
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
          fail(s.error_message ?? "World generation failed. Try again.");
        }
      } catch {
        // ignore transient poll errors
      }
      if (attempts > MAX_ATTEMPTS) {
        stopPolling();
        fail("Generation is taking longer than expected. Check back soon.");
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
      fail(
        err instanceof Error ? err.message : "Could not start generation."
      );
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

      {state === "failed" && (
        <div className="mt-3 text-sm">
          <p className="text-amber-700">
            {error ?? "Could not load the 3D world."}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              className="btn-secondary"
              onClick={() => {
                // Reload the existing world when there is one — starting a
                // new generation costs credits and takes minutes.
                setError(null);
                if (worldId) {
                  setState("processing");
                  void finishReady(worldId);
                } else {
                  void start();
                }
              }}
            >
              Try again
            </button>
            {worldId && (
              <a
                href={marbleWorldUrl(worldId)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-sprout-700"
              >
                Open in Marble ↗
              </a>
            )}
          </div>
        </div>
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
                  if (!ok) fail("Could not load the generated world.");
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
              onError={() => fail("Could not load the generated world.")}
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
    </div>
  );
}
