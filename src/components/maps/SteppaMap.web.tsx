import {
    CheckCircle,
    Clock,
    LocateFixed,
    MapPin,
    Package,
    Route,
} from "lucide-react-native";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import "maplibre-gl/dist/maplibre-gl.css";

import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppTextInput } from "@/components/AppTextInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, spacing } from "@/theme";

import type { MapCoordinate, MapLocation, SteppaMapProps } from "./types";

type MapRuntime = typeof import("maplibre-gl");
type PointType = "collection" | "destination";

type RoadRoute = {
  coordinates: MapCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
};

type SearchArea = {
  coordinates: MapCoordinate;
  label: string;
};

type AddressSearchProps = {
  label: string;
  initialQuery: string;
  selected: MapLocation | null;
  center: MapCoordinate | null;
  disabled: boolean;
  ready: boolean;
  onSelect: (location: MapLocation) => void;
  onClear: () => void;
};

const SEARCH_RADIUS_KM = 30;
const SEARCH_DELAY_MS = 800;

const EMPTY_ROUTE = {
  type: "FeatureCollection" as const,
  features: [],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function isLocation(value: unknown): value is MapLocation {
  return (
    isObject(value) &&
    typeof value.label === "string" &&
    isCoordinate(value.coordinates)
  );
}

function isRoadRoute(value: unknown): value is RoadRoute {
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

function getError(data: unknown, fallback: string) {
  return isObject(data) && typeof data.error === "string"
    ? data.error
    : fallback;
}

function formatDistance(meters: number) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function makePinnedLocation(coordinates: MapCoordinate): MapLocation {
  return {
    label:
      `Pinned location: ${coordinates[1].toFixed(6)}, ` +
      coordinates[0].toFixed(6),
    coordinates,
  };
}

function AddressSearch({
  label,
  initialQuery,
  selected,
  center,
  disabled,
  ready,
  onSelect,
  onClear,
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const requestRef = useRef(0);
  const onSelectRef = useRef(onSelect);

  const longitude = center?.[0];
  const latitude = center?.[1];

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (selected) {
      setQuery(selected.label);
      setResults([]);
      setError("");
    }
  }, [selected]);

  useEffect(() => {
    const text = query.trim();

    if (
      disabled ||
      !ready ||
      selected ||
      text.length < 3 ||
      text.length > 200
    ) {
      setLoading(false);
      setResults([]);
      setError("");
      return;
    }

    const controller = new AbortController();
    const requestId = ++requestRef.current;

    setLoading(true);
    setError("");
    setResults([]);

    const timer = setTimeout(() => {
      async function search() {
        const params = new URLSearchParams({ q: text });

        if (longitude !== undefined && latitude !== undefined) {
          params.set("lon", String(longitude));
          params.set("lat", String(latitude));
          params.set("radiusKm", String(SEARCH_RADIUS_KM));
        }

        try {
          const response = await fetch(`/api/maps?${params.toString()}`, {
            signal: controller.signal,
          });

          const data: unknown = await response.json();

          if (!response.ok) {
            throw new Error(getError(data, "Address search failed."));
          }

          if (controller.signal.aborted || requestId !== requestRef.current) {
            return;
          }

          if (!isObject(data) || !Array.isArray(data.places)) {
            throw new Error(
              "The address service returned an invalid response.",
            );
          }

          const places = data.places.filter(isLocation);

          if (places.length === 1) {
            onSelectRef.current(places[0]);
          } else {
            setResults(places);

            if (places.length === 0) {
              setError(
                "No matching place found. Try the business or street name without the house number. You can also change the search area or place a pin.",
              );
            }
          }
        } catch (caughtError) {
          if (controller.signal.aborted || requestId !== requestRef.current) {
            return;
          }

          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not search for this address.",
          );
        } finally {
          if (!controller.signal.aborted && requestId === requestRef.current) {
            setLoading(false);
          }
        }
      }

      void search();
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected, longitude, latitude, disabled, ready, attempt]);

  return (
    <View style={styles.searchSection}>
      <AppText style={styles.label}>{label}</AppText>

      <AppTextInput
        accessibilityLabel={label}
        value={query}
        editable={!disabled}
        placeholder="Business, street or full address"
        maxLength={200}
        onChangeText={(text) => {
          requestRef.current += 1;
          setQuery(text);
          setResults([]);
          setError("");
          onClear();
        }}
      />

      {loading ? (
        <AppText variant="small">Searching for matching places…</AppText>
      ) : null}

      {selected ? (
        <View style={styles.selectedRow}>
          <CheckCircle size={16} color={colors.primary} />

          <AppText variant="small" style={styles.flexText}>
            Selected: {selected.label}
          </AppText>
        </View>
      ) : null}

      {results.length > 1 ? (
        <AppText variant="secondary">
          Choose the correct branch or address:
        </AppText>
      ) : null}

      {results.map((place, index) => (
        <Pressable
          key={`${place.coordinates.join(",")}-${index}`}
          accessibilityRole="button"
          accessibilityLabel={`Select ${place.label}`}
          disabled={disabled}
          onPress={() => {
            onSelect(place);
            setResults([]);
            setError("");
          }}
          style={({ pressed }) => [
            styles.searchResult,
            pressed && styles.pressed,
          ]}
        >
          <MapPin size={18} color={colors.primary} />

          <AppText style={styles.flexText}>{place.label}</AppText>
        </Pressable>
      ))}

      {error ? (
        <>
          <AppText variant="error" accessibilityRole="alert">
            {error}
          </AppText>

          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => {
              setAttempt((current) => current + 1);
            }}
            style={styles.textButton}
          >
            <AppText style={styles.linkText}>Retry address search</AppText>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

export default function SteppaMap({
  category = "Errand",
  initialCollection = "",
  initialDestination = "",
  queueOnly = false,
  onConfirm,
}: SteppaMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const runtimeRef = useRef<MapRuntime | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const activePointRef = useRef<PointType>("collection");
  const confirmedRef = useRef(false);
  const hasSelectedPointRef = useRef(false);
  const manuallyScopedRef = useRef(false);

  const routeControllerRef = useRef<AbortController | null>(null);

  const routeRequestRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [searchReady, setSearchReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [routeError, setRouteError] = useState("");

  const [area, setArea] = useState<SearchArea | null>(null);
  const [nationalSearch, setNationalSearch] = useState(false);

  const [collection, setCollection] = useState<MapLocation | null>(null);

  const [destination, setDestination] = useState<MapLocation | null>(null);

  const [roadRoute, setRoadRoute] = useState<RoadRoute | null>(null);

  const [activePoint, setActivePoint] = useState<PointType>("collection");

  const [routing, setRouting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [routeAttempt, setRouteAttempt] = useState(0);

  const invalidateRoute = useCallback(() => {
    routeRequestRef.current += 1;
    routeControllerRef.current?.abort();

    setRoadRoute(null);
    setRouting(false);
    setRouteError("");
  }, []);

  const chooseLocation = useCallback(
    (location: MapLocation, point: PointType, moveMap = true) => {
      if (confirmedRef.current) {
        return;
      }

      hasSelectedPointRef.current = true;
      invalidateRoute();

      if (point === "collection") {
        setCollection(location);
      } else {
        setDestination(location);
      }

      if (moveMap) {
        mapRef.current?.flyTo({
          center: location.coordinates,
          zoom: 16,
        });
      }
    },
    [invalidateRoute],
  );

  function clearLocation(point: PointType) {
    if (confirmedRef.current) {
      return;
    }

    invalidateRoute();

    if (point === "collection") {
      setCollection(null);
    } else {
      setDestination(null);
    }
  }

  function selectPointType(point: PointType) {
    activePointRef.current = point;
    setActivePoint(point);
  }

  function searchThisMapArea() {
    const map = mapRef.current;

    if (!map || confirmedRef.current) {
      return;
    }

    const center = map.getCenter();

    manuallyScopedRef.current = true;
    setNationalSearch(false);

    setArea({
      coordinates: [center.lng, center.lat],
      label: "the map area you selected",
    });

    invalidateRoute();
    setCollection(null);
    setDestination(null);
  }

  const collectionSearchCenter = nationalSearch
    ? null
    : (area?.coordinates ?? null);

  // When no device/search area is available, a selected collection
  // provides a useful local area for the delivery search.
  const destinationSearchCenter = nationalSearch
    ? null
    : (area?.coordinates ?? collection?.coordinates ?? null);

  useEffect(() => {
    let disposed = false;
    let createdMap: MapLibreMap | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let locationTimer: ReturnType<typeof setTimeout> | null = null;

    async function initialiseMap() {
      try {
        const maplibre = await import("maplibre-gl");

        maplibre.setWorkerUrl(
          new URL(
            "/maplibre/maplibre-gl-worker.mjs?v=" + maplibre.getVersion(),
            window.location.origin,
          ).href,
        );

        if (disposed || !containerRef.current) {
          return;
        }

        runtimeRef.current = maplibre;

        // No town or starting coordinates are supplied.
        // The map moves to the device location or API search results.
        const map = new maplibre.Map({
          container: containerRef.current,
          style: "https://tiles.openfreemap.org/styles/liberty",
          zoom: 1,
        });

        createdMap = map;
        mapRef.current = map;

        map.addControl(new maplibre.NavigationControl(), "top-right");

        map.addControl(new maplibre.FullscreenControl(), "top-right");

        map.addControl(
          new maplibre.ScaleControl({ unit: "metric" }),
          "bottom-left",
        );

        map.on("load", () => {
          if (disposed) {
            return;
          }

          map.addSource("steppa-route", {
            type: "geojson",
            data: EMPTY_ROUTE,
          });

          map.addLayer({
            id: "steppa-route-line",
            type: "line",
            source: "steppa-route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": colors.primary,
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });

          setReady(true);
          setMapError("");
          map.resize();

          // Do not block address search indefinitely if location
          // permission is unanswered or unavailable.
          locationTimer = setTimeout(() => {
            if (!disposed) {
              setSearchReady(true);
              setLocationMessage(
                "You can search by address while device location is unavailable.",
              );
            }
          }, 5000);

          if (!navigator.geolocation) {
            clearTimeout(locationTimer);
            setSearchReady(true);
            setLocationMessage(
              "Device location is unavailable. Include the town in your address.",
            );
            return;
          }

          setLocationMessage(
            "Requesting your location to focus nearby searches…",
          );

          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (disposed) {
                return;
              }

              if (locationTimer) {
                clearTimeout(locationTimer);
              }

              const coordinates: MapCoordinate = [
                position.coords.longitude,
                position.coords.latitude,
              ];

              const accuracy = Math.ceil(position.coords.accuracy);

              if (
                !manuallyScopedRef.current &&
                !hasSelectedPointRef.current &&
                !confirmedRef.current
              ) {
                // Very coarse device estimates should not silently
                // restrict a customer's address search.
                if (accuracy <= 5000) {
                  setArea({
                    coordinates,
                    label: "your device location",
                  });

                  map.flyTo({
                    center: coordinates,
                    zoom: accuracy <= 100 ? 15 : 12,
                  });
                }
              }

              setLocationMessage(
                accuracy <= 5000
                  ? `Browser-reported device accuracy: approximately ${accuracy} metres. Verify the selected pins.`
                  : `Your device location is approximate (${accuracy} metres). Include the town in your address or choose a search area on the map.`,
              );

              setSearchReady(true);
            },
            () => {
              if (disposed) {
                return;
              }

              if (locationTimer) {
                clearTimeout(locationTimer);
              }

              setLocationMessage(
                "Location access is unavailable. Addresses will still be searched; include the town to narrow the results.",
              );

              setSearchReady(true);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            },
          );
        });

        map.on("click", (event) => {
          if (confirmedRef.current) {
            return;
          }

          chooseLocation(
            makePinnedLocation([event.lngLat.lng, event.lngLat.lat]),
            activePointRef.current,
            false,
          );
        });

        map.on("error", (event) => {
          if (disposed) {
            return;
          }

          const message =
            event.error instanceof Error ? event.error.message : "";

          setMapError(
            /worker/i.test(message)
              ? "The map worker could not load. Check the files in public/maplibre."
              : "Some map data could not load. Check your connection and refresh.",
          );
        });

        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => {
            if (!disposed) {
              map.resize();
            }
          });

          resizeObserver.observe(containerRef.current);
        }
      } catch (caughtError) {
        if (!disposed) {
          setMapError(
            caughtError instanceof Error
              ? `Map could not start: ${caughtError.message}`
              : "Map could not start.",
          );
        }
      }
    }

    void initialiseMap();

    return () => {
      disposed = true;

      if (locationTimer) {
        clearTimeout(locationTimer);
      }

      routeRequestRef.current += 1;
      routeControllerRef.current?.abort();
      resizeObserver?.disconnect();

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      createdMap?.remove();
      mapRef.current = null;
      runtimeRef.current = null;
    };
  }, [chooseLocation]);

  useEffect(() => {
    const map = mapRef.current;
    const runtime = runtimeRef.current;

    if (!ready || !map || !runtime) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    function addMarker(location: MapLocation, point: PointType, color: string) {
      if (!map || !runtime) {
        return;
      }

      const title =
        point === "collection"
          ? queueOnly
            ? "Queue location"
            : "Collection"
          : "Delivery";

      const marker = new runtime.Marker({
        color,
        draggable: !confirmed,
      })
        .setLngLat(location.coordinates)
        .setPopup(
          new runtime.Popup({ offset: 25 }).setText(
            `${title}: ${location.label}`,
          ),
        )
        .addTo(map);

      marker
        .getElement()
        .setAttribute(
          "aria-label",
          `${title} pin${confirmed ? "" : ". Drag to adjust."}`,
        );

      marker.on("dragstart", () => {
        if (!confirmedRef.current) {
          invalidateRoute();
        }
      });

      marker.on("dragend", () => {
        const position = marker.getLngLat();

        chooseLocation(
          makePinnedLocation([position.lng, position.lat]),
          point,
          false,
        );
      });

      markersRef.current.push(marker);
    }

    if (collection) {
      addMarker(collection, "collection", colors.primary);
    }

    if (!queueOnly && destination) {
      addMarker(destination, "destination", colors.text);
    }
  }, [
    ready,
    collection,
    destination,
    queueOnly,
    confirmed,
    chooseLocation,
    invalidateRoute,
  ]);

  // Calculate automatically whenever both selected locations change.
  useEffect(() => {
    if (!ready || queueOnly || confirmed || !collection || !destination) {
      return;
    }

    if (
      collection.coordinates[0] === destination.coordinates[0] &&
      collection.coordinates[1] === destination.coordinates[1]
    ) {
      setRouteError("Collection and delivery must be different locations.");
      return;
    }

    const controller = new AbortController();
    const requestId = ++routeRequestRef.current;

    routeControllerRef.current = controller;

    setRouting(true);
    setRoadRoute(null);
    setRouteError("");

    async function calculateRoute() {
      try {
        const response = await fetch("/api/maps", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collection: collection!.coordinates,
            destination: destination!.coordinates,
          }),
          signal: controller.signal,
        });

        const data: unknown = await response.json();

        if (!response.ok) {
          throw new Error(
            getError(data, "Could not calculate the road route."),
          );
        }

        if (
          controller.signal.aborted ||
          requestId !== routeRequestRef.current
        ) {
          return;
        }

        if (!isRoadRoute(data)) {
          throw new Error("The route service returned an invalid route.");
        }

        setRoadRoute(data);
      } catch (caughtError) {
        if (
          controller.signal.aborted ||
          requestId !== routeRequestRef.current
        ) {
          return;
        }

        setRouteError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not calculate the route.",
        );
      } finally {
        if (
          !controller.signal.aborted &&
          requestId === routeRequestRef.current
        ) {
          setRouting(false);
        }
      }
    }

    void calculateRoute();

    return () => {
      controller.abort();
    };
  }, [ready, queueOnly, confirmed, collection, destination, routeAttempt]);

  useEffect(() => {
    const map = mapRef.current;

    if (!ready || !map) {
      return;
    }

    const source = map.getSource("steppa-route") as GeoJSONSource | undefined;

    if (!source) {
      return;
    }

    if (!roadRoute) {
      source.setData(EMPTY_ROUTE);
      return;
    }

    source.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: roadRoute.coordinates,
      },
    });

    let minLongitude = Infinity;
    let minLatitude = Infinity;
    let maxLongitude = -Infinity;
    let maxLatitude = -Infinity;

    for (const [longitude, latitude] of roadRoute.coordinates) {
      minLongitude = Math.min(minLongitude, longitude);
      minLatitude = Math.min(minLatitude, latitude);
      maxLongitude = Math.max(maxLongitude, longitude);
      maxLatitude = Math.max(maxLatitude, latitude);
    }

    map.fitBounds(
      [
        [minLongitude, minLatitude],
        [maxLongitude, maxLatitude],
      ],
      {
        padding: 60,
        maxZoom: 16,
        duration: 700,
      },
    );
  }, [ready, roadRoute]);

  const canConfirm = Boolean(
    ready &&
    collection &&
    !routing &&
    (queueOnly || (destination && roadRoute)),
  );

  function confirmLocations() {
    if (!canConfirm || !collection || confirmedRef.current) {
      return;
    }

    onConfirm?.({
      collection,
      destination: queueOnly ? null : destination,
      distanceMeters: queueOnly ? null : (roadRoute?.distanceMeters ?? null),
      durationSeconds: queueOnly ? null : (roadRoute?.durationSeconds ?? null),
    });

    confirmedRef.current = true;
    setConfirmed(true);
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <div
          ref={containerRef}
          role="region"
          aria-label="Errand collection and delivery map"
          style={{
            width: "100%",
            height: "100%",
          }}
        />

        {!ready && !mapError ? (
          <View style={styles.mapNotice}>
            <AppText variant="small">Loading map…</AppText>
          </View>
        ) : null}
      </View>

      <AppCard style={styles.detailsCard}>
        <View style={styles.categoryRow}>
          <View style={styles.categoryIcon}>
            <Package size={22} color={colors.primary} />
          </View>

          <View style={styles.textColumn}>
            <AppText variant="heading">{category}</AppText>

            <AppText variant="secondary">
              {queueOnly
                ? "Review your queue location"
                : "Review your collection and delivery route"}
            </AppText>
          </View>
        </View>

        {mapError ? (
          <AppText variant="error" accessibilityRole="alert">
            {mapError}
          </AppText>
        ) : null}

        {locationMessage && !confirmed ? (
          <AppText variant="small">{locationMessage}</AppText>
        ) : null}

        {roadRoute && !queueOnly ? (
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Route size={16} color={colors.primary} />

              <AppText>{formatDistance(roadRoute.distanceMeters)}</AppText>
            </View>

            <View style={styles.metric}>
              <Clock size={16} color={colors.primary} />

              <AppText>{formatDuration(roadRoute.durationSeconds)}</AppText>
            </View>
          </View>
        ) : null}

        {!confirmed ? (
          <View style={styles.searchSection}>
            <AppText style={styles.label}>Search area</AppText>

            <AppText variant="small">
              {nationalSearch
                ? "Searching across South Africa."
                : area
                  ? `Searching within ${SEARCH_RADIUS_KM} km of ${area.label}.`
                  : "Searching across South Africa until a location is available. Include the town when possible."}
            </AppText>

            <View style={styles.scopeButtons}>
              <Pressable
                accessibilityRole="button"
                disabled={!ready}
                onPress={searchThisMapArea}
                style={({ pressed }) => [
                  styles.scopeButton,
                  pressed && styles.pressed,
                ]}
              >
                <LocateFixed size={16} color={colors.primary} />

                <AppText style={styles.linkText}>Search this map area</AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  selected: nationalSearch,
                }}
                onPress={() => {
                  manuallyScopedRef.current = true;
                  setNationalSearch((current) => !current);
                }}
                style={({ pressed }) => [
                  styles.scopeButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={styles.linkText}>
                  {nationalSearch
                    ? "Use nearby search"
                    : "Search all South Africa"}
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.locationRow}>
          <MapPin size={20} color={colors.primary} />

          <View style={styles.textColumn}>
            <AppText variant="small">
              {queueOnly ? "Queue location" : "Collection"}
            </AppText>

            <AppText>
              {collection?.label ||
                initialCollection ||
                "Enter a location below"}
            </AppText>

            {!collection ? (
              <AppText variant="small">
                Waiting for a matching location.
              </AppText>
            ) : null}
          </View>
        </View>

        {!queueOnly ? (
          <View style={styles.locationRow}>
            <MapPin size={20} color={colors.text} />

            <View style={styles.textColumn}>
              <AppText variant="small">Delivery</AppText>

              <AppText>
                {destination?.label ||
                  initialDestination ||
                  "Enter a location below"}
              </AppText>

              {!destination ? (
                <AppText variant="small">
                  Waiting for a matching location.
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}

        {!confirmed ? (
          <>
            <AddressSearch
              label={
                queueOnly ? "Queue location" : "Collection address or business"
              }
              initialQuery={initialCollection}
              selected={collection}
              center={collectionSearchCenter}
              disabled={confirmed}
              ready={ready && searchReady}
              onClear={() => {
                clearLocation("collection");
              }}
              onSelect={(location) => {
                chooseLocation(location, "collection");
              }}
            />

            {!queueOnly ? (
              <AddressSearch
                label="Delivery address or place"
                initialQuery={initialDestination}
                selected={destination}
                center={destinationSearchCenter}
                disabled={confirmed}
                ready={ready && searchReady}
                onClear={() => {
                  clearLocation("destination");
                }}
                onSelect={(location) => {
                  chooseLocation(location, "destination");
                }}
              />
            ) : null}

            <AppText variant="small">
              Search runs automatically after you pause typing. A single result
              is selected automatically; choose from the list when there are
              multiple matches. Verify each pin before confirming.
            </AppText>

            <View style={styles.pinButtons}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  selected: activePoint === "collection",
                }}
                onPress={() => {
                  selectPointType("collection");
                }}
                style={({ pressed }) => [
                  styles.pinButton,
                  activePoint === "collection" && styles.selectedPinButton,
                  pressed && styles.pressed,
                ]}
              >
                <MapPin size={16} color={colors.primary} />

                <AppText style={styles.buttonText}>
                  {queueOnly ? "Queue pin" : "Collection pin"}
                </AppText>
              </Pressable>

              {!queueOnly ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: activePoint === "destination",
                  }}
                  onPress={() => {
                    selectPointType("destination");
                  }}
                  style={({ pressed }) => [
                    styles.pinButton,
                    activePoint === "destination" && styles.selectedPinButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MapPin size={16} color={colors.text} />

                  <AppText style={styles.buttonText}>Delivery pin</AppText>
                </Pressable>
              ) : null}
            </View>

            <AppText variant="small">
              To place a pin manually, choose its button and click the map. Drag
              a pin to adjust the entrance. Street and business results may not
              identify the exact door.
            </AppText>
          </>
        ) : null}

        {routing ? (
          <AppText variant="secondary">
            Calculating the road route automatically…
          </AppText>
        ) : null}

        {routeError ? (
          <>
            <AppText variant="error" accessibilityRole="alert">
              {routeError}
            </AppText>

            {!confirmed ? (
              <PrimaryButton
                title="Retry road route"
                disabled={!collection || !destination || routing}
                onPress={() => {
                  setRouteAttempt((current) => current + 1);
                }}
              />
            ) : null}
          </>
        ) : null}

        {confirmed ? (
          <View style={styles.confirmedRow}>
            <CheckCircle size={20} color={colors.primary} />

            <AppText style={styles.confirmedText}>Locations confirmed</AppText>
          </View>
        ) : (
          <PrimaryButton
            title={queueOnly ? "Confirm queue location" : "Confirm locations"}
            disabled={!canConfirm}
            onPress={confirmLocations}
          />
        )}

        {confirmed ? (
          <AppText variant="small">
            Use the form’s Edit details button to change the confirmed
            locations.
          </AppText>
        ) : null}

        {roadRoute && !queueOnly ? (
          <AppText variant="small">
            Driving time is an estimate. It excludes shopping, queueing and live
            traffic delays.
          </AppText>
        ) : null}

        <AppText variant="small">
          Address search and routing: openrouteservice / HeiGIT. Live tracking
          of another Steppa is not connected yet.
        </AppText>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  mapContainer: {
    height: 480,
    width: "100%",
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
    position: "relative",
  },
  mapNotice: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  detailsCard: {
    marginTop: spacing.sm,
    borderRadius: 24,
    gap: spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  flexText: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontWeight: "600",
  },
  searchSection: {
    gap: spacing.sm,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  searchResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  scopeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  scopeButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  textButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  linkText: {
    color: colors.primary,
    fontWeight: "600",
  },
  pinButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pinButton: {
    flex: 1,
    minWidth: 130,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  selectedPinButton: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  buttonText: {
    fontWeight: "600",
  },
  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  confirmedText: {
    color: colors.primary,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.75,
  },
});
