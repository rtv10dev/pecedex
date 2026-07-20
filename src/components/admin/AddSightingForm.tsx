"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Camera,
  LoaderCircle,
  MapPin,
  Sparkles,
  Fish,
  Crosshair,
  Map as MapIcon,
} from "lucide-react";
import {
  createSightingAction,
  identifySightingAction,
  reverseGeocodeAction,
  searchLocationsAction,
  type CreateSightingState,
  type IdentifyState,
} from "@/app/admin/sighting-actions";
import { LocationMapPickerLazy } from "@/components/admin/LocationMapPickerLazy";
import { AddSightingModelStep } from "@/components/admin/AddSightingModelStep";
import type { GeocodeResult } from "@/lib/geocode";
import { cn } from "@/lib/utils";

const createInitial: CreateSightingState = {};

export function AddSightingForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);

  const [commonName, setCommonName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [description, setDescription] = useState("");
  const [family, setFamily] = useState("");
  const [habitat, setHabitat] = useState("");
  const [notes, setNotes] = useState("");
  const [idHint, setIdHint] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [sightedAt, setSightedAt] = useState("");

  const [locationQuery, setLocationQuery] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [searchingLocation, startLocationSearch] = useTransition();
  const [, startReverseGeocode] = useTransition();
  /** Evita re-buscar al rellenar el input tras elegir un resultado / reverse geocode. */
  const skipLocationSearchRef = useRef(false);
  /** Invalida respuestas de búsquedas anteriores ya lanzadas. */
  const locationSearchGenRef = useRef(0);

  const [identifyState, setIdentifyState] = useState<IdentifyState>({});
  const [identifying, startIdentify] = useTransition();

  const [createState, createAction, creating] = useActionState(
    createSightingAction,
    createInitial,
  );

  useEffect(() => {
    if (!identifyState.suggestion) return;
    const s = identifyState.suggestion;
    setCommonName(s.commonName);
    setScientificName(s.scientificName);
    setDescription(s.description);
    setFamily(s.family);
    setHabitat(s.habitat);
    setIdHint(s.notes);
    setConfidence(s.confidence);
    if (identifyState.photoPreviewUrl) {
      setPreviewUrl(identifyState.photoPreviewUrl);
    }
  }, [identifyState]);

  useEffect(() => {
    if (skipLocationSearchRef.current) {
      skipLocationSearchRef.current = false;
      setSuggestions([]);
      return;
    }

    if (locationQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const gen = ++locationSearchGenRef.current;
    const handle = window.setTimeout(() => {
      startLocationSearch(async () => {
        const { results, error } = await searchLocationsAction(locationQuery);
        if (gen !== locationSearchGenRef.current) return;
        setSuggestions(results);
        setLocationError(error ?? null);
      });
    }, 320);

    return () => window.clearTimeout(handle);
  }, [locationQuery]);

  // Si hay nombre + coordenadas, ya se puede guardar sin pulsar sugerencia
  useEffect(() => {
    const label = locationQuery.trim();
    if (label && lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      setLocationLabel(label);
    }
  }, [locationQuery, lat, lng]);

  const confidenceLabel = useMemo(() => {
    if (confidence <= 0) return null;
    return `${Math.round(confidence * 100)}% confianza`;
  }, [confidence]);

  if (createState.sightingId) {
    return (
      <AddSightingModelStep
        sightingId={createState.sightingId}
        commonName={createState.commonName ?? commonName}
        scientificName={createState.scientificName ?? scientificName}
        modelAlreadyReused={Boolean(createState.modelAlreadyReused)}
      />
    );
  }

  function onPhotoChange(file: File | null) {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    if (!file) {
      setHasPhoto(false);
      setPreviewUrl(null);
      return;
    }
    setHasPhoto(true);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function selectLocation(place: GeocodeResult) {
    locationSearchGenRef.current += 1;
    skipLocationSearchRef.current = true;
    setLocationLabel(place.label);
    setLocationQuery(place.label);
    setLat(place.lat);
    setLng(place.lng);
    setSuggestions([]);
    setLocationError(null);
  }

  function applyCustomLocation() {
    const label = locationQuery.trim();
    if (!label) {
      setLocationError("Escribe el nombre del punto (ej. Gorilla Chop, Okinawa).");
      return;
    }
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      setLocationError("Indica latitud y longitud del punto de buceo.");
      return;
    }
    setLocationLabel(label);
    setLocationError(null);
    setSuggestions([]);
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no permite geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        if (!locationQuery.trim()) {
          setLocationQuery("Mi ubicación");
        }
        setLocationError(null);
        setShowMapPicker(true);
      },
      () => {
        setLocationError("No se pudo obtener tu ubicación.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleMapPick(coords: { lat: number; lng: number }) {
    setLat(coords.lat);
    setLng(coords.lng);
    setLocationError(null);
    setSuggestions([]);

    const keepCustomName = locationQuery.trim().length > 0;
    if (keepCustomName) {
      setLocationLabel(locationQuery.trim());
      return;
    }

    startReverseGeocode(async () => {
      const { label } = await reverseGeocodeAction(coords.lat, coords.lng);
      skipLocationSearchRef.current = true;
      if (label) {
        setLocationQuery(label);
        setLocationLabel(label);
      } else {
        setLocationQuery(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        setLocationLabel(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
      }
    });
  }

  function handleIdentify() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setIdentifyState({ error: "Elige una foto del pez." });
      return;
    }

    const formData = new FormData();
    formData.set("photo", file);

    startIdentify(async () => {
      const result = await identifySightingAction({}, formData);
      setIdentifyState(result);
    });
  }

  return (
    <div className="space-y-4">
      <form action={createAction} className="space-y-4">
        <section className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 shadow-xl shadow-lagoon/15">
          <div className="h-1.5 bg-gradient-to-r from-lagoon via-tang to-biolum" />
          <div className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lagoon to-tang text-white shadow-md shadow-lagoon/30">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-ink">Foto del avistamiento</h2>
                <p className="text-sm text-slate">
                  Sube la foto y pulsa identificar para rellenar los datos
                </p>
              </div>
            </div>

            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 transition",
                hasPhoto
                  ? "border-tang/40 bg-foam-white"
                  : "border-lagoon/40 bg-gradient-to-br from-foam-white via-shell to-sand/60",
              )}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="mb-3 aspect-[4/3] w-full max-w-sm rounded-2xl object-cover"
                />
              ) : (
                <Fish className="mb-2 h-10 w-10 text-lagoon" />
              )}
              <span className="text-sm font-bold text-deep-teal">
                {hasPhoto ? "Cambiar foto" : "Elegir foto"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                name="photo"
                accept="image/*"
                capture="environment"
                className="sr-only"
                required
                onChange={(event) => {
                  onPhotoChange(event.target.files?.[0] ?? null);
                }}
              />
            </label>

            <button
              type="button"
              onClick={handleIdentify}
              disabled={!hasPhoto || identifying || creating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-parrot via-biolum to-lagoon px-4 py-3 font-bold text-ink shadow-lg shadow-parrot/25 transition active:scale-[0.99] disabled:opacity-60"
            >
              {identifying ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {identifying ? "Identificando…" : "Identificar por foto"}
            </button>

            {identifyState.error ? (
              <p
                role="alert"
                className="rounded-2xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
              >
                {identifyState.error}
              </p>
            ) : null}

            {confidenceLabel ? (
              <p className="text-xs font-semibold text-deep-teal/80">
                Sugerencia IA · {confidenceLabel}
                {idHint ? ` · ${idHint}` : ""}
              </p>
            ) : null}
          </div>
        </section>

        <input type="hidden" name="confidence" value={confidence} />
        <input type="hidden" name="locationLabel" value={locationLabel} />
        <input type="hidden" name="lat" value={lat ?? ""} />
        <input type="hidden" name="lng" value={lng ?? ""} />

        <section className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 shadow-xl shadow-coral/10">
          <div className="h-1.5 bg-gradient-to-r from-coral via-clownfish to-mango" />
          <div className="space-y-3 p-4">
            <h2 className="font-bold text-ink">Datos de la especie</h2>
            <Field
              label="Nombre común"
              name="commonName"
              value={commonName}
              onChange={setCommonName}
              required
            />
            <Field
              label="Nombre científico"
              name="scientificName"
              value={scientificName}
              onChange={setScientificName}
              required
            />
            <Field
              label="Familia"
              name="family"
              value={family}
              onChange={setFamily}
            />
            <Field
              label="Hábitat"
              name="habitat"
              value={habitat}
              onChange={setHabitat}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-ink">
                Descripción
              </span>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border-2 border-coral/15 bg-foam-white px-4 py-3 text-ink placeholder:text-mist focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/25"
              />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border-2 border-white/80 bg-shell/95 shadow-xl shadow-parrot/10">
          <div className="h-1.5 bg-gradient-to-r from-parrot via-anemone to-tang" />
          <div className="space-y-3 p-4">
            <h2 className="font-bold text-ink">Avistamiento</h2>

            <div className="block space-y-2">
              <span className="mb-1.5 block text-sm font-bold text-ink">
                Ubicación
              </span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tang" />
                <input
                  type="search"
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setLocationLabel("");
                  }}
                  placeholder="Buscar playa, punto de buceo, ciudad…"
                  className="w-full rounded-2xl border-2 border-tang/15 bg-foam-white py-3 pl-10 pr-4 text-ink placeholder:text-mist focus:border-tang focus:outline-none focus:ring-2 focus:ring-tang/25"
                  autoComplete="off"
                />
              </div>
              {searchingLocation ? (
                <p className="text-xs font-medium text-mist">
                  Buscando en Google…
                </p>
              ) : null}
              {locationError ? (
                <p className="text-xs font-medium text-coral">{locationError}</p>
              ) : null}
              {suggestions.length > 0 ? (
                <ul className="overflow-hidden rounded-2xl border border-tang/20 bg-white shadow-md">
                  {suggestions.map((place) => (
                    <li key={`${place.source}-${place.label}-${place.lat}-${place.lng}`}>
                      <button
                        type="button"
                        onClick={() => selectLocation(place)}
                        className="w-full px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-foam-white"
                      >
                        {place.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : locationQuery.trim().length >= 2 && !searchingLocation ? (
                <p className="text-xs text-mist">
                  Sin resultados en Google. Escribe el nombre del punto y usa el
                  mapa o las coordenadas.
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-ink">
                    Latitud
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={lat ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLat(value === "" ? null : Number(value));
                      setLocationLabel("");
                    }}
                    placeholder="26.443"
                    className="w-full rounded-2xl border-2 border-tang/15 bg-foam-white px-3 py-2.5 text-sm text-ink focus:border-tang focus:outline-none focus:ring-2 focus:ring-tang/25"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-ink">
                    Longitud
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={lng ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLng(value === "" ? null : Number(value));
                      setLocationLabel("");
                    }}
                    placeholder="127.772"
                    className="w-full rounded-2xl border-2 border-tang/15 bg-foam-white px-3 py-2.5 text-sm text-ink focus:border-tang focus:outline-none focus:ring-2 focus:ring-tang/25"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowMapPicker((open) => !open)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold",
                    showMapPicker
                      ? "bg-tang text-white"
                      : "bg-tang/10 text-tang",
                  )}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  {showMapPicker ? "Ocultar mapa" : "Elegir en el mapa"}
                </button>
                <button
                  type="button"
                  onClick={applyCustomLocation}
                  className="rounded-full bg-lagoon/10 px-3 py-1.5 text-xs font-bold text-deep-teal"
                >
                  Usar este punto
                </button>
                <button
                  type="button"
                  onClick={useDeviceLocation}
                  className="inline-flex items-center gap-1 rounded-full bg-parrot/10 px-3 py-1.5 text-xs font-bold text-deep-teal"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Mi GPS
                </button>
              </div>

              {showMapPicker ? (
                <div className="space-y-2">
                  <LocationMapPickerLazy
                    lat={lat}
                    lng={lng}
                    onPick={handleMapPick}
                  />
                  <p className="text-xs text-mist">
                    Escribe el nombre del punto (ej. Gorilla Chop) y tócalo en el
                    mapa para fijar las coordenadas.
                  </p>
                </div>
              ) : null}

              {locationLabel && lat != null && lng != null ? (
                <p className="text-xs font-semibold text-deep-teal/90">
                  Listo: {locationLabel} ({lat.toFixed(5)}, {lng.toFixed(5)})
                </p>
              ) : (
                <p className="text-xs text-mist">
                  Elige un resultado, el mapa, o nombre + coordenadas
                </p>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-ink">
                Fecha del avistamiento (opcional)
              </span>
              <input
                type="date"
                name="sightedAt"
                value={sightedAt}
                onChange={(e) => setSightedAt(e.target.value)}
                className="w-full rounded-2xl border-2 border-tang/15 bg-foam-white px-4 py-3 text-ink focus:border-tang focus:outline-none focus:ring-2 focus:ring-tang/25"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-ink">
                Anécdota (opcional)
              </span>
              <textarea
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={280}
                placeholder="El día que hizo mucho oleaje…"
                className="w-full rounded-2xl border-2 border-tang/15 bg-foam-white px-4 py-3 text-ink placeholder:text-mist focus:border-tang focus:outline-none focus:ring-2 focus:ring-tang/25"
              />
            </label>
          </div>
        </section>

        {createState.error ? (
          <p
            role="alert"
            className="rounded-2xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
          >
            {createState.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={creating || !hasPhoto}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-coral via-anemone to-tang px-4 py-3.5 font-bold text-white shadow-lg shadow-coral/30 transition active:scale-[0.99] disabled:opacity-60"
        >
          {creating ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Fish className="h-5 w-5" />
          )}
          {creating ? "Guardando…" : "Guardar en Pecedex"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-2xl border-2 border-coral/15 bg-foam-white px-4 py-3 text-ink placeholder:text-mist focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/25"
      />
    </label>
  );
}
