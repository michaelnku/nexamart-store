type MatInstance = {
  rows: number;
  cols: number;
  delete(): void;
};

type MatVectorInstance = {
  size(): number;
  get(index: number): MatInstance;
  delete(): void;
};

type SizeInstance = {
  width: number;
  height: number;
};

export type OpenCV = {
  onRuntimeInitialized?: () => void;

  Mat: new () => MatInstance;
  MatVector: new () => MatVectorInstance;
  Size: new (width: number, height: number) => SizeInstance;

  imread(source: HTMLImageElement | HTMLCanvasElement): MatInstance;
  cvtColor(src: MatInstance, dst: MatInstance, code: number): void;
  GaussianBlur(
    src: MatInstance,
    dst: MatInstance,
    ksize: SizeInstance,
    sigmaX: number,
    sigmaY: number,
    borderType: number,
  ): void;
  Canny(
    src: MatInstance,
    dst: MatInstance,
    threshold1: number,
    threshold2: number,
  ): void;
  findContours(
    image: MatInstance,
    contours: MatVectorInstance,
    hierarchy: MatInstance,
    mode: number,
    method: number,
  ): void;
  arcLength(curve: MatInstance, closed: boolean): number;
  approxPolyDP(
    curve: MatInstance,
    approxCurve: MatInstance,
    epsilon: number,
    closed: boolean,
  ): void;
  contourArea(contour: MatInstance): number;
  boundingRect(contour: MatInstance): {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  COLOR_RGBA2GRAY: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  BORDER_DEFAULT: number;
};

declare global {
  interface Window {
    cv?: OpenCV;
  }
}

const OPENCV_SCRIPT_ID = "opencv-js-script";
const OPENCV_SRC = "https://docs.opencv.org/4.x/opencv.js";

let openCvPromise: Promise<OpenCV> | null = null;

function resolveWhenReady(
  resolve: (value: OpenCV) => void,
  reject: (reason?: unknown) => void,
) {
  const cv = window.cv;

  if (!cv) {
    reject(new Error("OpenCV failed to initialize."));
    return;
  }

  const existingInitializer = cv.onRuntimeInitialized;

  cv.onRuntimeInitialized = () => {
    existingInitializer?.();
    resolve(cv);
  };

  if (typeof cv.Mat === "function" && typeof cv.imread === "function") {
    resolve(cv);
  }
}

export function loadOpenCV(): Promise<OpenCV> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV can only be loaded in the browser."));
  }

  if (window.cv && typeof window.cv.Mat === "function") {
    return Promise.resolve(window.cv);
  }

  if (openCvPromise) {
    return openCvPromise;
  }

  openCvPromise = new Promise<OpenCV>((resolve, reject) => {
    const existingScript = document.getElementById(
      OPENCV_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    const handleLoad = () => resolveWhenReady(resolve, reject);
    const handleError = () => {
      openCvPromise = null;
      reject(new Error("Failed to load OpenCV."));
    };

    if (existingScript) {
      if (window.cv) {
        handleLoad();
        return;
      }

      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = OPENCV_SCRIPT_ID;
    script.src = OPENCV_SRC;
    script.async = true;
    script.onload = handleLoad;
    script.onerror = handleError;
    document.body.appendChild(script);
  });

  return openCvPromise;
}
