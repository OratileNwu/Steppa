import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { Map as MapLibreMap } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { AppText } from "@/components/AppText";
import { PrimaryButton } from "@/components/PrimaryButton";
import type {
  ConfirmedRoute,
  MapCoordinate,
} from "@/components/maps/types";
import { colors, spacing } from "@/theme";

type Props = {
  route?: ConfirmedRoute;
};

type RouteResult = {
  coordinates: MapCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
};

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isCoordinate(value: unknown): value is MapCoordinate {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

function isRouteResult(value: unknown): value is RouteResult {
  return (
    isObject(value) &&
    Array.isArray(value.coordinates) &&
    value.coordinates.length >= 2 &&
    value.coordinates.every(isCoordinate) &&
    typeof value.distanceMeters === "number" &&
    Number.isFinite(value.distanceMeters) &&
    value.distanceMeters >= 0 &&
    typeof value.durationSeconds === "number" &&
    Number.isFinite(value.durationSeconds) &&
    value.durationSeconds >= 0
  );
}

export default function ErrandRoutePreview({ route }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const collectionLongitude = route?.collection.coordinates[0];
  const collectionLatitude = route?.collection.coordinates[1];
  const collectionLabel = route?.collection.label ?? "";

  const destinationLongitude =
    route?.destination?.coordinates[0];

  const destinationLatitude =
    route?.destination?.coordinates[1];

  const destinationLabel = route?.destination?.label ?? "";

  const hasCollection =
    collectionLongitude !== undefined &&
    collectionLatitude !== undefined &&
    isCoordinate([collectionLongitude, collectionLatitude]);

  useEffect(() => {
    if (
      collectionLongitude === undefined ||
      collectionLatitude === undefined ||
      !isCoordinate([collectionLongitude, collectionLatitude])
    ) {
      return;
    }

    let disposed = false;
    let map: MapLibreMap | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const controller = new AbortController();

    const collection: MapCoordinate = [
      collectionLongitude,
      collectionLatitude,
    ];

    const destination: MapCoordinate | null =
      destinationLongitude !== undefined &&
      destinationLatitude !== undefined &&
      isCoordinate([destinationLongitude, destinationLatitude])
        ? [destinationLongitude, destinationLatitude]
        : null;

    setLoading(true);
    setError("");
    setResult(null);

    async function initialiseMap() {
      try {
        const runtime = await import("maplibre-gl");

        if (disposed || !containerRef.current) {
          return;
        }

        runtime.setWorkerUrl(
          new URL(
            "/maplibre/maplibre-gl-worker.mjs?v=" +
              runtime.getVersion(),
            window.location.origin,
          ).href,
        );

        const createdMap = new runtime.Map({
          container: containerRef.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: collection,
          zoom: 15,
        });

        map = createdMap;

        createdMap.addControl(
          new runtime.NavigationControl(),
          "top-right",
        );

        createdMap.addControl(
          new runtime.FullscreenControl(),
          "top-right",
        );

        createdMap.on("error", () => {
          if (!disposed) {
            setError(
              "Some map data could not load. Check your connection.",
            );
          }
        });

        createdMap.on("load", () => {
          async function displayRoute() {
            if (disposed) {
              return;
            }

            new runtime.Marker({ color: colors.primary })
              .setLngLat(collection)
              .setPopup(
                new runtime.Popup({ offset: 25 }).setText(
                  collectionLabel || "Collection / queue location",
                ),
              )
              .addTo(createdMap);

            if (!destination) {
              setLoading(false);
              return;
            }

            new runtime.Marker({ color: colors.text })
              .setLngLat(destination)
              .setPopup(
                new runtime.Popup({ offset: 25 }).setText(
                  destinationLabel || "Delivery",
                ),
              )
              .addTo(createdMap);

            // Show both selected locations while routing loads.
            createdMap.fitBounds(
              [
                [
                  Math.min(collection[0], destination[0]),
                  Math.min(collection[1], destination[1]),
                ],
                [
                  Math.max(collection[0], destination[0]),
                  Math.max(collection[1], destination[1]),
                ],
              ],
              { padding: 50, maxZoom: 16 },
            );

            try {
              const response = await fetch("/api/maps", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  collection,
                  destination,
                }),
                signal: controller.signal,
              });

              const data: unknown = await response.json();

              if (!response.ok) {
                throw new Error(
                  isObject(data) && typeof data.error === "string"
                    ? data.error
                    : "The road route could not be loaded.",
                );
              }

              if (disposed || controller.signal.aborted) {
                return;
              }

              if (!isRouteResult(data)) {
                throw new Error(
                  "The route service returned an invalid route.",
                );
              }

              createdMap.addSource("errand-details-route", {
                type: "geojson",
                data: {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: data.coordinates,
                  },
                },
              });

              createdMap.addLayer({
                id: "errand-details-route-line",
                type: "line",
                source: "errand-details-route",
                layout: {
                  "line-cap": "round",
                  "line-join": "round",
                },
                paint: {
                  "line-color": colors.primary,
                  "line-width": 5,
                },
              });

              const bounds = new runtime.LngLatBounds();

              for (const coordinate of data.coordinates) {
                bounds.extend(coordinate);
              }

              createdMap.fitBounds(bounds, {
                padding: 50,
                maxZoom: 16,
              });

              setResult(data);
            } catch (caughtError) {
              if (!disposed && !controller.signal.aborted) {
                setError(
                  caughtError instanceof Error
                    ? caughtError.message
                    : "Could not load the road route.",
                );
              }
            } finally {
              if (!disposed && !controller.signal.aborted) {
                setLoading(false);
              }
            }
          }

          void displayRoute();
        });

        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => {
            if (!disposed) {
              createdMap.resize();
            }
          });

          resizeObserver.observe(containerRef.current);
        }
      } catch (caughtError) {
        if (!disposed) {
          setLoading(false);
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "The map could not start.",
          );
        }
      }
    }

    void initialiseMap();

    return () => {
      disposed = true;
      controller.abort();
      resizeObserver?.disconnect();
      map?.remove();
    };
  }, [
    collectionLongitude,
    collectionLatitude,
    collectionLabel,
    destinationLongitude,
    destinationLatitude,
    destinationLabel,
    attempt,
  ]);

  if (!hasCollection) {
    return (
      <AppText variant="secondary">
        Confirmed location coordinates are not available yet.
        The route will appear when they are supplied.
      </AppText>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapFrame}>
        <div
          ref={containerRef}
          role="region"
          aria-label="Confirmed errand route"
          style={{ width: "100%", height: "100%" }}
        />
      </View>

      {loading ? (
        <AppText variant="small">Loading route preview…</AppText>
      ) : null}

      {result ? (
        <AppText style={styles.routeSummary}>
          {(result.distanceMeters / 1000).toFixed(1)} km ·
          approximately{" "}
          {Math.max(1, Math.ceil(result.durationSeconds / 60))} min
          driving
        </AppText>
      ) : null}

      {error ? (
        <>
          <AppText variant="error" accessibilityRole="alert">
            {error}
          </AppText>

          <PrimaryButton
            title="Retry map"
            onPress={() => setAttempt((value) => value + 1)}
          />
        </>
      ) : null}

      <AppText variant="small">
        Route preview only. Live Steppa location sharing is not
        connected. Driving estimates exclude shopping, queues and
        live traffic delays.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  mapFrame: {
    height: 300,
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  routeSummary: {
    color: colors.primary,
    fontWeight: "600",
  },
});