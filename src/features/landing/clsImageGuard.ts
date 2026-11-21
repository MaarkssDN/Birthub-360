export interface LandingImageMeta {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export function validateLandingImageDimensions(images: readonly LandingImageMeta[]): {
  clsSafe: boolean;
  invalidImages: string[];
} {
  const invalidImages: string[] = [];
  for (const img of images) {
    const validW = typeof img.width === 'number' && Number.isFinite(img.width) && img.width > 0;
    const validH = typeof img.height === 'number' && Number.isFinite(img.height) && img.height > 0;
    if (!validW || !validH || !img.alt?.trim()) {
      invalidImages.push(img.src);
    }
  }
  return {
    clsSafe: invalidImages.length === 0,
    invalidImages,
  };
}
