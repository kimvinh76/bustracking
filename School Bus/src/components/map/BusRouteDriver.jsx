import { useEffect, useRef } from "react";
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
  loop = false,
  isRunning = false,
}) {
  const map = useMap();
  const markerRef = useRef(null);
  const animRef = useRef(null);
  const routingControlRef = useRef(null);
  const baselinePolylineRef = useRef(null);
  const routePolylineRef = useRef(null);
  const stateRef = useRef({
    segmentIndex: 0,
    startTime: 0,
    paused: false,
    segments: [],
    coords: [],
    pauseIndices: [],
    elapsedTime: 0,
  });
  const initializedRef = useRef(false);

  // Reference to step function
  const stepRef = useRef(null);

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
    } else if (isRunning && initializedRef.current && stateRef.current.paused && stepRef.current) {
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
    // CHỈ khởi tạo khi isRunning = true và chưa được khởi tạo
    if (!map || waypoints.length < 2 || initializedRef.current || !isRunning) return;
    
    initializedRef.current = true;
    console.log('[BusRouteDriver] Initializing');

    const latLngWaypoints = waypoints.map(([lat, lng]) => L.latLng(lat, lng));

    // Create bus marker
    markerRef.current = L.marker(latLngWaypoints[0], {
      icon: L.divIcon({
        html: "<div style='font-size:30px'>🚌</div>",
        iconSize: [24, 24],
        className: "bus-driver-icon",
      }),
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
      
      for (let i = 0; i < coords.length - 1; i++) {
        const from = coords[i];
        const to = coords[i + 1];
        const distance = from.distanceTo(to);
        segments.push({ from, to, distance, duration: (distance / speedMetersPerSec) * 1000 });

        // Check if this segment ends at a waypoint (for pausing)
        for (let wpIdx = 1; wpIdx < waypoints.length - 1; wpIdx++) {
          const wp = L.latLng(waypoints[wpIdx][0], waypoints[wpIdx][1]);
          if (to.distanceTo(wp) < 50) { // 50m tolerance
            pauseIndices.push({ segmentIndex: i, waypointIndex: wpIdx });
            break;
          }
        }
      }

      stateRef.current.segments = segments;
      stateRef.current.coords = coords;
      stateRef.current.pauseIndices = pauseIndices;
      stateRef.current.startTime = Date.now();


      // Start animation if running
      if (isRunning && !stateRef.current.paused) {
        startAnimation();
      }
    }

    function startAnimation() {
      if (stateRef.current.segments.length === 0) return;
      
      console.log("[BusRouteDriver] Starting animation");
      
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
        const progress = Math.min(segmentElapsed / segment.duration, 1);
        
        // Interpolate position
        const lat = segment.from.lat + (segment.to.lat - segment.from.lat) * progress;
        const lng = segment.from.lng + (segment.to.lng - segment.from.lng) * progress;
        const currentPos = { lat, lng };
        
        // Update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        
        // Notify position update
        onPositionUpdate(currentPos);
        
        // Check for waypoint reached
        const pausePoint = stateRef.current.pauseIndices.find(p => p.segmentIndex === currentSegmentIndex);
        if (pausePoint && progress >= 0.95) {
          // Reached a waypoint - pause and notify
          stateRef.current.paused = true;
          stateRef.current.elapsedTime = elapsed;
          stateRef.current.segmentIndex = currentSegmentIndex;
          
          console.log("[BusRouteDriver] Reached waypoint", pausePoint.waypointIndex);
          
          const resumeFn = () => {
            stateRef.current.paused = false;
            stateRef.current.startTime = Date.now();
            animRef.current = requestAnimationFrame(step);
          };
          
          onReachStop(pausePoint.waypointIndex, resumeFn);
          return;
        }
        
        stateRef.current.segmentIndex = currentSegmentIndex;
        animRef.current = requestAnimationFrame(step);
      };
      
      stepRef.current = step;
      animRef.current = requestAnimationFrame(step);
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
      } catch (cleanupErr) {
        console.warn("[BusRouteDriver] cleanup error (ignored):", cleanupErr);
      }
    };
  }, [map, waypoints, isRunning]); // Include isRunning in deps for initialization

  return null;
}