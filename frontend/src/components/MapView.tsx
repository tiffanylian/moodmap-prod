import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";
import Supercluster from "supercluster";
import type { MoodPin } from "../types";

// Read token from Vite env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface Props {
  pins: MoodPin[];
}

interface MapViewHandle {
  centerOnPin: (lat: number, lng: number, zoom?: number) => void;
}

// Mood color mapping
function moodColor(mood: MoodPin["mood"]): string {
  switch (mood) {
    case "HYPED":
      return "#22c55e";
    case "VIBING":
      return "#0ea5e9";
    case "MID":
      return "#fbbf24";
    case "STRESSED":
      return "#f97316";
    case "TIRED":
      return "#6366f1";
    default:
      return "#0ea5e9";
  }
}

// Calculate gradient color based on mood distribution in cluster
function getClusterColor(moods: MoodPin["mood"][]): string {
  if (moods.length === 0) return "#fbbf24";

  // Count each mood
  const counts = {
    HYPED: moods.filter((m) => m === "HYPED").length,
    VIBING: moods.filter((m) => m === "VIBING").length,
    MID: moods.filter((m) => m === "MID").length,
    STRESSED: moods.filter((m) => m === "STRESSED").length,
    TIRED: moods.filter((m) => m === "TIRED").length,
  };

  const total = moods.length;

  // Calculate weighted RGB values
  const r = Math.round(
    (0x22 * counts.HYPED +
      0x0e * counts.VIBING +
      0xfb * counts.MID +
      0xf9 * counts.STRESSED +
      0x63 * counts.TIRED) /
      total
  );
  const g = Math.round(
    (0xc5 * counts.HYPED +
      0xa5 * counts.VIBING +
      0xbf * counts.MID +
      0x73 * counts.STRESSED +
      0x66 * counts.TIRED) /
      total
  );
  const b = Math.round(
    (0x5e * counts.HYPED +
      0xe9 * counts.VIBING +
      0x24 * counts.MID +
      0x16 * counts.STRESSED +
      0xf1 * counts.TIRED) /
      total
  );

  return `rgb(${r}, ${g}, ${b})`;
}

export default forwardRef<MapViewHandle, Props>(function MapView({ pins }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const clusterRef = useRef<Supercluster<any, any> | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [zoom, setZoom] = useState(14);

  // Expose centerOnPin method via ref
  useImperativeHandle(ref, () => ({
    centerOnPin: (lat: number, lng: number, zoom_level: number = 16) => {
      if (mapRef.current) {
        mapRef.current.easeTo({
          center: [lng, lat],
          zoom: zoom_level,
          duration: 500,
        });
      }
    },
  }));

  // Initialize clustering
  useEffect(() => {
    clusterRef.current = new Supercluster({
      radius: 80,
      maxZoom: 17,
    });

    // Index pins with proper GeoJSON format
    const features = pins.map((pin) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [pin.lng, pin.lat],
      },
      properties: {
        id: pin.id,
        mood: pin.mood,
        message: pin.message,
        createdAt: pin.createdAt,
      },
    }));

    clusterRef.current.load(features as any);
  }, [pins]);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-75.1932, 39.9522],
      zoom: 14,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Update zoom state on zoom change
    mapRef.current.on("zoom", () => {
      setZoom(mapRef.current?.getZoom() ?? 14);
    });
  }, []);

  // Update markers based on zoom level and clusters
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Get current bounds
    const bounds = map.getBounds();
    if (!bounds) return;

    const clusters = cluster.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      Math.floor(zoom)
    );

    clusters.forEach((item) => {
      const { geometry, properties } = item;
      const [lng, lat] = geometry.coordinates as [number, number];

      const el = document.createElement("div");

      if (properties.cluster) {
        // Cluster marker - show gradient color and count
        const moods = (properties.moods || []) as MoodPin["mood"][];
        const size = 40 + Math.log(properties.point_count) * 8;
        const color = getClusterColor(moods);

        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = "50%";
        el.style.backgroundColor = color;
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.fontSize = "14px";
        el.style.fontWeight = "bold";
        el.style.color = "white";
        el.style.textShadow = "0 1px 3px rgba(0,0,0,0.4)";
        el.style.cursor = "pointer";
        el.textContent = properties.point_count_abbreviated;

        // Click to zoom into cluster
        el.addEventListener("click", () => {
          const expansionZoom = cluster.getClusterExpansionZoom(item.id as number);
          map.easeTo({
            center: [lng, lat],
            zoom: expansionZoom,
            duration: 500,
          });
        });
      } else {
        // Individual pin marker
        const mood = properties.mood as MoodPin["mood"];
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = moodColor(mood);
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 0 0 1px rgba(15,23,42,0.2)";
        el.style.cursor = "pointer";
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 8 }).setHTML(
            `<strong>${properties.mood}</strong>${
              properties.message ? " – " + properties.message : ""
            }`
          )
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [zoom]);

  return <div ref={containerRef} className="mapbox-container" />;
});
