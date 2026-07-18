import { areaHectares, hasSelfIntersection, perimeterMeters } from '../geo';

const square = [
  { latitude: -21.23, longitude: -44.98 },
  { latitude: -21.23, longitude: -44.97 },
  { latitude: -21.22, longitude: -44.97 },
  { latitude: -21.22, longitude: -44.98 },
];

test('calculates positive geodesic area and perimeter', () => {
  expect(areaHectares(square)).toBeGreaterThan(100);
  expect(perimeterMeters(square)).toBeGreaterThan(4_000);
});

test('detects a self-intersecting boundary', () => {
  expect(hasSelfIntersection([square[0]!, square[2]!, square[1]!, square[3]!])).toBe(true);
  expect(hasSelfIntersection(square)).toBe(false);
});
