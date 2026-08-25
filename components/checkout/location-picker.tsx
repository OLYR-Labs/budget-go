"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2, MapPin } from "lucide-react";

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

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => void;
  remove: () => void;
  on: (event: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  setLatLng: (position: [number, number]) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
};

type LeafletNamespace = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMap) => unknown };
  marker: (position: [number, number]) => LeafletMarker;
};

type LeafletWindow = Window & { L?: LeafletNamespace };

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

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

    const address = data.address ?? {};
    const city =
      address.city ??
      address.town ??
      address.village ??
      address.suburb ??
      address.county ??
      "";

    return {
      address: data.display_name ?? "",
      city,
    };
  } catch {
    return null;
  }
}

export default function LocationPicker({
  branch,
  value,
  onChange,
}: LocationPickerProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

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

      const map = L.map(mapElementRef.current, {
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      map.setView(
        [
          value?.latitude ?? branch.latitude,
          value?.longitude ?? branch.longitude,
        ],
        value ? 15 : 13,
      );

      map.on("click", async (event) => {
        const latitude = event.latlng.lat;
        const longitude = event.latlng.lng;
        const details = await reverseGeocode(latitude, longitude);

        onChange({
          latitude,
          longitude,
          address: details?.address ?? "",
          city: details?.city ?? "",
        });
      });

      mapRef.current = map;
      setMapReady(true);
    };

    loadLeaflet().catch(() => {
      if (!cancelled) {
        setLocationError("The map could not be loaded. Please try again.");
      }
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
      markerRef.current = L.marker([value.latitude, value.longitude]).addTo(map);
    } else {
      markerRef.current.setLatLng([value.latitude, value.longitude]);
    }

    markerRef.current.bindPopup("Your delivery location");
    map.setView([value.latitude, value.longitude], Math.max(15, 15));
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
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const details = await reverseGeocode(latitude, longitude);

        onChange({
          latitude,
          longitude,
          address: details?.address ?? "",
          city: details?.city ?? "",
        });
        setLocating(false);
      },
      () => {
        setLocationError("We could not access your location. You can select it directly on the map.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-bold">Pin your delivery location</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click the map or use your current location. Delivery is checked against {branch.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold transition-colors hover:border-accent/50 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 text-accent" />
          )}
          Use my location
        </button>
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
