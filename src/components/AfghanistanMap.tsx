"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Coordinate = [number, number];

type GeoFeature = {
  type: "Feature";
  properties?: Record<string, unknown> & {
    shapeName?: string;
    shapeISO?: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: Coordinate[][] | Coordinate[][][];
  };
};

type Bounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

type ProjectedPoint = [number, number];
type Projector = (point: Coordinate) => ProjectedPoint;

type MapShape = {
  id: string;
  name: string;
  path: string;
  centroid: ProjectedPoint | null;
  isFocused: boolean;
  isHighlighted: boolean;
};

type AfghanistanMapProps = {
  focusedProvince?: string | null;
  highlightedProvinces?: string[];
  className?: string;
};

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const MAP_PADDING = 10;
const ANIMATION_DURATION = 280;

const BASE_FILL = "#f8fafc";
const HIGHLIGHT_FILL = "#e0f2fe";
const HIGHLIGHT_STROKE = "#0ea5e9";
const FOCUS_FILL = "#0284c7";
const FOCUS_STROKE = "#0369a1";
const DIM_STROKE = "#e2e8f0";

function collectCoordinates(feature: GeoFeature): Coordinate[] {
  const { geometry } = feature;
  const coords: Coordinate[] = [];

  if (geometry.type === "Polygon") {
    (geometry.coordinates as Coordinate[][]).forEach((ring) => {
      ring.forEach((point) => {
        coords.push([point[0], point[1]]);
      });
    });
  } else {
    (geometry.coordinates as Coordinate[][][]).forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach((point) => {
          coords.push([point[0], point[1]]);
        });
      });
    });
  }

  return coords;
}

function calculateBounds(features: GeoFeature[]): Bounds | null {
  if (!features.length) {
    return null;
  }

  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  features.forEach((feature) => {
    collectCoordinates(feature).forEach(([lon, lat]) => {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });
  });

  return { minLon, maxLon, minLat, maxLat };
}

function expandBounds(bounds: Bounds, ratio = 0.1): Bounds {
  const lonSpan = bounds.maxLon - bounds.minLon || 1;
  const latSpan = bounds.maxLat - bounds.minLat || 1;
  const margin = Math.max(lonSpan, latSpan) * ratio;

  return {
    minLon: bounds.minLon - margin,
    maxLon: bounds.maxLon + margin,
    minLat: bounds.minLat - margin,
    maxLat: bounds.maxLat + margin,
  };
}

function createProjector(bounds: Bounds): Projector {
  const lonSpan = bounds.maxLon - bounds.minLon || 1;
  const latSpan = bounds.maxLat - bounds.minLat || 1;

  const usableWidth = MAP_WIDTH - MAP_PADDING * 2;
  const usableHeight = MAP_HEIGHT - MAP_PADDING * 2;
  const scale = Math.min(usableWidth / lonSpan, usableHeight / latSpan);

  const xOffset = (MAP_WIDTH - lonSpan * scale) / 2;
  const yOffset = (MAP_HEIGHT - latSpan * scale) / 2;

  return ([lon, lat]) => {
    const x = (lon - bounds.minLon) * scale + xOffset;
    const y = MAP_HEIGHT - ((lat - bounds.minLat) * scale + yOffset);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  };
}

function polygonToPath(rings: Coordinate[][], project: Projector): string {
  return rings
    .map((ring) => {
      if (!ring.length) {
        return "";
      }
      const [first, ...rest] = ring;
      const [startX, startY] = project(first);
      const segments = rest
        .map((point) => {
          const [x, y] = project(point);
          return `L${x} ${y}`;
        })
        .join(" ");
      return `M${startX} ${startY} ${segments} Z`;
    })
    .join(" ");
}

function featureToPath(feature: GeoFeature, project: Projector): string {
  const { geometry } = feature;

  if (geometry.type === "Polygon") {
    return polygonToPath(geometry.coordinates as Coordinate[][], project);
  }

  return (geometry.coordinates as Coordinate[][][])
    .map((polygon) => polygonToPath(polygon, project))
    .join(" ");
}

function calculateFeatureCentroid(feature: GeoFeature): Coordinate | null {
  const coordinates = collectCoordinates(feature);
  if (!coordinates.length) {
    return null;
  }

  let areaSum = 0;
  let centroidX = 0;
  let centroidY = 0;

  const accumulateRing = (ring: Coordinate[]) => {
    if (ring.length < 3) return;
    const ringLength = ring.length;

    for (let i = 0; i < ringLength; i += 1) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[(i + 1) % ringLength];
      const cross = x0 * y1 - x1 * y0;
      areaSum += cross;
      centroidX += (x0 + x1) * cross;
      centroidY += (y0 + y1) * cross;
    }
  };

  if (feature.geometry.type === "Polygon") {
    (feature.geometry.coordinates as Coordinate[][]).forEach((ring) =>
      accumulateRing(ring)
    );
  } else {
    (feature.geometry.coordinates as Coordinate[][][]).forEach((polygon) => {
      polygon.forEach((ring) => accumulateRing(ring));
    });
  }

  if (areaSum === 0) {
    const [sumLon, sumLat] = coordinates.reduce(
      (acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat],
      [0, 0]
    );
    return [sumLon / coordinates.length, sumLat / coordinates.length];
  }

  const factor = 1 / (3 * areaSum);
  return [centroidX * factor, centroidY * factor];
}

function boundsEqual(a: Bounds | null, b: Bounds | null) {
  if (!a || !b) return false;
  return (
    Math.abs(a.minLon - b.minLon) < 1e-6 &&
    Math.abs(a.maxLon - b.maxLon) < 1e-6 &&
    Math.abs(a.minLat - b.minLat) < 1e-6 &&
    Math.abs(a.maxLat - b.maxLat) < 1e-6
  );
}

function interpolateBounds(start: Bounds, end: Bounds, t: number): Bounds {
  const ease = t * (2 - t);
  return {
    minLon: start.minLon + (end.minLon - start.minLon) * ease,
    maxLon: start.maxLon + (end.maxLon - start.maxLon) * ease,
    minLat: start.minLat + (end.minLat - start.minLat) * ease,
    maxLat: start.maxLat + (end.maxLat - start.maxLat) * ease,
  };
}

export function AfghanistanMap({
  focusedProvince,
  highlightedProvinces,
  className,
}: AfghanistanMapProps) {
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [error, setError] = useState<string | null>(null);

  const normalizedFocus = focusedProvince?.trim().toLowerCase();
  const normalizedHighlights = useMemo(() => {
    if (!highlightedProvinces?.length) {
      return new Set<string>();
    }

    return new Set(
      highlightedProvinces.map((province) => province.trim().toLowerCase())
    );
  }, [highlightedProvinces]);

  useEffect(() => {
    let isMounted = true;

    fetch("/data/geoBoundaries-AFG-ADM1.geojson")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load map data (status ${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const loadedFeatures = Array.isArray(data.features)
          ? (data.features as GeoFeature[])
          : [];
        setFeatures(loadedFeatures);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const focusFeature = useMemo(() => {
    if (!normalizedFocus) {
      return null;
    }

    return (
      features.find((feature) => {
        const name = (feature.properties?.shapeName as string | undefined) ?? "";
        return name.toLowerCase() === normalizedFocus;
      }) ?? null
    );
  }, [features, normalizedFocus]);

  const highlightFeatures = useMemo(() => {
    if (!normalizedHighlights.size) {
      return [] as GeoFeature[];
    }

    return features.filter((feature) => {
      const name = (feature.properties?.shapeName as string | undefined) ?? "";
      return normalizedHighlights.has(name.toLowerCase());
    });
  }, [features, normalizedHighlights]);

  const fallbackBounds = useMemo(() => calculateBounds(features), [features]);

  const targetBounds = useMemo(() => {
    if (!fallbackBounds) {
      return null;
    }

    if (focusFeature) {
      const bounds = calculateBounds([focusFeature]) ?? fallbackBounds;
      return expandBounds(bounds, 0.05);
    }

    if (highlightFeatures.length) {
      const bounds = calculateBounds(highlightFeatures) ?? fallbackBounds;
      return expandBounds(bounds, 0.08);
    }

    return expandBounds(fallbackBounds, 0.02);
  }, [focusFeature, highlightFeatures, fallbackBounds]);

  const animatedBoundsRef = useRef<Bounds | null>(null);
  const [renderBounds, setRenderBounds] = useState<Bounds | null>(null);

  useEffect(() => {
    if (!targetBounds) {
      return;
    }

    if (!animatedBoundsRef.current) {
      animatedBoundsRef.current = targetBounds;
      setRenderBounds(targetBounds);
      return;
    }

    if (boundsEqual(targetBounds, animatedBoundsRef.current)) {
      return;
    }

    const startBounds = animatedBoundsRef.current;
    const startTime = performance.now();
    let frameId: number;

    const step = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / ANIMATION_DURATION);
      const nextBounds = interpolateBounds(startBounds, targetBounds, progress);
      animatedBoundsRef.current = nextBounds;
      setRenderBounds(nextBounds);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        animatedBoundsRef.current = targetBounds;
        setRenderBounds(targetBounds);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [targetBounds]);

  const mapShapes = useMemo<MapShape[]>(() => {
    if (!features.length || !renderBounds) {
      return [];
    }

    const project = createProjector(renderBounds);

    return features.map((feature, index) => {
      const centroid = calculateFeatureCentroid(feature);
      const name = (feature.properties?.shapeName as string | undefined) ?? "Province";
      const lowerName = name.toLowerCase();
      const isFocused = normalizedFocus ? lowerName === normalizedFocus : false;
      const isHighlighted = normalizedHighlights.size
        ? normalizedHighlights.has(lowerName)
        : true;

      return {
        id:
          (feature.properties?.shapeISO as string | undefined) ??
          `${name}-${index}`,
        name,
        path: featureToPath(feature, project),
        centroid: centroid ? project(centroid) : null,
        isFocused,
        isHighlighted,
      };
    });
  }, [features, renderBounds, normalizedFocus, normalizedHighlights]);

  const composeClass = (base: string) => [base, className].filter(Boolean).join(" ");

  if (error) {
    return (
      <div className={composeClass("flex h-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700")}>
        {error}
      </div>
    );
  }

  if (!mapShapes.length || !renderBounds) {
    return (
      <div className={composeClass("flex h-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600")}>
        Loading Afghanistan map…
      </div>
    );
  }

  const labelFontSize = Math.max(10, Math.min(13, MAP_WIDTH / 70));

  const containerClass = composeClass(
    "relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-50"
  );

  return (
    <div className={containerClass}>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label="Map of Afghanistan with provincial boundaries"
        className="h-full w-full block"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#f8fafc" />
        {mapShapes.map((shape) => {
          const fill = shape.isFocused
            ? FOCUS_FILL
            : shape.isHighlighted
            ? HIGHLIGHT_FILL
            : BASE_FILL;
          const stroke = shape.isFocused
            ? FOCUS_STROKE
            : shape.isHighlighted
            ? HIGHLIGHT_STROKE
            : DIM_STROKE;
          const textOpacity = shape.isHighlighted ? 1 : 0.45;

          return (
            <g
              key={shape.id}
              className="transition-transform duration-300 ease-out"
              style={{
                transformOrigin: "center",
                transformBox: "fill-box",
                transform: shape.isFocused
                  ? "scale(1.05)"
                  : shape.isHighlighted
                  ? "scale(1.015)"
                  : "scale(1)",
              }}
            >
              <path
                d={shape.path}
                fill={fill}
                stroke={stroke}
                vectorEffect="non-scaling-stroke"
                strokeWidth={shape.isFocused ? 1.4 : shape.isHighlighted ? 1 : 0.8}
                className="transition-colors duration-300 ease-out"
              >
                <title>{shape.name}</title>
              </path>
              {shape.centroid ? (
                <text
                  x={shape.centroid[0]}
                  y={shape.centroid[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={shape.isFocused ? "#0f172a" : "#1f2937"}
                  fontSize={labelFontSize}
                  fontWeight={shape.isFocused ? 700 : 600}
                  letterSpacing="0.03em"
                  style={{ paintOrder: "stroke" }}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={2.4}
                  pointerEvents="none"
                  opacity={textOpacity}
                >
                  {shape.name}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default AfghanistanMap;
