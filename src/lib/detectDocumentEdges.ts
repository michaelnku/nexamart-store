type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function detectDocumentEdges(
  image: HTMLImageElement,
): Promise<Rect | null> {
  const cv = window.cv;

  const src = cv.imread(image);
  const gray = new cv.Mat();
  const edges = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.Canny(gray, edges, 50, 150);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(
    edges,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE,
  );

  let largestArea = 0;
  let bestRect: Rect | null = null;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);

    const rect = cv.boundingRect(contour);

    const area = rect.width * rect.height;

    if (area > largestArea) {
      largestArea = area;
      bestRect = rect;
    }
  }

  src.delete();
  gray.delete();
  edges.delete();
  contours.delete();
  hierarchy.delete();

  return bestRect;
}
