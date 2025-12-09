import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import mapboxgl from "mapbox-gl";
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

export default forwardRef<MapViewHandle, Props>(function MapView(
  { pins },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
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

  // Initialize markers from pins
  useEffect(() => {
    // No clustering needed, just use pins directly
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

  // Update markers - display all pins without clustering
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add all pins as individual markers
    pins.forEach((pin) => {
      const el = document.createElement("div");
      const mood = pin.mood;
      const color = moodColor(mood);

      // Calculate size based on zoom level
      const pinSize = Math.max(16, Math.min(40, 8 + zoom * 1.5));

      // Create gradient element with CSS - looks like a light source
      el.style.width = `${pinSize}px`;
      el.style.height = `${pinSize}px`;
      el.style.borderRadius = "50%";
      el.style.background = `radial-gradient(circle at center, ${color}, ${color}cc 20%, ${color}99 40%, ${color}55 65%, transparent)`;
      el.style.cursor = "pointer";

      // Create popup with mobile-friendly options
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        closeOnMove: false, // Prevent closing when map moves
        maxWidth: "300px",
      }).setHTML(
        `<strong>${pin.mood}</strong>${pin.message ? " – " + pin.message : ""}`
      );

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(map);

      // Add click handler to open popup (instead of automatic popup on click)
      // This gives us more control over the behavior
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        marker.togglePopup();
      });

      markersRef.current.push(marker);
    });
  }, [zoom, pins]);

  return <div ref={containerRef} className="mapbox-container" />;
});
