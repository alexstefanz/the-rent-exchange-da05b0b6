/** Builds an Airbnb-style price pill as an SVG data URL used for map markers. */
export const buildPricePill = (
  label: string,
  state: "default" | "active" | "visited" = "default",
) => {
  const padX = 12;
  const textW = label.length * 7.3;
  const innerW = Math.max(44, Math.round(textW + padX * 2));
  const innerH = 32;
  const pad = 8; // room for the drop shadow
  const width = innerW + pad * 2;
  const height = innerH + pad * 2;

  const bg = state === "active" ? "#111111" : "#FFFFFF";
  const fg = state === "active" ? "#FFFFFF" : "#111111";
  const weight = state === "visited" ? 500 : 700;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.28"/>
      </filter>
    </defs>
    <g filter="url(#s)">
      <rect x="${pad}" y="${pad}" rx="${innerH / 2}" ry="${innerH / 2}" width="${innerW}" height="${innerH}" fill="${bg}"/>
    </g>
    <text x="${width / 2}" y="${height / 2 + 4.6}" text-anchor="middle" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-size="13" font-weight="${weight}" fill="${fg}">${label}</text>
  </svg>`;

  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, width, height };
};

export const buildClusterPill = (count: number) => {
  const inner = count > 99 ? 46 : count > 9 ? 42 : 38;
  const pad = 8;
  const size = inner + pad * 2;
  const c = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <filter id="cs" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.28"/>
      </filter>
    </defs>
    <g filter="url(#cs)">
      <circle cx="${c}" cy="${c}" r="${inner / 2}" fill="#FFFFFF"/>
    </g>
    <text x="${c}" y="${c + 4.8}" text-anchor="middle" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-size="13.5" font-weight="700" fill="#111111">${count}</text>
  </svg>`;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, size };
};
