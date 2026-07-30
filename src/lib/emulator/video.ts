export const VIDEO_FILTERS = [
  { id: 0, label: "None" },
  { id: 1, label: "Scanlines (66%)" },
  { id: 2, label: "Scanlines (33%)" },
  { id: 3, label: "Scanlines (0%)" },
  { id: 4, label: "Pixellate2x" },
  { id: 5, label: "Scale2x" },
  { id: 6, label: "2xSaI" },
  { id: 7, label: "Super 2xSaI" },
  { id: 8, label: "Super Eagle" },
  { id: 9, label: "LQ2x" },
  { id: 10, label: "HQ2x" },
  { id: 11, label: "NTSC (RF)" },
  { id: 12, label: "NTSC (Composite)" },
  { id: 13, label: "NTSC (S-Video)" },
  { id: 14, label: "NTSC (RGB)" },
] as const;

export type VideoFilterId = (typeof VIDEO_FILTERS)[number]["id"];
export type VideoAspect = "corrected" | "square" | "4:3";
export type VideoScale = "fit" | "integer";

export type VideoSettings = {
  filter: VideoFilterId;
  aspect: VideoAspect;
  scale: VideoScale;
  overscan: boolean;
  hiresBlur: boolean;
};

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  filter: 0,
  aspect: "corrected",
  scale: "fit",
  overscan: false,
  hiresBlur: false,
};

const STORAGE_KEY = "bsnes-web-video-settings-v1";

export function loadVideoSettings(): VideoSettings {
  if (typeof window === "undefined") return DEFAULT_VIDEO_SETTINGS;

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "");
    return isVideoSettings(stored) ? stored : DEFAULT_VIDEO_SETTINGS;
  } catch {
    return DEFAULT_VIDEO_SETTINGS;
  }
}

export function saveVideoSettings(settings: VideoSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Display preferences are optional when storage is unavailable.
  }
}

function isVideoSettings(value: unknown): value is VideoSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<VideoSettings>;
  return (
    VIDEO_FILTERS.some(({ id }) => id === settings.filter) &&
    (settings.aspect === "corrected" ||
      settings.aspect === "square" ||
      settings.aspect === "4:3") &&
    (settings.scale === "fit" || settings.scale === "integer") &&
    typeof settings.overscan === "boolean" &&
    typeof settings.hiresBlur === "boolean"
  );
}
