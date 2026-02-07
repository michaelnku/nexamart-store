export function createProductSlug(name: string, id: string) {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return `${safeName}-${id}`;
}
