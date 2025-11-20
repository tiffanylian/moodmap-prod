import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { MoodPin } from "../types";

// Read token from Vite env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface Props {
  pins: MoodPin[];
}

export default function MapView({ pins }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-75.1932, 39.9522], // Penn-ish: [lng, lat]
      zoom: 14,
    });

    // Optional: add zoom controls
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
  }, []);

  // Update markers whenever pins change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "999px";
      el.style.backgroundColor = moodColor(pin.mood);
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 0 1px rgba(15,23,42,0.2)";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 8 }).setHTML(
            `<strong>${pin.mood}</strong>${
              pin.message ? " – " + pin.message : ""
            }`
          )
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [pins]);

  return <div ref={containerRef} className="mapbox-container" />;
}

// Simple mood → color mapping
function moodColor(mood: MoodPin["mood"]): string {
  switch (mood) {
    case "HYPED":
      return "#22c55e";
    case "VIBING":
      return "#0ea5e9";
    case "MID":
      return "#a3a3a3";
    case "STRESSED":
      return "#f97316";
    case "TIRED":
      return "#6366f1";
    default:
      return "#0ea5e9";
  }
}
