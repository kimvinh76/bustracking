import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { applyLeafletDefaultIcon, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "../../utils/mapDefaults.js";
import { schedulesService } from "../../services/schedulesService.js";
import trackingService from "../../services/trackingService.js";
import Header from "../../components/admin/Header.jsx";

applyLeafletDefaultIcon();

const DEFAULT_LIMIT = 600;

export default function HistoryPage() {
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [historyPoints, setHistoryPoints] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(700);

  useEffect(() => {
    let alive = true;
    const loadSchedules = async () => {
      try {
        setLoadingSchedules(true);
        const rows = await schedulesService.getAllSchedules();
        if (!alive) return;
        setSchedules(rows);
        if (rows.length && !selectedScheduleId) {
          setSelectedScheduleId(String(rows[0].id));
        }
      } catch (error) {
        console.error("HistoryPage: load schedules failed", error);
      } finally {
        if (alive) setLoadingSchedules(false);
      }
    };

    loadSchedules();
    return () => {
      alive = false;
    };
  }, [selectedScheduleId]);

  useEffect(() => {
    if (!selectedScheduleId) {
      setHistoryPoints([]);
      setPlayIndex(0);
      return;
    }

    let alive = true;
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const rows = await trackingService.getHistoryBySchedule(selectedScheduleId, DEFAULT_LIMIT);
        if (!alive) return;
        const normalized = rows
          .map((r) => ({
            lat: Number(r.latitude),
            lng: Number(r.longitude),
            timestamp: r.timestamp || r.created_at || null
          }))
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
        const ordered = [...normalized].reverse();
        setHistoryPoints(ordered);
        setPlayIndex(0);
        setIsPlaying(false);
      } catch (error) {
        console.error("HistoryPage: load history failed", error);
        if (alive) {
          setHistoryPoints([]);
        }
      } finally {
        if (alive) setLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      alive = false;
    };
  }, [selectedScheduleId]);

  useEffect(() => {
    if (!isPlaying || historyPoints.length === 0) return;
    const timer = setInterval(() => {
      setPlayIndex((prev) => {
        const next = prev + 1;
        if (next >= historyPoints.length) {
          clearInterval(timer);
          return prev;
        }
        return next;
      });
    }, speedMs);
    return () => clearInterval(timer);
  }, [isPlaying, historyPoints.length, speedMs]);

  const polylinePositions = useMemo(
    () => historyPoints.map((p) => [p.lat, p.lng]),
    [historyPoints]
  );

  const activePoint = historyPoints[playIndex] || null;
  const mapCenter = activePoint
    ? [activePoint.lat, activePoint.lng]
    : polylinePositions[0] || MAP_DEFAULT_CENTER;

  const playDisabled = historyPoints.length <= 1;

  return (
    <div className="min-h-screen">
      <Header title="Lịch sử tuyến xe" subtitle="Playback hành trình dựa trên bus_locations" />

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Chọn lịch trình</label>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
              >
                {loadingSchedules && <option>Đang tải...</option>}
                {!loadingSchedules && schedules.length === 0 && <option>Không có lịch trình</option>}
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} - {s.route_name || s.routeName || "Tuyến"} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-600">Số điểm lịch sử: {historyPoints.length}</p>
              <p className="text-sm text-slate-600">Vị trí hiện tại: {playIndex + 1}/{Math.max(historyPoints.length, 1)}</p>
            </div>

            <div className="space-y-3">
              <button
                className={`w-full rounded-lg px-4 py-2 text-sm font-semibold ${playDisabled ? "bg-slate-200 text-slate-500" : "bg-emerald-500 text-white"}`}
                disabled={playDisabled}
                onClick={() => setIsPlaying((prev) => !prev)}
              >
                {isPlaying ? "Tạm dừng" : "Phát lại"}
              </button>

              <button
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                onClick={() => {
                  setPlayIndex(0);
                  setIsPlaying(false);
                }}
              >
                Về đầu
              </button>

              <label className="text-sm font-semibold text-slate-700">Tốc độ phát</label>
              <input
                type="range"
                min={200}
                max={1500}
                step={100}
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500">{speedMs} ms / bước</p>
            </div>

            {loadingHistory && (
              <div className="text-sm text-slate-500">Đang tải lịch sử...</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="h-[70vh]">
              <MapContainer center={mapCenter} zoom={MAP_DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {polylinePositions.length > 1 && (
                  <Polyline positions={polylinePositions} pathOptions={{ color: "#2563eb", weight: 4 }} />
                )}
                {activePoint && (
                  <Marker position={[activePoint.lat, activePoint.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <div>Điểm #{playIndex + 1}</div>
                        {activePoint.timestamp && <div>{String(activePoint.timestamp)}</div>}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
