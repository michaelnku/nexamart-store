import { loadOpenCV, type OpenCV } from "@/lib/opencvLoader";

export type DocumentCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DocumentDetectionResult = {
  crop: DocumentCropRect;
};

function cleanupMats(mats: Array<{ delete(): void } | null | undefined>) {
  for (const mat of mats) {
    if (mat) {
      mat.delete();
    }
  }
}

function normalizeCrop(
  rect: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
): DocumentCropRect | null {
  const paddingX = Math.round(rect.width * 0.03);
  const paddingY = Math.round(rect.height * 0.03);

  const x = Math.max(0, rect.x - paddingX);
  const y = Math.max(0, rect.y - paddingY);
  const right = Math.min(imageWidth, rect.x + rect.width + paddingX);
  const bottom = Math.min(imageHeight, rect.y + rect.height + paddingY);
  const width = right - x;
  const height = bottom - y;

  if (width <= 0 || height <= 0) {
    return null;
  }

  const imageArea = imageWidth * imageHeight;
  const cropArea = width * height;
  const minCoverage = imageArea * 0.2;

  if (cropArea < minCoverage) {
    return null;
  }

  return { x, y, width, height };
}

export async function detectDocumentEdges(
  image: HTMLImageElement | HTMLCanvasElement,
): Promise<DocumentDetectionResult | null> {
  const cv: OpenCV = await loadOpenCV();

  let source: InstanceType<OpenCV["Mat"]> | null = null;
  let gray: InstanceType<OpenCV["Mat"]> | null = null;
  let blurred: InstanceType<OpenCV["Mat"]> | null = null;
  let edges: InstanceType<OpenCV["Mat"]> | null = null;
  let contours: InstanceType<OpenCV["MatVector"]> | null = null;
  let hierarchy: InstanceType<OpenCV["Mat"]> | null = null;

  try {
    source = cv.imread(image);
    gray = new cv.Mat();
    blurred = new cv.Mat();
    edges = new cv.Mat();
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();

    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(
      gray,
      blurred,
      new cv.Size(5, 5),
      0,
      0,
      cv.BORDER_DEFAULT,
    );
    cv.Canny(blurred, edges, 75, 200);

    cv.findContours(
      edges,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );

    let bestRect: DocumentCropRect | null = null;
    let bestArea = 0;

    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index);

      try {
        const perimeter = cv.arcLength(contour, true);
        const approx = new cv.Mat();

        try {
          cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

          const isQuadrilateral = approx.rows === 4;
          const area = cv.contourArea(contour);

          if (!isQuadrilateral || area <= bestArea) {
            continue;
          }

          const rect = cv.boundingRect(approx);
          const normalized = normalizeCrop(
            rect,
            "naturalWidth" in image ? image.naturalWidth : image.width,
            "naturalHeight" in image ? image.naturalHeight : image.height,
          );

          if (!normalized) {
            continue;
          }

          const aspectRatio = normalized.width / normalized.height;
          const isReasonableAspect = aspectRatio > 1.1 && aspectRatio < 1.9;

          if (!isReasonableAspect) {
            continue;
          }

          bestArea = area;
          bestRect = normalized;
        } finally {
          approx.delete();
        }
      } finally {
        contour.delete();
      }
    }

    return bestRect ? { crop: bestRect } : null;
  } finally {
    cleanupMats([source, gray, blurred, edges, contours, hierarchy]);
  }
}
