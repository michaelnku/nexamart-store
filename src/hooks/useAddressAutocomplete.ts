"use client";

import { useCallback, useRef, useState } from "react";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/config/mapbox.client";

export type AddressSuggestion = {
  id: string;
  place_name: string;
  center: [number, number];
  text?: string;
  address?: string;
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
};

type MapboxAutocompleteResponse = {
  features?: AddressSuggestion[];
};

type UseAddressAutocompleteResult = {
  suggestions: AddressSuggestion[];
  loading: boolean;
  error: string | null;
  search: (query: string) => void;
  clear: () => void;
};

const MAPBOX_GEOCODE_BASE_URL =
  "https://api.mapbox.com/geocoding/v5/mapbox.places";

export function useAddressAutocomplete(): UseAddressAutocompleteResult {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clear = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, []);

  const search = useCallback((query: string) => {
    const trimmed = query.trim();

    if (!MAPBOX_PUBLIC_TOKEN) {
      setError("Address suggestions are unavailable right now.");
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      const encoded = encodeURIComponent(trimmed);
      const url =
        `${MAPBOX_GEOCODE_BASE_URL}/${encoded}.json` +
        `?autocomplete=true&types=address,place&limit=5&access_token=${MAPBOX_PUBLIC_TOKEN}`;

      try {
        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Mapbox autocomplete failed (${response.status})`);
        }

        const data = (await response.json()) as MapboxAutocompleteResponse;
        const next = (data.features ?? []).filter(
          (feature) =>
            Array.isArray(feature.center) &&
            feature.center.length === 2 &&
            Number.isFinite(feature.center[0]) &&
            Number.isFinite(feature.center[1]),
        );

        setSuggestions(next);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setSuggestions([]);
        setError("Unable to load address suggestions.");
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  return {
    suggestions,
    loading,
    error,
    search,
    clear,
  };
}
