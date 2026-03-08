export async function fetchImageBuffer(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch uploaded document");
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}
