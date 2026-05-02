import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const INTERNAL_URL_BASE = "https://mandys.local";

const collapsePathSlashes = (value: string) => value.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
const decodeRoutePath = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const normalizeRoutePath = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function sanitizeInternalPath(path: string | null | undefined, fallback = "/") {
  if (typeof path !== "string") return fallback;

  const trimmed = path.trim();
  if (!trimmed || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(trimmed)) {
    return fallback;
  }

  try {
    const candidate = new URL(trimmed, INTERNAL_URL_BASE);
    if (candidate.origin !== INTERNAL_URL_BASE) {
      return fallback;
    }

    const normalizedPath = normalizeRoutePath(collapsePathSlashes(decodeRoutePath(candidate.pathname)));
    if (!normalizedPath.startsWith("/")) {
      return fallback;
    }

    return normalizedPath === "/" ? normalizedPath : normalizedPath.replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

export function sanitizeExternalUrl(url: string | null | undefined, fallback = "#") {
  if (typeof url !== "string") return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (trimmed === "#") return fallback;

  try {
    const candidate = new URL(trimmed);
    if (candidate.protocol === "http:" || candidate.protocol === "https:") {
      return candidate.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
}
