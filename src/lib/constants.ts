export const APP_NAME = "Pecedex";
export const OWNERS = "Aurora y Rafa";
export const REEF_TITLE = "Arrecife de Aurora y Rafa";
export const FOOTER_CREDIT = "Pecedex · Aurora & Rafa";
export const APP_DESCRIPTION =
  "Bitácora de fauna marina de Aurora y Rafa. Galería tropical, mapa interactivo y modelos 3D.";

export const NAV_ITEMS = [
  { href: "/", label: "Galería", icon: "fish" as const },
  { href: "/recuerdos", label: "Recuerdos", icon: "camera" as const },
  { href: "/mapa", label: "Mapa", icon: "map" as const },
  { href: "/admin/anadir", label: "Añadir", icon: "plus" as const },
] as const;

export const SORT_OPTIONS = [
  { value: "registeredAt", label: "Por registro" },
  { value: "location", label: "Por ubicación" },
] as const;

export type SortBy = (typeof SORT_OPTIONS)[number]["value"];

/** Estilo vectorial gratuito (OpenFreeMap + MapLibre). */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export const TROPICAL_COLORS = {
  sky: "#87CEEB",
  lagoon: "#00B4D8",
  reef: "#0077B6",
  deepTeal: "#023E8A",
  sand: "#FFF8F0",
  shell: "#FFFFFF",
  foamWhite: "#F0FAFF",
  coral: "#FF6B6B",
  parrot: "#06D6A0",
  clownfish: "#FF9F1C",
  anemone: "#FF006E",
  tang: "#4361EE",
  biolum: "#00F5D4",
  ink: "#1A1A2E",
  slate: "#4A5568",
  mist: "#718096",
} as const;
