type Coordinate = [number, number];

type JsonObject = Record<string, unknown>;

type SearchPlace = {
  label: string;
  coordinates: Coordinate;
};

type SearchArea = {
  longitude: number;
  latitude: number;
  radiusKm: number;
};

function jsonError(message: string, status: number) {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function jsonSuccess(value: unknown) {
  return Response.json(value, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validCoordinate(value: unknown): value is Coordinate {
  if (!Array.isArray(value) || value.length !== 2) {
    return false;
  }

  const [longitude, latitude] = value;

  return (
    typeof longitude === "number" &&
    typeof latitude === "number" &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bmafikeng\b/g, "mahikeng")
    .replace(/\bdoctor\b/g, "dr")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Street-type words do not identify the particular street.
// The actual street name, town and house number still matter.
const COMMON_ADDRESS_WORDS = new Set([
  "street",
  "str",
  "st",
  "road",
  "rd",
  "avenue",
  "ave",
  "av",
  "drive",
  "lane",
  "ln",
  "close",
  "crescent",
  "cres",
  "boulevard",
  "blvd",
  "south",
  "africa",
  "za",
  "zaf",
]);

function meaningfulQueryWords(query: string): string[] {
  // A trailing four-digit value may be a South African postcode.
  // Do not require it: some address records omit their postcode.
  // Keep four-digit house numbers at the beginning of an address.
  const withoutTrailingPostcode = query.replace(/(?:[\s,]+)\d{4}\s*$/, "");

  return [
    ...new Set(
      normalizeText(withoutTrailingPostcode)
        .split(/\s+/)
        .filter((word) => word.length > 0 && !COMMON_ADDRESS_WORDS.has(word)),
    ),
  ];
}

function featureSearchText(properties: JsonObject): string {
  const searchableFields = [
    "label",
    "name",
    "housenumber",
    "street",
    "neighbourhood",
    "borough",
    "locality",
    "localadmin",
    "county",
    "region",
    "postalcode",
    "country",
    "country_a",
  ];

  return searchableFields
    .flatMap((field) => {
      const value = properties[field];

      return typeof value === "string" || typeof value === "number"
        ? [String(value)]
        : [];
    })
    .join(" ");
}

function matchesQuery(queryWords: string[], properties: JsonObject): boolean {
  if (queryWords.length === 0) {
    return false;
  }

  const resultWords = new Set(
    normalizeText(featureSearchText(properties)).split(/\s+/),
  );

  // Conservative relevance check:
  // every meaningful query word must appear in the result.
  //
  // This rejects unrelated fallback results. It is not proof
  // that the coordinate identifies the correct building entrance.
  return queryWords.every((word) => resultWords.has(word));
}

function distanceKm(first: Coordinate, second: Coordinate): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(second[1] - first[1]);

  const longitudeDifference = toRadians(second[0] - first[0]);

  const firstLatitude = toRadians(first[1]);
  const secondLatitude = toRadians(second[1]);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(Math.min(1, Math.max(0, a))),
      Math.sqrt(Math.max(0, 1 - a)),
    )
  );
}

function readSearchArea(
  params: URLSearchParams,
): SearchArea | null | "invalid" {
  const longitudeText = params.get("lon");
  const latitudeText = params.get("lat");
  const radiusText = params.get("radiusKm");

  if (longitudeText === null && latitudeText === null && radiusText === null) {
    return null;
  }

  if (
    !longitudeText?.trim() ||
    !latitudeText?.trim() ||
    (radiusText !== null && !radiusText.trim())
  ) {
    return "invalid";
  }

  const longitude = Number(longitudeText);
  const latitude = Number(latitudeText);
  const radiusKm = radiusText === null ? 50 : Number(radiusText);

  if (
    !validCoordinate([longitude, latitude]) ||
    !Number.isFinite(radiusKm) ||
    radiusKm < 1 ||
    radiusKm > 200
  ) {
    return "invalid";
  }

  return {
    longitude,
    latitude,
    radiusKm,
  };
}

function upstreamError(status: number, service: "search" | "route") {
  if (status === 429) {
    return jsonError(
      service === "search"
        ? "The address search limit was reached. Try again later."
        : "The route request limit was reached. Try again later.",
      429,
    );
  }

  if (status === 401 || status === 403) {
    return jsonError(
      "The maps service rejected this request. Check your API key, account permissions and quota.",
      502,
    );
  }

  return jsonError(
    service === "search"
      ? "Address search is unavailable. Please try again."
      : "A driving route could not be found. Choose points near accessible roads.",
    502,
  );
}

export async function GET(request: Request) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY?.trim();

  if (!apiKey) {
    return jsonError(
      "Add OPENROUTESERVICE_API_KEY to .env.local and restart Expo.",
      503,
    );
  }

  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim();

  if (!query || query.length < 3 || query.length > 200) {
    return jsonError("Enter a place or address of 3â€“200 characters.", 400);
  }

  const queryWords = meaningfulQueryWords(query);

  if (queryWords.length === 0) {
    return jsonError("Include a specific place, street name or town.", 400);
  }

  const area = readSearchArea(params);

  if (area === "invalid") {
    return jsonError(
      "Provide valid lon and lat values, with radiusKm between 1 and 200.",
      400,
    );
  }

  const url = new URL("https://api.heigit.org/pelias/v1/search");

  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("text", query);
  url.searchParams.set("boundary.country", "ZAF");
  url.searchParams.set("size", "10");

  if (area) {
    url.searchParams.set("focus.point.lon", String(area.longitude));

    url.searchParams.set("focus.point.lat", String(area.latitude));

    url.searchParams.set("boundary.circle.lon", String(area.longitude));

    url.searchParams.set("boundary.circle.lat", String(area.latitude));

    url.searchParams.set("boundary.circle.radius", String(area.radiusKm));
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return upstreamError(response.status, "search");
    }

    const data: unknown = await response.json();

    if (!isObject(data) || !Array.isArray(data.features)) {
      return jsonError(
        "The address service returned an invalid response.",
        502,
      );
    }

    const places: SearchPlace[] = [];
    const seen = new Set<string>();

    for (const feature of data.features) {
      if (
        !isObject(feature) ||
        !isObject(feature.geometry) ||
        !isObject(feature.properties)
      ) {
        continue;
      }

      const coordinates = feature.geometry.coordinates;
      const properties = feature.properties;
      const label = properties.label;

      if (
        !validCoordinate(coordinates) ||
        typeof label !== "string" ||
        !label.trim()
      ) {
        continue;
      }

      // Confirm country when the provider supplies its code.
      const countryCode =
        typeof properties.country_a === "string"
          ? properties.country_a.toUpperCase()
          : null;

      if (countryCode && countryCode !== "ZAF" && countryCode !== "ZA") {
        continue;
      }

      if (!matchesQuery(queryWords, properties)) {
        continue;
      }

      // Independently enforce the requested search boundary.
      if (
        area &&
        distanceKm([area.longitude, area.latitude], coordinates) > area.radiusKm
      ) {
        continue;
      }

      const identity = [
        normalizeText(label),
        coordinates[0].toFixed(6),
        coordinates[1].toFixed(6),
      ].join("|");

      if (seen.has(identity)) {
        continue;
      }

      seen.add(identity);

      places.push({
        label: label.trim(),
        coordinates,
      });
    }

    if (area) {
      const center: Coordinate = [area.longitude, area.latitude];

      places.sort(
        (first, second) =>
          distanceKm(center, first.coordinates) -
          distanceKm(center, second.coordinates),
      );
    }

    return jsonSuccess({
      places: places.slice(0, 5),
      message:
        places.length === 0
          ? "No matching address found. Check the spelling, try the place name, or place a pin on the map."
          : null,
    });
  } catch {
    return jsonError(
      "Address search timed out or could not connect. Please retry.",
      503,
    );
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY?.trim();

  if (!apiKey) {
    return jsonError(
      "Add OPENROUTESERVICE_API_KEY to .env.local and restart Expo.",
      503,
    );
  }

  let body: JsonObject;

  try {
    const parsed: unknown = await request.json();

    if (!isObject(parsed)) {
      return jsonError("Invalid route request.", 400);
    }

    body = parsed;
  } catch {
    return jsonError("Invalid route request.", 400);
  }

  const collection = body.collection;
  const destination = body.destination;

  if (!validCoordinate(collection) || !validCoordinate(destination)) {
    return jsonError("Select valid collection and delivery locations.", 400);
  }

  if (collection[0] === destination[0] && collection[1] === destination[1]) {
    return jsonError("Collection and delivery must be different places.", 400);
  }

  try {
    const response = await fetch(
      "https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/geo+json",
        },
        body: JSON.stringify({
          coordinates: [collection, destination],
          instructions: false,
        }),
        signal: AbortSignal.timeout(20000),
      },
    );

    if (!response.ok) {
      return upstreamError(response.status, "route");
    }

    const data: unknown = await response.json();

    if (
      !isObject(data) ||
      !Array.isArray(data.features) ||
      data.features.length === 0
    ) {
      return jsonError("The route service returned an invalid route.", 502);
    }

    const feature: unknown = data.features[0];

    if (
      !isObject(feature) ||
      !isObject(feature.geometry) ||
      !isObject(feature.properties) ||
      !isObject(feature.properties.summary)
    ) {
      return jsonError("The route service returned an invalid route.", 502);
    }

    const geometry = feature.geometry;
    const summary = feature.properties.summary;

    if (
      geometry.type !== "LineString" ||
      !Array.isArray(geometry.coordinates) ||
      geometry.coordinates.length < 2 ||
      !geometry.coordinates.every(validCoordinate) ||
      typeof summary.distance !== "number" ||
      typeof summary.duration !== "number" ||
      !Number.isFinite(summary.distance) ||
      !Number.isFinite(summary.duration) ||
      summary.distance < 0 ||
      summary.duration < 0
    ) {
      return jsonError("The route service returned an invalid route.", 502);
    }

    return jsonSuccess({
      coordinates: geometry.coordinates,
      distanceMeters: summary.distance,
      durationSeconds: summary.duration,
    });
  } catch {
    return jsonError(
      "The route service timed out or could not connect. Please retry.",
      503,
    );
  }
}

