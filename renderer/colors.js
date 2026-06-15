// Color extraction from album art via canvas

export function extractColors(imgElement) {
  return new Promise((resolve) => {
    if (!imgElement.complete || imgElement.naturalHeight === 0) {
      imgElement.onload = () => resolve(processImage(imgElement));
      imgElement.onerror = () => resolve(defaultColors());
    } else {
      resolve(processImage(imgElement));
    }
  });
}

export async function extractColorsFromUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(processImage(img));
    img.onerror = () => resolve(defaultColors());
    img.src = url;
  });
}

function processImage(imgElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const size = 50; // Downsample for performance
  canvas.width = size;
  canvas.height = size;

  try {
    ctx.drawImage(imgElement, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    // Collect color buckets
    const buckets = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Skip very dark and very light pixels
      const brightness = (r + g + b) / 3;
      if (brightness < 20 || brightness > 240) continue;

      // Quantize to reduce noise
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;

      if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
      buckets[key].r += r;
      buckets[key].g += g;
      buckets[key].b += b;
      buckets[key].count++;
    }

    // Sort by frequency
    const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);

    if (sorted.length === 0) return defaultColors();

    const primary = avgColor(sorted[0]);
    const secondary = sorted.length > 1 ? avgColor(sorted[1]) : shiftColor(primary);
    const accent = findVibrant(sorted) || shiftColor(primary);

    return {
      primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
      secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`,
      accent: `rgb(${accent.r}, ${accent.g}, ${accent.b})`,
      accentGlow: `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.5)`,
      bgPrimary: `rgba(${Math.floor(primary.r * 0.15)}, ${Math.floor(primary.g * 0.15)}, ${Math.floor(primary.b * 0.15)}, 0.95)`,
      bgSecondary: `rgba(${Math.floor(secondary.r * 0.12)}, ${Math.floor(secondary.g * 0.12)}, ${Math.floor(secondary.b * 0.12)}, 0.95)`
    };
  } catch (e) {
    console.error('Color extraction failed:', e);
    return defaultColors();
  }
}

function avgColor(bucket) {
  return {
    r: Math.round(bucket.r / bucket.count),
    g: Math.round(bucket.g / bucket.count),
    b: Math.round(bucket.b / bucket.count)
  };
}

function findVibrant(sorted) {
  for (const bucket of sorted.slice(0, 8)) {
    const c = avgColor(bucket);
    const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
    if (s > 0.3 && l > 0.25 && l < 0.75) {
      const [r, g, b] = hslToRgb(h, Math.min(s * 1.3, 1), Math.max(l, 0.45));
      return { r, g, b };
    }
  }
  return null;
}

function shiftColor(c) {
  const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
  const [r, g, b] = hslToRgb((h + 0.1) % 1, Math.max(s, 0.4), Math.max(0.35, Math.min(0.65, l)));
  return { r, g, b };
}

function defaultColors() {
  return {
    primary: 'rgb(140, 60, 90)',
    secondary: 'rgb(60, 40, 80)',
    accent: 'rgb(200, 80, 120)',
    accentGlow: 'rgba(200, 80, 120, 0.5)',
    bgPrimary: 'rgba(20, 8, 12, 0.95)',
    bgSecondary: 'rgba(8, 5, 10, 0.95)'
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
