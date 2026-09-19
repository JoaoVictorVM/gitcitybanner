export interface Palette {
  sky: string;
  ground: string;
  building: string;
  roof: string;
  windows: [string, string, string, string, string];
}

const FALLBACK_PALETTE: Palette = {
  sky: "#0b1220",
  ground: "#060a12",
  building: "#131c2a",
  roof: "#1b2536",
  windows: ["#1b2733", "#033a16", "#196c2e", "#2ea043", "#56d364"],
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
    roof: readProperty(styles, "--roof", FALLBACK_PALETTE.roof),
    windows,
  };
}
