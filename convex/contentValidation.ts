export function validateContentInput(
  slug: string,
  translations: Array<{ language: string; title: string }>
): void {
  // Keep existing mixed-case/underscore IDs, but reject route syntax and the
  // editor's reserved creation ID instead of silently normalizing identity.
  if (!/^[A-Za-z0-9_-]+$/.test(slug) || slug === "new") {
    throw new Error("Content ID must use letters, numbers, hyphens or underscores and cannot be 'new'");
  }
  const german = translations.filter((translation) => translation.language === "de");
  if (!german.length || german.some((translation) => !translation.title.trim())) {
    throw new Error("A nonempty German title is required");
  }
}
