export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generateSlug(displayName: string): string {
  const base = slugify(displayName)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}
