# Cached Translations Guide

This system automatically generates and caches translations from German to 6 common languages, making them available both in the bundled code and as static JSON files on the webpage.

## Architecture

### 1. **Translation Generation** (Build-time)
- Reads German translations from `src/utils/translations.ts`
- Generates translations to: EN, FR, ES, IT, NL, PL
- Saves as JSON files to `public/translations/`
- Only regenerates if German translations have changed

### 2. **Cached Translation Files** (`public/translations/`)
```
public/translations/
├── de.json
├── en.json
├── fr.json
├── es.json
├── it.json
├── nl.json
└── pl.json
```

Each file contains a flat JSON object of key-value translation pairs:
```json
{
  "allExhibitions": "Alle Ausstellungen",
  "searchPlaceholder": "Ausstellungen, Exponate suchen...",
  ...
}
```

### 3. **Runtime Translation Loading**
The app loads translations in two ways:
- **UI Translations**: Bundled in `src/utils/translations.ts` (instant, no network)
- **Cached Translations**: Loaded from `public/translations/[lang].json` (network request)

## Usage

### Generate Translations (First Time Setup)

```bash
# Generate translations and cache them
npm run generate-translations

# Or generate AND build
npm run build:with-translations
```

### Build Without Regenerating (Recommended)

```bash
# Uses cached translations from previous generation
npm run build
```

### Using Translations in Components

#### Option 1: UI Translations Only (No Network)
```tsx
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../utils/translations';

export const MyComponent = () => {
  const { currentLanguage } = useLanguage();
  
  return <div>{t('allExhibitions', currentLanguage)}</div>;
};
```

#### Option 2: All Translations (Cached + UI, with Network)
```tsx
import { useLanguage } from '../hooks/useLanguage';
import { useAllTranslations } from '../hooks/useAllTranslations';

export const MyComponent = () => {
  const { currentLanguage } = useLanguage();
  const { t, loading } = useAllTranslations(currentLanguage);
  
  if (loading) return <div>Loading translations...</div>;
  
  return <div>{t('allExhibitions')}</div>;
};
```

#### Option 3: Just Cached Translations (From Network)
```tsx
import { useLanguage } from '../hooks/useLanguage';
import { useCachedTranslations } from '../hooks/useCachedTranslations';

export const MyComponent = () => {
  const { currentLanguage } = useLanguage();
  const { translations, loading } = useCachedTranslations(currentLanguage);
  
  if (loading) return <div>Loading...</div>;
  
  return <div>{translations?.allExhibitions || 'All Exhibitions'}</div>;
};
```

## How It Works

### First Build
1. Run `npm run generate-translations`
2. Script reads German translations from `src/utils/translations.ts`
3. Computes MD5 hash of German translations → saves to `public/translations/.hash`
4. Translates each string to target languages via MyMemory API
5. Saves JSON files to `public/translations/`

### Subsequent Builds
1. Run `npm run build`
2. Translation script is **NOT** run (no network overhead)
3. Uses previously cached translations from `public/translations/`
4. If German translations change, run `npm run generate-translations` again

## Updating Translations

### Add New German Translation
1. Edit `src/utils/translations.ts` and add to the `de` object
2. Run `npm run generate-translations`
3. New translations are auto-generated and saved to `public/translations/`

### Override a Translation
Edit the JSON file directly:
```bash
# Edit public/translations/en.json
{
  "myNewKey": "My custom English translation"
}
```

## Supported Languages

| Code | Language |
|------|----------|
| de   | German (original) |
| en   | English (British) |
| fr   | French |
| es   | Spanish |
| it   | Italian |
| nl   | Dutch |
| pl   | Polish |

## Benefits

✅ **Reduced Network**: UI translations bundled, cached translations lazily loaded
✅ **No Runtime Overhead**: Translations generated at build time
✅ **Smart Caching**: Only regenerates when German translations change
✅ **Instant Startup**: English/French/etc. available immediately
✅ **SEO Friendly**: All translations available as static JSON
✅ **CDN Compatible**: JSON files can be cached/served from CDN

## Performance Notes

- **First Build**: ~30-60 seconds (translation API calls)
- **Subsequent Builds**: <1 second (uses cache)
- **Network Request**: ~10-50KB per translation file
- **Fallback**: German text if translation fails to load

## Troubleshooting

### Translations Not Updating?
```bash
# Force regeneration
npm run generate-translations

# Then build
npm run build
```

### Translation API Timeout?
Increase delay in `scripts/generate-translations.js`:
```javascript
await new Promise(resolve => setTimeout(resolve, 100)); // Increase to 200
```

### Missing Translations?
Check if language file exists:
```bash
ls -la public/translations/
```

If missing, run generation:
```bash
npm run generate-translations
```

## Advanced: Custom Translation Service

To use a different translation API instead of MyMemory:
1. Edit `scripts/generate-translations.js`
2. Replace the `translateText()` function
3. Update `getLanguageCode()` if needed
4. Run generation and rebuild

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Generate translations
  run: npm run generate-translations
  
- name: Build
  run: npm run build
```

The cached translations will be committed to the repo, avoiding regeneration on every CI build.
