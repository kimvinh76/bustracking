import {
  calculateDistanceKm,
  calculateHaversineMetrics,
  normalizeRouteStopsPayload,
} from '../services/routeService.js';

describe('routeMetrics & stop ordering helpers', () => {
  test('normalizes route stops order as 0 (start), 1..n-2 (middle), 99 (end)', () => {
    const ordered = normalizeRouteStopsPayload([
      { stop_id: 50 },
      { stop_id: 51 },
      { stop_id: 49 },
      { stop_id: 43 },
    ]);

    expect(ordered).toEqual([
      { stop_id: 50, stop_order: 0 },
      { stop_id: 51, stop_order: 1 },
      { stop_id: 49, stop_order: 2 },
      { stop_id: 43, stop_order: 99 },
    ]);
  });

  test('assigns stop_order 0 for single-stop route and rejects duplicate stops', () => {
    expect(normalizeRouteStopsPayload([{ id: 43 }])).toEqual([
      { stop_id: 43, stop_order: 0 },
    ]);

    expect(() =>
      normalizeRouteStopsPayload([{ stop_id: 43 }, { stop_id: 43 }])
    ).toThrow(/trùng/);
  });

  test('computes reasonable Haversine distance and duration across stops', () => {
    const metrics = calculateHaversineMetrics([
      { lat: 10.75875, lng: 106.68095 },
      { lat: 10.76055, lng: 106.6834 },
      { lat: 10.7545, lng: 106.6815 },
    ]);

    expect(metrics.source).toBe('haversine');
    expect(metrics.distanceKm).toBeGreaterThan(0.5);
    expect(metrics.distanceKm).toBeLessThan(3);
    expect(metrics.durationMinutes).toBeGreaterThanOrEqual(1);
    expect(metrics.legs).toHaveLength(2);
    expect(metrics.geometry).toHaveLength(3);
  });

  test('calculateDistanceKm handles invalid coordinates safely', () => {
    expect(calculateDistanceKm(NaN, 106.68, 10.76, 106.68)).toBe(0);
    expect(calculateDistanceKm(10.76, 106.68, 10.76, 106.68)).toBe(0);
  });
});
