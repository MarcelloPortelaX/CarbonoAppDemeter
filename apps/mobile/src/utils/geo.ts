import { Coordinate } from '../domain/models';

const EARTH_RADIUS_METERS = 6_371_008.8;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMeters(a: Coordinate, b: Coordinate) {
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const latitudeA = radians(a.latitude);
  const latitudeB = radians(b.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function perimeterMeters(points: Coordinate[]) {
  if (points.length < 2) return 0;
  return points.reduce(
    (sum, point, index) => sum + haversineMeters(point, points[(index + 1) % points.length]!),
    0,
  );
}

// Aproximação esférica adequada à prévia de UI. Fluxos certificados devem registrar
// mecanismo geodésico, versão, CRS e incerteza.
export function sphericalAreaSquareMeters(points: Coordinate[]) {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    sum +=
      radians(next.longitude - current.longitude) *
      (2 + Math.sin(radians(current.latitude)) + Math.sin(radians(next.latitude)));
  }
  return (Math.abs(sum) * EARTH_RADIUS_METERS ** 2) / 2;
}

export function areaHectares(points: Coordinate[]) {
  return sphericalAreaSquareMeters(points) / 10_000;
}

const orientation = (a: Coordinate, b: Coordinate, c: Coordinate) => {
  const value =
    (b.longitude - a.longitude) * (c.latitude - b.latitude) -
    (b.latitude - a.latitude) * (c.longitude - b.longitude);
  if (Math.abs(value) < Number.EPSILON) return 0;
  return value > 0 ? 1 : 2;
};

const segmentsIntersect = (
  a: Coordinate,
  b: Coordinate,
  c: Coordinate,
  d: Coordinate,
) => orientation(a, b, c) !== orientation(a, b, d) && orientation(c, d, a) !== orientation(c, d, b);

export function hasSelfIntersection(points: Coordinate[]) {
  if (points.length < 4) return false;
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length;
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length;
      const sharesVertex =
        first === second || first === secondNext || firstNext === second || firstNext === secondNext;
      if (sharesVertex) continue;
      if (
        segmentsIntersect(
          points[first]!,
          points[firstNext]!,
          points[second]!,
          points[secondNext]!,
        )
      ) return true;
    }
  }
  return false;
}
