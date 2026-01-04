import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// BusRouteAdmin: Component passive cho admin - chỉ hiển thị dựa trên WebSocket từ driver
export default function BusRouteAdmin({
  waypoints = [],
  isVisible = false, // Admin chỉ hiển thị khi driver đã bắt đầu
  currentPosition = null, // Vị trí từ WebSocket
  driverStatus = "idle", // Trạng thái từ driver
  currentStopIndex = 0,
}) {
  const map = useMap();
  const markerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Chỉ hiển thị khi driver đã bắt đầu
    if (!map || waypoints.length < 2 || !isVisible) {
      // Cleanup nếu không visible
      cleanup();
      return;
    }
    
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    console.log('[BusRouteAdmin] Initializing ADMIN view');

    const latLngWaypoints = waypoints.map(([lat, lng]) => L.latLng(lat, lng));

    // Draw route polyline (static)
    routePolylineRef.current = L.polyline(latLngWaypoints, {
      color: "#3b82f6", // Blue cho admin
      weight: 3,
      dashArray: "3,6",
      opacity: 0.7,
    }).addTo(map);

    // Create bus marker (will be updated by WebSocket)
    const initialPos = currentPosition ? 
      [currentPosition.lat, currentPosition.lng] : 
      latLngWaypoints[0];
    
    markerRef.current = L.marker(initialPos, {
      icon: L.divIcon({
        html: "<div style='font-size:24px'>🚍</div>", // Different icon for admin
        iconSize: [20, 20],
        className: "bus-admin-icon",
      }),
    }).addTo(map);

    map.fitBounds(routePolylineRef.current.getBounds(), {
      padding: [40, 40],
    });

    console.log('[BusRouteAdmin] Admin view initialized');
  }, [map, waypoints, isVisible]);

  // Update marker position when receiving WebSocket updates
  useEffect(() => {
    if (markerRef.current && currentPosition && isVisible) {
      markerRef.current.setLatLng([currentPosition.lat, currentPosition.lng]);
      console.log('[BusRouteAdmin] Updated position:', currentPosition);
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
      console.warn('[BusRouteAdmin] Cleanup warning:', e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return null;
}