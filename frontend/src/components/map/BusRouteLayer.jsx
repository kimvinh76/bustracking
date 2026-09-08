import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/** Polyline OSRM + marker xe — passive, cập nhật qua WebSocket (dùng chung admin/driver/parent). */
export default function BusRouteLayer({
  waypoints = [],
  isVisible = false,
  currentPosition = null,
  routeColor = "#2563eb",
  busEmoji = "🚍",
}) {
  const map = useMap();
  const markerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const initializedRef = useRef(false);
  const routingTimeoutRef = useRef(null);
  const abortRef = useRef(null);
  const lastWaypointsKeyRef = useRef(null);

  const cleanup = useCallback(() => {
    if (routingTimeoutRef.current) {
      clearTimeout(routingTimeoutRef.current);
      routingTimeoutRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    initializedRef.current = false;
  }, []);

  useEffect(() => {
    if (!map || waypoints.length < 2 || !isVisible) {
      cleanup();
      return;
    } 

    const waypointsKey = waypoints
      .map(([lat, lng]) => `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`)
      .join("|");

    if (initializedRef.current && lastWaypointsKeyRef.current === waypointsKey) {
      return;
    }

    cleanup();
    initializedRef.current = true;
    lastWaypointsKeyRef.current = waypointsKey;

    const latLngWaypoints = waypoints.map(([lat, lng]) => L.latLng(lat, lng));

    const drawFallback = () => {
      routePolylineRef.current?.remove();
      routePolylineRef.current = L.polyline(latLngWaypoints, {
        color: routeColor,
        weight: 3,
        dashArray: "3,6",
        opacity: 0.7,
      }).addTo(map);
      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [40, 40] });
    };

    const fetchOSRMRoute = async () => {
      try {
        const controller = new AbortController();
        abortRef.current = controller;
        const coords = latLngWaypoints.map((wp) => `${wp.lng},${wp.lat}`).join(";");
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const line = data?.routes?.[0]?.geometry?.coordinates;
        if (!line?.length) throw new Error("No route");

        const coordsLatLng = line.map((c) => L.latLng(c[1], c[0]));
        routePolylineRef.current?.remove();
        routePolylineRef.current = L.polyline(coordsLatLng, {
          color: routeColor,
          weight: 4,
          opacity: 0.8,
        }).addTo(map);
        map.fitBounds(routePolylineRef.current.getBounds(), { padding: [40, 40] });
      } catch (error) {
        if (error?.name !== "AbortError") drawFallback();
      }
    };

    routingTimeoutRef.current = setTimeout(drawFallback, 8000);
    fetchOSRMRoute().finally(() => {
      if (routingTimeoutRef.current) {
        clearTimeout(routingTimeoutRef.current);
        routingTimeoutRef.current = null;
      }
    });

    if (!markerRef.current) {
      markerRef.current = L.marker(latLngWaypoints[0], {
        icon: L.divIcon({
          html: `<div style='font-size:24px'>${busEmoji}</div>`,
          iconSize: [20, 20],
          className: "bus-route-layer-icon",
        }),
      }).addTo(map);
    }
  }, [map, waypoints, isVisible, routeColor, busEmoji, cleanup]);

  // Tạo marker nếu route effect chưa chạy nhưng đã có vị trí WS
  useEffect(() => {
    if (!map || !isVisible || markerRef.current || !currentPosition) return;
    markerRef.current = L.marker([currentPosition.lat, currentPosition.lng], {
      icon: L.divIcon({
        html: `<div style='font-size:24px'>${busEmoji}</div>`,
        iconSize: [20, 20],
        className: "bus-route-layer-icon",
      }),
    }).addTo(map);
  }, [map, isVisible, currentPosition, busEmoji]);

  useEffect(() => {
    if (markerRef.current && currentPosition && isVisible) {
      markerRef.current.setLatLng([currentPosition.lat, currentPosition.lng]);
    }
  }, [currentPosition, isVisible]);

  useEffect(() => {
    if (!isVisible) {
      cleanup();
    }
  }, [isVisible, cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return null;
}
