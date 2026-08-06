/** Builds an Airbnb-style price pill as an SVG data URL used for map markers. */
export const buildPricePill = (label: string, state: "default" | "active" | "visited") => {
  const width = Math.max(52, label.length * 8 + 22);
  const height = 30;
  const bg = state === "active" ? "#111111" : "#FFFFFF";
  const fg = state === "active" ? "#FFFFFF" : "#111111";
  const stroke = state === "active" ? "#111111" : "rgba(0,0,0,0.12)";
  const weight = state === "visited" ? 500 : 700;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <g>
      <rect x="1" y="1" rx="15" ry="15" width="${width - 2}" height="${height - 2}" fill="${bg}" stroke="${stroke}" stroke-width="1"/>
      <text x="${width / 2}" y="${height / 2 + 4.5}" text-anchor="middle" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-size="12.5" font-weight="${weight}" fill="${fg}">${label}</text>
    </g>
  </svg>`;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, width, height };
};

export const buildClusterPill = (count: number) => {
  const size = count > 99 ? 52 : count > 9 ? 46 : 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="#F59E0B" fill-opacity="0.25"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="#F59E0B"/>
    <text x="${size / 2}" y="${size / 2 + 4.5}" text-anchor="middle" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">${count}</text>
  </svg>`;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, size };
};
