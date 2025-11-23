/**
 * Generates a shimmer effect as a blur placeholder for images
 * This creates a smooth loading animation while images are being fetched
 */
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#1a1a1a" offset="20%" />
      <stop stop-color="#2a2a2a" offset="50%" />
      <stop stop-color="#1a1a1a" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#1a1a1a" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
    typeof window === 'undefined'
        ? Buffer.from(str).toString('base64')
        : window.btoa(str);

/**
 * Generate a blur data URL for image placeholders
 * @param w - Width of the placeholder
 * @param h - Height of the placeholder
 * @returns Base64 encoded data URL
 */
export const getBlurDataURL = (w: number = 700, h: number = 700) => {
    return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
};
