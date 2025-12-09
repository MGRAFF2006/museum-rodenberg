# Translation System Quick Reference

## One-Time Setup
```bash
npm run generate-translations
```
This generates all translation files and caches them. Only run this when:
- Setting up the project for the first time
- Adding new translations to German
- Updating existing German translations

## Regular Build
```bash
npm run build
```
Uses cached translations - no network calls, instant build!

## Supported Languages
- 🇩🇪 German (de) - source
- 🇬🇧 English (en)
- 🇫🇷 French (fr)
- 🇪🇸 Spanish (es)
- 🇮🇹 Italian (it)
- 🇳🇱 Dutch (nl)
- 🇵🇱 Polish (pl)

## Using Translations in Components

### For UI strings (bundled in app):
```tsx
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../utils/translations';

const { currentLanguage } = useLanguage();
return <h1>{t('museumTitle', currentLanguage)}</h1>;
```

### For content strings (cached from server):
```tsx
import { useLanguage } from '../hooks/useLanguage';
import { useAllTranslations } from '../hooks/useAllTranslations';

const { currentLanguage } = useLanguage();
const { t, loading } = useAllTranslations(currentLanguage);

if (loading) return <div>Loading...</div>;
return <h1>{t('museumTitle')}</h1>;
```

## File Locations
```
src/
  utils/
    translations.ts          ← Edit German here
  hooks/
    useLanguage.ts           ← Get current language
    useAllTranslations.ts    ← Load cached + bundled translations
    useCachedTranslations.ts ← Load only cached translations

public/
  translations/              ← Cached JSON files (served to browser)
    de.json
    en.json
    fr.json
    es.json
    it.json
    nl.json
    pl.json
```

## Workflow Examples

### Adding a new translation:
1. Edit `src/utils/translations.ts`, add to `de` object
2. Run `npm run generate-translations`
3. Use `useAllTranslations()` to access it

### Quick deploy (after setup):
1. Run `npm run build` (instant, uses cache)
2. Deploy

### Full regeneration (e.g., translation service change):
1. Run `npm run generate-translations`
2. Run `npm run build`
3. Commit updated JSON files to git

## Translation Files Available Programmatically
The JSON files at `public/translations/[lang].json` are automatically served by your web server and can be:
- Fetched via JavaScript: `fetch('/translations/en.json')`
- Cached by browsers: Static files with long cache headers
- Served from CDN: Copy entire public folder to CDN
- Indexed by search engines: Text content visible in JSON

## Performance
- **First setup**: ~30-60s (API calls to translate)
- **Regular builds**: <1s (no network)
- **App startup**: Instant (UI translations bundled)
- **Content loading**: ~10-50KB per language (lazy loaded)

## Troubleshooting
```bash
# Translations won't update?
npm run generate-translations

# See what's cached
cat public/translations/.hash

# Delete cache and regenerate
rm -rf public/translations/*.json
npm run generate-translations

# Check available languages
ls public/translations/
```
