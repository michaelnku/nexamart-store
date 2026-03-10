type Mat = {
  delete(): void;
};

type MatVector = {
  size(): number;
  get(index: number): Mat;
  delete(): void;
};

export type OpenCV = {
  onRuntimeInitialized?: () => void;

  imread(image: HTMLImageElement | HTMLCanvasElement): Mat;

  Mat: new () => Mat;
  MatVector: new () => MatVector;

  cvtColor(src: Mat, dst: Mat, code: number): void;
  Canny(src: Mat, dst: Mat, threshold1: number, threshold2: number): void;

  findContours(
    image: Mat,
    contours: MatVector,
    hierarchy: Mat,
    mode: number,
    method: number,
  ): void;

  boundingRect(contour: Mat): {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  COLOR_RGBA2GRAY: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
};

declare global {
  interface Window {
    cv: OpenCV;
  }
}

let cvReady: Promise<OpenCV> | null = null;

export function loadOpenCV(): Promise<OpenCV> {
  if (cvReady) return cvReady;

  cvReady = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.x/opencv.js";
    script.async = true;

    script.onload = () => {
      window.cv.onRuntimeInitialized = () => {
        resolve(window.cv);
      };
    };

    document.body.appendChild(script);
  });

  return cvReady;
}
