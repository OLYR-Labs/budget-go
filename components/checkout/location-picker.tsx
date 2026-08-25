"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2, MapPin, Search } from "lucide-react";

type BranchLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

type LocationValue = {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
};

type LocationPickerProps = {
  branch: BranchLocation;
  value: LocationValue | null;
  onChange: (value: LocationValue) => void;
};

type LatLng = { lat: number; lng: number };

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => void;
  remove: () => void;
  on: (event: string, handler: (event: { latlng: LatLng }) => void) => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (position: [number, number]) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
  on: (event: string, handler: (event: { latlng: LatLng }) => void) => LeafletMarker;
};

type LeafletNamespace = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => unknown };
  marker: (position: [number, number], options?: Record<string, unknown>) => LeafletMarker;
};

type LeafletWindow = Window & { L?: LeafletNamespace };

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string | undefined>;
};

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function getCity(address: Record<string, string | undefined> | undefined) {
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.suburb ??
    address?.county ??
    ""
  );
}

async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { headers: { Accept: "application/json" } },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };

    return {
      address: data.display_name ?? "",
      city: getCity(data.address),
    };
  } catch {
    return null;
  }
}

async function searchPlaces(query: string) {
  if (!query.trim()) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=lk&q=${encodeURIComponent(query.trim())}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) throw new Error("Search failed.");
  return (await response.json()) as SearchResult[];
}

export default function LocationPicker({ branch, value, onChange }: LocationPickerProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [locationError, setLocationError] = useState("");

  const selectLocation = async (latitude: number, longitude: number) => {
    const details = await reverseGeocode(latitude, longitude);
    onChange({
      latitude,
      longitude,
      address: details?.address ?? "",
      city: details?.city ?? "",
    });
    setSearchResults([]);
  };

  useEffect(() => {
    let cancelled = false;

    const loadLeaflet = async () => {
      if (!document.querySelector('link[data-budget-go-leaflet="true"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS;
        link.dataset.budgetGoLeaflet = "true";
        document.head.appendChild(link);
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-budget-go-leaflet="true"]',
      );

      if (!existingScript) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = LEAFLET_JS;
          script.async = true;
          script.dataset.budgetGoLeaflet = "true";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Map library failed to load."));
          document.body.appendChild(script);
        });
      } else if (!(window as LeafletWindow).L) {
        await new Promise<void>((resolve) => {
          existingScript.addEventListener("load", () => resolve(), { once: true });
        });
      }

      if (cancelled || !mapElementRef.current || mapRef.current) return;

      const L = (window as LeafletWindow).L;
      if (!L) {
        setLocationError("The map could not be loaded. Please try again.");
        return;
      }

      const map = L.map(mapElementRef.current, { scrollWheelZoom: true });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      map.setView(
        [value?.latitude ?? branch.latitude, value?.longitude ?? branch.longitude],
        value ? 15 : 13,
      );

      map.on("click", (event) => {
        void selectLocation(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;
      setMapReady(true);
    };

    loadLeaflet().catch(() => {
      if (!cancelled) setLocationError("The map could not be loaded. Please try again.");
    });

    return () => {
      cancelled = true;
    };
  }, [branch.latitude, branch.longitude, onChange, value?.latitude, value?.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as LeafletWindow).L;
    if (!map || !L || !value) return;

    if (!markerRef.current) {
      markerRef.current = L.marker([value.latitude, value.longitude], { draggable: true })
        .addTo(map)
        .on("dragend", (event) => {
          void selectLocation(event.latlng.lat, event.latlng.lng);
        });
    } else {
      markerRef.current.setLatLng([value.latitude, value.longitude]);
    }

    markerRef.current.bindPopup("Your delivery location");
    map.setView([value.latitude, value.longitude], 15);
  }, [value]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const useCurrentLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Location services are not supported by this browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void selectLocation(position.coords.latitude, position.coords.longitude).finally(() => {
          setLocating(false);
        });
      },
      () => {
        setLocationError("We could not access your location. You can select it directly on the map.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocationError("");
    setSearching(true);

    try {
      setSearchResults(await searchPlaces(searchQuery));
    } catch {
      setLocationError("We could not search that address. Please try again or select the location on the map.");
    } finally {
      setSearching(false);
    }
  };

  const chooseSearchResult = (result: SearchResult) => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    onChange({
      latitude,
      longitude,
      address: result.display_name,
      city: getCity(result.address),
    });
    setSearchQuery(result.display_name);
    setSearchResults([]);
    mapRef.current?.setView([latitude, longitude], 16);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="border-b border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Pin your delivery location</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Search your address, click the map, drag the pin, or use your current location.
            </p>
          </div>

          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold transition-colors hover:border-accent/50 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4 text-accent" />}
            Use my location
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative mt-4 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search your address or area in Sri Lanka"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-14 z-[1000] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              {searchResults.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}`}
                  type="button"
                  onClick={() => chooseSearchResult(result)}
                  className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left text-xs last:border-b-0 hover:bg-muted"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div ref={mapElementRef} className="h-80 w-full" />

      <div className="border-t border-border px-4 py-3">
        {locationError ? (
          <p className="text-xs font-medium text-destructive">{locationError}</p>
        ) : value ? (
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="font-bold">Location selected</p>
              <p className="mt-1 text-muted-foreground">
                {value.address || `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {mapReady ? "Select a point on the map to continue." : "Loading map..."}
          </p>
        )}
      </div>
    </div>
  );
}
