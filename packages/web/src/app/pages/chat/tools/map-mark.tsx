import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { defineClientTool } from '../client-tool-executor';
import { renderInToolArea } from '../tool-area-bridge';

// Declare Google Maps types for TypeScript
declare global {
  interface Window {
    google?: typeof google;
  }
  namespace google {
    namespace maps {
      class Map {
        constructor(element: HTMLElement, options: MapOptions);
        fitBounds(bounds: LatLngBounds): void;
        addListener(event: string, handler: (e: any) => void): void;
      }
      class Marker {
        constructor(options: MarkerOptions);
        addListener(event: string, handler: () => void): void;
        setMap(map: Map | null): void;
        getPosition(): LatLng | null;
      }
      class LatLngBounds {
        constructor();
        extend(point: LatLngLiteral): void;
      }
      interface MapOptions {
        center?: LatLngLiteral;
        zoom?: number;
        mapTypeId?: string;
      }
      interface MarkerOptions {
        position: LatLngLiteral;
        map: Map;
        title?: string;
        label?: { text: string; color: string };
        draggable?: boolean;
      }
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      interface LatLng {
        lat(): number;
        lng(): number;
      }
      interface MapMouseEvent {
        latLng: LatLng | null;
      }
    }
  }
}

// Result differs based on editable mode:
// - editable=false (view mode): { cancelled: false, markers: originalMarkers } on Close
// - editable=true: { cancelled: false, markers: [...] } on OK,
//                  { cancelled: true, markers: [] } on Cancel
export interface MapMarkResult {
  cancelled: boolean;
  markers: Array<{ lat: number; lng: number; label?: string }>;
}

// --- Google Maps API loader (dynamic script injection) ---

let loadPromise: Promise<void> | null = null;

function loadGoogleMapsApi(): Promise<void> {
  if (loadPromise) return loadPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey) {
    loadPromise = Promise.reject(
      new Error('Google Maps API key not configured')
    );
    return loadPromise;
  }

  // If already loaded (e.g., by another mechanism), resolve immediately.
  if (window.google?.maps?.Map) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Failed to load Google Maps API'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

// --- MapMarkPanel component ---

interface MarkerData {
  lat: number;
  lng: number;
  label?: string;
}

function MapMarkPanel(props: {
  markers: MarkerData[];
  title: string;
  zoom: number;
  editable: boolean;
  onResolve: (result: MapMarkResult) => void;
}) {
  const { markers: initialMarkers, title, zoom, editable, onResolve } = props;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const gmMarkersRef = useRef<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMarkers, setCurrentMarkers] = useState<MarkerData[]>(
    () => initialMarkers
  );

  // Sync a google.maps.Marker onto the map for a given MarkerData entry.
  const createGmMarker = useCallback(
    (m: MarkerData, map: google.maps.Map): google.maps.Marker => {
      const position = { lat: m.lat, lng: m.lng };
      const marker = new google.maps.Marker({
        position,
        map,
        title: m.label || undefined,
        label: m.label
          ? { text: m.label.slice(0, 2), color: '#fff' }
          : undefined,
        draggable: editable,
      });

      if (editable) {
        // Drag end: update position in state
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (!pos) return;
          setCurrentMarkers((prev) => {
            const idx = gmMarkersRef.current.indexOf(marker);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...next[idx], lat: pos.lat(), lng: pos.lng() };
            return next;
          });
        });

        // Right-click: remove marker
        marker.addListener('rightclick', () => {
          const idx = gmMarkersRef.current.indexOf(marker);
          if (idx === -1) return;
          marker.setMap(null);
          gmMarkersRef.current.splice(idx, 1);
          setCurrentMarkers((prev) => prev.filter((_, i) => i !== idx));
        });
      }

      return marker;
    },
    [editable]
  );

  useEffect(() => {
    let cancelled = false;

    loadGoogleMapsApi()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;
        setLoading(false);

        const mapOptions: google.maps.MapOptions = {
          mapTypeId: 'roadmap',
        };

        // Determine center/zoom based on marker count
        if (initialMarkers.length === 0) {
          mapOptions.center = { lat: 0, lng: 0 };
          mapOptions.zoom = 2;
        } else if (initialMarkers.length === 1) {
          mapOptions.center = {
            lat: initialMarkers[0].lat,
            lng: initialMarkers[0].lng,
          };
          mapOptions.zoom = zoom;
        }

        const map = new google.maps.Map(
          mapContainerRef.current!,
          mapOptions
        );
        mapRef.current = map;

        // Create markers
        const bounds = new google.maps.LatLngBounds();
        const gmMarkers: google.maps.Marker[] = [];
        for (const m of initialMarkers) {
          bounds.extend({ lat: m.lat, lng: m.lng });
          gmMarkers.push(createGmMarker(m, map));
        }
        gmMarkersRef.current = gmMarkers;

        // Auto-fit bounds for multi-marker
        if (initialMarkers.length > 1) {
          map.fitBounds(bounds);
        }

        // Editable: click on map to add new marker
        if (editable) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            const newMarker: MarkerData = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            };
            const gm = createGmMarker(newMarker, map);
            gmMarkersRef.current.push(gm);
            setCurrentMarkers((prev) => [...prev, newMarker]);
          });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoading(false);
          setError(err.message || 'Failed to load Google Maps');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialMarkers, zoom, editable, createGmMarker]);

  const onOk = useCallback(() => {
    onResolve({ cancelled: false, markers: currentMarkers });
  }, [onResolve, currentMarkers]);

  const onCancel = useCallback(() => {
    onResolve({ cancelled: true, markers: [] });
  }, [onResolve]);

  const onClose = useCallback(() => {
    onResolve({ cancelled: false, markers: initialMarkers });
  }, [onResolve, initialMarkers]);

  return (
    <div className="chat-tool-panel">
      <h2 className="chat-tool-title">{title}</h2>

      {editable && !loading && !error && (
        <p className="ic-map-hint">
          Click map to add marker. Drag to move. Right-click to remove.
        </p>
      )}

      <div className="ic-map-container">
        {loading && !error && (
          <div className="ic-map-loading">Loading map...</div>
        )}
        {error && (
          <div className="ic-map-error" role="alert">
            {error}
          </div>
        )}
        <div
          ref={mapContainerRef}
          className="ic-map-canvas"
          style={{ display: loading || error ? 'none' : 'block' }}
        />
      </div>

      <div className="chat-tool-actions">
        <span className="ic-pagination-info">
          {currentMarkers.length} marker{currentMarkers.length !== 1 ? 's' : ''}
        </span>
        <div className="chat-tool-actions-btns">
          {editable ? (
            <>
              <button
                type="button"
                className="ic-btn ic-btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ic-btn ic-btn-primary"
                onClick={onOk}
              >
                OK
              </button>
            </>
          ) : (
            <button
              type="button"
              className="ic-btn ic-btn-primary"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Tool declaration ---

defineClientTool({
  name: 'map-mark',
  description:
    'Display a Google Maps view in the chat Tool Area with one or more point markers at specified coordinates. In view mode (default), the user sees the map and clicks Close. In editable mode, the user can add, move, and remove markers, then confirm with OK or dismiss with Cancel.',
  parameters: z.object({
    markers: z
      .array(
        z.object({
          lat: z.number().describe('Latitude'),
          lng: z.number().describe('Longitude'),
          label: z
            .string()
            .optional()
            .describe('Optional label for the marker (tooltip and short map label)'),
        })
      )
      .describe('Array of point markers to display on the map'),
    title: z
      .string()
      .optional()
      .describe('Heading shown above the map (default "Map View")'),
    zoom: z
      .number()
      .optional()
      .describe('Zoom level for single-marker view (default 14)'),
    editable: z
      .boolean()
      .optional()
      .describe('Allow user to add, move, and remove markers (default false)'),
  }),
  handler: (params) =>
    renderInToolArea<MapMarkResult>((resolve) => (
      <MapMarkPanel
        markers={params.markers}
        title={params.title || 'Map View'}
        zoom={params.zoom ?? 14}
        editable={params.editable ?? false}
        onResolve={resolve}
      />
    )),
});
