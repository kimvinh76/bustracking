import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// BusRouteParent: Component passive cho parent - chỉ hiển thị dựa trên WebSocket từ driver
export default function BusRouteParent({
  waypoints = [],
  isVisible = false, // Parent chỉ hiển thị khi driver đã bắt đầu
  currentPosition = null, // Vị trí từ WebSocket
  driverStatus = "idle", // Trạng thái từ driver
  currentStopIndex = 0,
}) {
  const map = useMap();
  const markerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const initializedRef = useRef(false);

  const normalizePosition = (pos) => {
    if (!pos) return null;
    // [lat, lng]
    if (Array.isArray(pos) && pos.length >= 2) {
      const lat = Number(pos[0]);
      const lng = Number(pos[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    }
    // { lat, lng } or { latitude, longitude }
    const lat = Number(pos.lat ?? pos.latitude);
    const lng = Number(pos.lng ?? pos.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  };

  useEffect(() => {
    // Chỉ hiển thị khi driver đã bắt đầu
    if (!map || waypoints.length < 2 || !isVisible) {
      // Cleanup nếu không visible
      cleanup();
      return;
    }
    
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    console.log('[BusRouteParent] Initializing PARENT view');

    const latLngWaypoints = waypoints.map(([lat, lng]) => L.latLng(lat, lng));

    // Draw route polyline (static)
    routePolylineRef.current = L.polyline(latLngWaypoints, {
      color: "#f59e0b", // Orange cho parent
      weight: 3,
      dashArray: "2,4",
      opacity: 0.8,
    }).addTo(map);

    // Create bus marker (will be updated by WebSocket)
    const normalized = normalizePosition(currentPosition);
    const initialPos = normalized
      ? [normalized.lat, normalized.lng]
      : latLngWaypoints[0];
    
    markerRef.current = L.marker(initialPos, {
      icon: L.divIcon({
        html: "<div style='font-size:20px'>🚐</div>", // Different icon for parent
        iconSize: [18, 18],
        className: "bus-parent-icon",
      }),
    }).addTo(map);

    map.fitBounds(routePolylineRef.current.getBounds(), {
      padding: [40, 40],
    });

    console.log('[BusRouteParent] Parent view initialized');
  }, [map, waypoints, isVisible]);

  // Update marker position when receiving WebSocket updates
  useEffect(() => {
    if (markerRef.current && isVisible) {
      const normalized = normalizePosition(currentPosition);
      if (!normalized) return;
      markerRef.current.setLatLng([normalized.lat, normalized.lng]);
      console.log('[BusRouteParent] Updated position:', normalized);
    }
  }, [currentPosition, isVisible]);

  // Show/hide based on driver status
  useEffect(() => {
    if (!isVisible) {
      cleanup();
      initializedRef.current = false;
    }
  }, [isVisible]);

  const cleanup = () => {
    try {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
    } catch (e) {
      console.warn('[BusRouteParent] Cleanup warning:', e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return null;
}