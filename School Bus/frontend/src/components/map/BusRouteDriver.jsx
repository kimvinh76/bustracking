import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// BusRouteDriver: Component chủ động cho driver - điều khiển animation và gửi WebSocket
export default function BusRouteDriver({
  waypoints = [],
  speedMetersPerSec = 18,
  onReachStop = () => {},
  onPositionUpdate = () => {},
  onTripComplete = () => {},
  loop = false,
  isRunning = false,
}) {
  const map = useMap();
  const markerRef = useRef(null);
  const animRef = useRef(null);
  const routingControlRef = useRef(null);
  const frameCountRef = useRef(0); // Debug: count frames to throttle panTo
  const baselinePolylineRef = useRef(null);
  const routePolylineRef = useRef(null);
  const stateRef = useRef({
    segmentIndex: 0,
    startTime: 0,
    paused: false,
    segments: [],
    coords: [],
    pauseIndices: [],
    pendingWaypointIndices: [],
    elapsedTime: 0,
    completed: false,
    ready: false,
  });
  const isRunningRef = useRef(isRunning);

  const waypointsKey = useMemo(() => {
    try {
      return waypoints
        .map((p) => {
          const lat = Number(p?.[0]);
          const lng = Number(p?.[1]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "invalid";
          return `${lat.toFixed(6)},${lng.toFixed(6)}`;
        })
        .join("|");
    } catch {
      return "";
    }
  }, [waypoints]);

  // Reference to step function
  const stepRef = useRef(null);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Xử lý isRunning control - CHỈ pause/resume, KHÔNG tạo lại
  useEffect(() => {
    if (!isRunning && !stateRef.current.paused) {
      // Pause animation
      stateRef.current.paused = true;
      stateRef.current.pausedAt = Date.now();
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    } else if (isRunning && stateRef.current.ready && stateRef.current.paused && stepRef.current) {
      // Resume animation
      stateRef.current.paused = false;
      const pauseDuration = stateRef.current.pausedAt ? (Date.now() - stateRef.current.pausedAt) : 0;
      stateRef.current.startTime += pauseDuration;
      
      if (!animRef.current && stateRef.current.segments && stateRef.current.segments.length > 0) {
        animRef.current = requestAnimationFrame(stepRef.current);
      }
    }
  }, [isRunning]);

  useEffect(() => {
    // Khởi tạo khi có map và waypoints, không phụ thuộc isRunning
    // isRunning chỉ điều khiển pause/resume animation
    if (!map || waypoints.length < 2) return;

    stateRef.current.ready = false;
    stateRef.current.completed = false;
    stateRef.current.segmentIndex = 0;
    stateRef.current.elapsedTime = 0;
    stateRef.current.pauseIndices = [];
    console.log('[BusRouteDriver] Initializing with', waypoints.length, 'waypoints');

    const latLngWaypoints = waypoints.map(([lat, lng]) => L.latLng(lat, lng));

    // Create bus marker với icon xe bus dạng SVG (ổn định hơn emoji)
    const busIcon = L.divIcon({
      html: `
        <div style="
          background-color: white; 
          border: 2px solid #16a34a; 
          border-radius: 50%; 
          width: 40px; 
          height: 40px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <rect x="6" y="3" width="12" height="10" rx="2" fill="#16a34a"/>
            <rect x="7.5" y="5" width="3" height="3" rx="0.5" fill="#ffffff"/>
            <rect x="11" y="5" width="3" height="3" rx="0.5" fill="#ffffff"/>
            <rect x="14.5" y="5" width="3" height="3" rx="0.5" fill="#ffffff"/>
            <path d="M6 11.5C6 10.6716 6.67157 10 7.5 10H16.5C17.3284 10 18 10.6716 18 11.5V16.5C18 17.3284 17.3284 18 16.5 18H7.5C6.67157 18 6 17.3284 6 16.5V11.5Z" fill="#15803d"/>
            <circle cx="8.5" cy="18.5" r="1.5" fill="#111827"/>
            <circle cx="15.5" cy="18.5" r="1.5" fill="#111827"/>
            <rect x="7" y="12" width="10" height="2" rx="1" fill="#ffffff" opacity="0.9"/>
          </svg>
        </div>
      `,
      className: '', 
      iconSize: [40, 40],
      iconAnchor: [20, 20], // Căn giữa icon vào tọa độ
    });

    markerRef.current = L.marker(latLngWaypoints[0], {
      icon: busIcon,
      zIndexOffset: 1000,
    }).addTo(map);
    

    // Draw baseline polyline
    baselinePolylineRef.current = L.polyline(latLngWaypoints, {
      color: "#22c55e", // Green cho driver
      weight: 4,
      dashArray: "5,5",
    }).addTo(map);
    
    map.fitBounds(baselinePolylineRef.current.getBounds(), {
      padding: [40, 40],
    });

    // OSRM routing timeout
    const routingTimeout = setTimeout(() => {
      console.warn("[BusRouteDriver] OSRM timeout, using fallback");
      drawFallback();
    }, 8000);

    // Direct OSRM API call
    const fetchDirectOSRM = async () => {
      try {
        const coords = latLngWaypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
        
        // OSRM direct call
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(c => L.latLng(c[1], c[0]));
          
          clearTimeout(routingTimeout);
          handleRoutesFound({ routes: [{ coordinates: coords }] });
        } else {
          throw new Error('No routes found');
        }
      } catch (error) {
        console.warn('[BusRouteDriver] OSRM failed, using fallback');
        clearTimeout(routingTimeout);
        drawFallback();
      }
    };

    // Start OSRM fetch
    fetchDirectOSRM();

    function drawFallback() {
      // Fallback to straight polyline between waypoints
      const coords = latLngWaypoints;
      handleRoutesFound({ routes: [{ coordinates: coords }] });
    }

    function handleRoutesFound(e) {
      const coords = e.routes[0].coordinates;
      console.log("[BusRouteDriver] Route resolved");

      // Update route polyline
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }
      routePolylineRef.current = L.polyline(coords, {
        color: "#16a34a", // Darker green
        weight: 5,
      }).addTo(map);

      // Calculate segments and pause indices
      const segments = [];
      const pauseIndices = [];
      const pendingWaypointIndices = [];

      // Pause only at intermediate stops (exclude start/end)
      for (let wpIdx = 1; wpIdx < waypoints.length - 1; wpIdx++) {
        pendingWaypointIndices.push(wpIdx);
      }
      
      for (let i = 0; i < coords.length - 1; i++) {
        const from = coords[i];
        const to = coords[i + 1];
        const distance = from.distanceTo(to);
        const safeSpeed = Number.isFinite(speedMetersPerSec) && speedMetersPerSec > 0 ? speedMetersPerSec : 18;
        const durationMs = distance > 0 ? (distance / safeSpeed) * 1000 : 1;
        segments.push({ from, to, distance, duration: durationMs });

        // NOTE: pauseIndices (dựa theo endpoint của segment gần waypoint)
        // không luôn chính xác vì polyline OSRM không nhất thiết đi qua đúng tọa độ waypoint.
        // Ta vẫn giữ để debug, nhưng runtime sẽ pause theo khoảng cách vị trí hiện tại.
        for (let wpIdx = 1; wpIdx < waypoints.length - 1; wpIdx++) {
          const wp = L.latLng(waypoints[wpIdx][0], waypoints[wpIdx][1]);
          if (to.distanceTo(wp) < 50) {
            pauseIndices.push({ segmentIndex: i, waypointIndex: wpIdx });
            break;
          }
        }
      }

      stateRef.current.segments = segments;
      stateRef.current.coords = coords;
      stateRef.current.pauseIndices = pauseIndices;
      stateRef.current.pendingWaypointIndices = pendingWaypointIndices;
      stateRef.current.startTime = Date.now();
      stateRef.current.paused = !isRunningRef.current;
      stateRef.current.pausedAt = stateRef.current.paused ? Date.now() : null;
      stateRef.current.ready = true;

      // Debug log để kiểm tra dữ liệu segment và pauseIndices
      console.log('[BusRouteDriver] segments:', segments.length, 'pauseIndices:', pauseIndices.length);
      const zeroDuration = segments.filter(s => s.duration === 0).length;
      if (zeroDuration > 0) {
        console.warn('[BusRouteDriver] Found segments with zero duration:', zeroDuration, '→ kiểm tra dữ liệu lat/lng');
      }


      // Always prepare step function; start only if running
      startAnimation({ autoStart: isRunningRef.current });
    }

    function startAnimation({ autoStart }) {
      if (stateRef.current.segments.length === 0) return;
      
      console.log("[BusRouteDriver] Animation ready", { autoStart });
      
      const step = () => {
        if (stateRef.current.paused) return;
        
        const now = Date.now();
        const elapsed = now - stateRef.current.startTime + stateRef.current.elapsedTime;
        
        let cumulativeTime = 0;
        let currentSegmentIndex = 0;
        
        // Find current segment
        for (let i = 0; i <= stateRef.current.segmentIndex && i < stateRef.current.segments.length; i++) {
          if (elapsed >= cumulativeTime + stateRef.current.segments[i].duration) {
            cumulativeTime += stateRef.current.segments[i].duration;
            currentSegmentIndex = i + 1;
          } else {
            break;
          }
        }
        
        if (currentSegmentIndex >= stateRef.current.segments.length) {
          // Animation complete
          console.log("[BusRouteDriver] Animation completed");
          if (!stateRef.current.completed) {
            stateRef.current.completed = true;
            const lastCoord = stateRef.current.coords[stateRef.current.coords.length - 1];
            const finalPosition = lastCoord ? { lat: lastCoord.lat, lng: lastCoord.lng } : null;
            const finalStopIndex = waypoints.length > 0 ? waypoints.length - 1 : null;
            onTripComplete({ finalStopIndex, finalPosition });
          }
          if (loop) {
            stateRef.current.segmentIndex = 0;
            stateRef.current.startTime = Date.now();
            stateRef.current.elapsedTime = 0;
            animRef.current = requestAnimationFrame(step);
          }
          return;
        }
        
        const segment = stateRef.current.segments[currentSegmentIndex];
        const segmentElapsed = elapsed - cumulativeTime;
        const duration = Number.isFinite(segment.duration) && segment.duration > 0 ? segment.duration : 1;
        const progress = Math.min(segmentElapsed / duration, 1);
        
        // Interpolate position
        const lat = segment.from.lat + (segment.to.lat - segment.from.lat) * progress;
        const lng = segment.from.lng + (segment.to.lng - segment.from.lng) * progress;
        const currentPos = { lat, lng };
        
        // Update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }

        // Debug: pan map định kỳ để dễ thấy marker (mỗi 15 frames)
        frameCountRef.current += 1;
        if (frameCountRef.current % 15 === 0 && map) {
          map.panTo([lat, lng]);
        }
        
        // Notify position update
        onPositionUpdate(currentPos);

        // Check for waypoint reached (robust): pause when CURRENT position is close to the NEXT waypoint.
        // This avoids relying on OSRM polyline vertices coinciding with waypoint coordinates.
        const pending = stateRef.current.pendingWaypointIndices;
        if (Array.isArray(pending) && pending.length > 0) {
          const nextWpIdx = pending[0];
          const nextWp = waypoints?.[nextWpIdx];
          const wpLat = Number(nextWp?.[0]);
          const wpLng = Number(nextWp?.[1]);
          if (Number.isFinite(wpLat) && Number.isFinite(wpLng)) {
            const wp = L.latLng(wpLat, wpLng);
            const pos = L.latLng(lat, lng);
            const distM = pos.distanceTo(wp);

            // 50m tolerance để chắc chắn bắt waypoint (có thể chỉnh nhỏ lại nếu muốn)
            if (distM < 50) {
              stateRef.current.paused = true;
              stateRef.current.pausedAt = Date.now();
              stateRef.current.elapsedTime = elapsed;
              stateRef.current.segmentIndex = currentSegmentIndex + 1;

              // Remove this waypoint from pending list to avoid re-trigger
              stateRef.current.pendingWaypointIndices = pending.slice(1);

              console.log("[BusRouteDriver] Reached waypoint", nextWpIdx, { distM: Math.round(distM) });

              const resumeFn = () => {
                stateRef.current.paused = false;
                stateRef.current.pausedAt = null;
                stateRef.current.startTime = Date.now();
                animRef.current = requestAnimationFrame(step);
              };

              onReachStop(nextWpIdx, resumeFn);
              return;
            }
          }
        }
        
        stateRef.current.segmentIndex = currentSegmentIndex;
        animRef.current = requestAnimationFrame(step);
      };
      
      stepRef.current = step;

      if (autoStart && !stateRef.current.paused && !animRef.current) {
        console.log("[BusRouteDriver] Starting animation");
        animRef.current = requestAnimationFrame(step);
      }
    }

    // Cleanup function
    return () => {
      try {
        if (animRef.current) {
          cancelAnimationFrame(animRef.current);
          animRef.current = null;
        }
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
          routePolylineRef.current = null;
        }
        if (baselinePolylineRef.current) {
          baselinePolylineRef.current.remove();
          baselinePolylineRef.current = null;
        }
        if (routingControlRef.current) {
          try {
            routingControlRef.current.remove();
          } catch (e) {}
          routingControlRef.current = null;
        }

        stateRef.current.ready = false;
        stepRef.current = null;
      } catch (cleanupErr) {
        console.warn("[BusRouteDriver] cleanup error (ignored):", cleanupErr);
      }
    };
  }, [map, waypointsKey, speedMetersPerSec, loop]);

  return null;
}