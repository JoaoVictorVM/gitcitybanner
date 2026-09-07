export interface Palette {
  sky: string;
  ground: string;
  building: string;
  windows: [string, string, string, string, string];
}

const FALLBACK_PALETTE: Palette = {
  sky: "#0b1220",
  ground: "#060a12",
  building: "#131c2a",
  windows: ["#1b2733", "#4a3b1e", "#8a6a22", "#d1a02e", "#ffd76a"],
};

function readProperty(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

export function resolvePalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const windows = FALLBACK_PALETTE.windows.map((fallback, level) =>
    readProperty(styles, `--window-${level}`, fallback),
  ) as [string, string, string, string, string];

  return {
    sky: readProperty(styles, "--sky", FALLBACK_PALETTE.sky),
    ground: readProperty(styles, "--ground", FALLBACK_PALETTE.ground),
    building: readProperty(styles, "--building", FALLBACK_PALETTE.building),
    windows,
  };
}
