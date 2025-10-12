"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

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
  onProvinceSelect?: (province: string) => void;
};

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const MAP_PADDING = 10;
const ANIMATION_DURATION = 280;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.15;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const clampTranslate = (value: number, scale: number, dimension: number) => {
  if (scale <= 1) {
    return 0;
  }
  const min = dimension - dimension * scale;
  const max = 0;
  return clamp(value, min, max);
};

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
  onProvinceSelect,
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

  const svgRef = useRef<SVGSVGElement | null>(null);
  const panStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    translateX: number;
    translateY: number;
  } | null>(null);

  const [viewTransform, setViewTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const zoomIn = event.deltaY < 0;
    const factor = zoomIn ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;

    setViewTransform((prev) => {
      const nextScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      if (nextScale === prev.scale) {
        return prev;
      }

      if (nextScale <= 1) {
        return { scale: 1, translateX: 0, translateY: 0 };
      }

      const svgElement = svgRef.current;
      if (!svgElement) {
        return {
          scale: nextScale,
          translateX: clampTranslate(prev.translateX, nextScale, MAP_WIDTH),
          translateY: clampTranslate(prev.translateY, nextScale, MAP_HEIGHT),
        };
      }

      const rect = svgElement.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width;
      const offsetY = (event.clientY - rect.top) / rect.height;

      const mapX = (offsetX * MAP_WIDTH - prev.translateX) / prev.scale;
      const mapY = (offsetY * MAP_HEIGHT - prev.translateY) / prev.scale;

      const nextTranslateX = clampTranslate(
        offsetX * MAP_WIDTH - mapX * nextScale,
        nextScale,
        MAP_WIDTH
      );
      const nextTranslateY = clampTranslate(
        offsetY * MAP_HEIGHT - mapY * nextScale,
        nextScale,
        MAP_HEIGHT
      );

      return {
        scale: nextScale,
        translateX: nextTranslateX,
        translateY: nextTranslateY,
      };
    });
  }, []);

  useEffect(() => {
    panStateRef.current = null;
    setIsDragging(false);
    setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
  }, [renderBounds]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    svgElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      svgElement.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  const handleResetTransform = () => {
    panStateRef.current = null;
    setIsDragging(false);
    setViewTransform({ scale: 1, translateX: 0, translateY: 0 });
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || viewTransform.scale <= 1) {
      return;
    }

    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    event.preventDefault();
    svgElement.setPointerCapture(event.pointerId);
    panStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      translateX: viewTransform.translateX,
      translateY: viewTransform.translateY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const panState = panStateRef.current;
    if (!panState) {
      return;
    }

    const svgElement = svgRef.current;
    if (!svgElement) {
      return;
    }

    event.preventDefault();
    const rect = svgElement.getBoundingClientRect();
    const dx = ((event.clientX - panState.startX) / rect.width) * MAP_WIDTH;
    const dy = ((event.clientY - panState.startY) / rect.height) * MAP_HEIGHT;

    setViewTransform((prev) => {
      const scale = prev.scale;
      if (scale <= 1) {
        return { scale: 1, translateX: 0, translateY: 0 };
      }

      const nextTranslateX = clampTranslate(
        panState.translateX + dx,
        scale,
        MAP_WIDTH
      );
      const nextTranslateY = clampTranslate(
        panState.translateY + dy,
        scale,
        MAP_HEIGHT
      );

      return {
        ...prev,
        translateX: nextTranslateX,
        translateY: nextTranslateY,
      };
    });
  };

  const endPan = () => {
    const panState = panStateRef.current;
    const svgElement = svgRef.current;
    if (panState && svgElement && svgElement.hasPointerCapture?.(panState.pointerId)) {
      svgElement.releasePointerCapture(panState.pointerId);
    }
    panStateRef.current = null;
    setIsDragging(false);
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerId === panStateRef.current?.pointerId) {
      endPan();
    }
  };

  const handlePointerLeave = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerId === panStateRef.current?.pointerId) {
      endPan();
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerId === panStateRef.current?.pointerId) {
      endPan();
    }
  };

  const handleProvinceSelection = (province: string) => {
    onProvinceSelect?.(province);
  };

  const handleProvinceKeyDown = (
    province: string,
    event: ReactKeyboardEvent<SVGGElement>
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onProvinceSelect?.(province);
    }
  };

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
  const mapTransform = `matrix(${viewTransform.scale} 0 0 ${viewTransform.scale} ${viewTransform.translateX} ${viewTransform.translateY})`;
  const mapCursorClass =
    viewTransform.scale > 1
      ? isDragging
        ? "cursor-grabbing"
        : "cursor-grab"
      : "";

  const containerClass = composeClass(
    `relative flex h-full w-full items-center justify-center overflow-hidden overscroll-contain bg-slate-50 ${mapCursorClass}`
  );

  return (
    <div className={containerClass}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label="Map of Afghanistan with provincial boundaries"
        className="block h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        onDoubleClick={handleResetTransform}
      >
        <g transform={mapTransform}>
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#f8fafc" />
          {mapShapes.map((shape) => {
            const isHovered = hoveredProvince === shape.name;
            const fill = shape.isFocused
              ? FOCUS_FILL
              : isHovered
              ? "#bae6fd"
              : shape.isHighlighted
              ? HIGHLIGHT_FILL
              : BASE_FILL;
            const stroke = shape.isFocused
              ? FOCUS_STROKE
              : isHovered
              ? FOCUS_STROKE
              : shape.isHighlighted
              ? HIGHLIGHT_STROKE
              : DIM_STROKE;
            const strokeWidth = shape.isFocused
              ? 1.6
              : isHovered
              ? 1.35
              : shape.isHighlighted
              ? 1
              : 0.8;
            const textOpacity =
              shape.isFocused || isHovered || shape.isHighlighted ? 1 : 0.45;

            return (
              <g
                key={shape.id}
                role="button"
                tabIndex={0}
                aria-pressed={shape.isFocused}
                aria-label={`Focus on ${shape.name} province`}
                className="cursor-pointer transition-transform duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                style={{
                  transformOrigin: "center",
                  transformBox: "fill-box",
                  transform: shape.isFocused
                    ? "scale(1.05)"
                    : isHovered
                    ? "scale(1.03)"
                    : shape.isHighlighted
                    ? "scale(1.015)"
                    : "scale(1)",
                }}
                onMouseEnter={() => setHoveredProvince(shape.name)}
                onMouseLeave={() => setHoveredProvince(null)}
                onFocus={() => setHoveredProvince(shape.name)}
                onBlur={() => setHoveredProvince(null)}
                onClick={() => handleProvinceSelection(shape.name)}
                onKeyDown={(event) => handleProvinceKeyDown(shape.name, event)}
              >
                <path
                  d={shape.path}
                  fill={fill}
                  stroke={stroke}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={strokeWidth}
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
                    fill={shape.isFocused || isHovered ? "#0f172a" : "#1f2937"}
                    fontSize={labelFontSize}
                    fontWeight={shape.isFocused || isHovered ? 700 : 600}
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
        </g>
      </svg>
    </div>
  );
}

export default AfghanistanMap;
