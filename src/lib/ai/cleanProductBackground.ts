import OpenAI, { toFile } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const CLEAN_BACKGROUND_PROMPT =
  "Replace the background of this product photo with a clean professional studio background. Use pure white or a very light neutral tone. Preserve the product exactly as it is, including color, texture, edges, labels, reflections, shadows, and proportions. Do not modify the product. Do not add objects, props, text, branding, or extra elements. Keep lighting realistic and natural. A subtle grounded studio shadow is allowed.";

type CleanProductBackgroundInput = {
  dataUrl: string;
  fileName?: string;
  mimeType?: string;
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid image payload.");
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  return "webp";
}

export async function cleanProductBackground({
  dataUrl,
  fileName,
  mimeType,
}: CleanProductBackgroundInput) {
  const parsed = parseDataUrl(dataUrl);
  const inputMimeType = mimeType ?? parsed.mimeType;
  const imageBuffer = Buffer.from(parsed.base64, "base64");

  const imageFile = await toFile(
    imageBuffer,
    fileName ?? `product-source.${extensionFromMimeType(inputMimeType)}`,
    {
      type: inputMimeType,
    },
  );

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt: CLEAN_BACKGROUND_PROMPT,
    size: "1024x1024",
    quality: "medium",
    output_format: "webp",
    background: "opaque",
  });

  const image = response.data?.[0];
  const editedBase64 = image?.b64_json;

  if (!editedBase64) {
    throw new Error("OpenAI did not return an edited image.");
  }

  return {
    mimeType: "image/webp",
    dataUrl: `data:image/webp;base64,${editedBase64}`,
  };
}
