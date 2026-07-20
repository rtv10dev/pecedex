export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
  source: "google" | "nominatim" | "manual";
  placeId?: string;
};

function googleMapsApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "Falta GOOGLE_MAPS_API_KEY en .env. Activa Places API (New) y Geocoding en Google Cloud.",
    );
  }
  return key;
}

function formatGooglePlaceLabel(place: {
  displayName?: { text?: string };
  formattedAddress?: string;
}): string {
  const name = place.displayName?.text?.trim();
  const address = place.formattedAddress?.trim();
  if (name && address && !address.toLowerCase().includes(name.toLowerCase())) {
    return `${name}, ${address}`;
  }
  return name || address || "Lugar sin nombre";
}

/**
 * Búsqueda de sitios con Places API (New) Text Search.
 * Mejor que Photon/Nominatim para playas y puntos de buceo.
 */
export async function searchPlaces(
  query: string,
  limit = 8,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = googleMapsApiKey();
  const maxResults = Math.min(Math.max(limit, 1), 10);

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify({
        textQuery: q,
        languageCode: "es",
        maxResultCount: maxResults,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 403 || response.status === 400) {
      throw new Error(
        "Google Places rechazó la petición. Revisa la API key y que Places API (New) esté activada.",
      );
    }
    throw new Error(
      `Google Places no respondió (${response.status}). ${detail.slice(0, 120)}`,
    );
  }

  const data = (await response.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    }>;
  };

  const results: GeocodeResult[] = [];
  for (const place of data.places ?? []) {
    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    results.push({
      label: formatGooglePlaceLabel(place),
      lat,
      lng,
      source: "google",
      placeId: place.id,
    });
  }
  return results;
}

/** Reverse geocode: Google primero; Nominatim si falla. */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (key) {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.set("latlng", `${lat},${lng}`);
      url.searchParams.set("language", "es");
      url.searchParams.set("key", key);

      const response = await fetch(url.toString(), { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as {
          status?: string;
          results?: Array<{ formatted_address?: string }>;
        };
        if (data.status === "OK" && data.results?.[0]?.formatted_address) {
          return data.results[0].formatted_address;
        }
      }
    }
  } catch {
    // caer a Nominatim
  }

  return reverseGeocodeNominatim(lat, lng);
}

async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "14");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Pecedex/0.1 (personal fish log; contact: local-dev)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    name?: string;
    display_name?: string;
    address?: {
      hamlet?: string;
      village?: string;
      town?: string;
      city?: string;
      municipality?: string;
      county?: string;
      state?: string;
      country?: string;
    };
  };

  if (data.name?.trim()) {
    const area =
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.address?.municipality ??
      data.address?.state;
    return area ? `${data.name}, ${area}` : data.name;
  }

  return data.display_name?.trim() || null;
}
