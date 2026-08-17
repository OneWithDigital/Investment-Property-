"use client";

import { useEffect, useState } from "react";

interface LoadedAnalysis {
  inputs: any;
  result: any;
  verdict: any;
}

/**
 * Shared by every calculator tab: when the History/Portfolio tab asks to
 * load a saved analysis (identified by loadAnalysisId, with loadNonce
 * bumped on every click so re-loading the same id still fires), fetch it
 * and hand the parsed inputs/result/verdict back to the caller.
 */
export function useLoadSavedAnalysis(
  loadAnalysisId: string | undefined,
  loadNonce: number | undefined,
  onLoaded: (saved: LoadedAnalysis) => void
): string | null {
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadAnalysisId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/saved-analyses/${loadAnalysisId}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(json.error ?? "Couldn't load that saved analysis.");
          return;
        }
        setLoadError(null);
        onLoaded(json);
      } catch {
        if (!cancelled) setLoadError("Couldn't reach the server.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadNonce]);

  return loadError;
}
