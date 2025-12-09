#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Target languages for translation
const TARGET_LANGUAGES = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
};

const CACHE_DIR = path.join(__dirname, '../public/translations');
const HASH_FILE = path.join(CACHE_DIR, '.hash');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Cache for translations to avoid redundant API calls
const translationCache = new Map();

// Simple translation using free translation API with caching
async function translateText(text, targetLanguage) {
  const cacheKey = `${text}|${targetLanguage}`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  
  // Using MyMemory Translation API (free, no key required)
  const encodedText = encodeURIComponent(text);
  const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=de|${getLanguageCode(targetLanguage)}`;
  
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.error(`Timeout translating: ${text.substring(0, 30)}...`);
      resolve(text); // Return original on timeout
    }, 5000);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        clearTimeout(timeoutId);
        try {
          const parsed = JSON.parse(data);
          if (parsed.responseStatus === 200 && parsed.responseData?.translatedText) {
            const result = parsed.responseData.translatedText;
            translationCache.set(cacheKey, result);
            resolve(result);
          } else {
            resolve(text);
          }
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', (err) => {
      clearTimeout(timeoutId);
      console.error(`API error:`, err.message);
      resolve(text); // Return original on error
    });
  });
}

function getLanguageCode(lang) {
  const codes = {
    en: 'en-GB',
    fr: 'fr',
    es: 'es',
    it: 'it',
    nl: 'nl',
    pl: 'pl',
  };
  return codes[lang] || lang;
}

function computeHash(deTranslations) {
  const content = JSON.stringify(deTranslations);
  return crypto.createHash('md5').update(content).digest('hex');
}

function hashHasChanged(deTranslations) {
  const currentHash = computeHash(deTranslations);
  
  if (!fs.existsSync(HASH_FILE)) {
    return true;
  }
  
  const savedHash = fs.readFileSync(HASH_FILE, 'utf-8').trim();
  return currentHash !== savedHash;
}

function saveHash(deTranslations) {
  const currentHash = computeHash(deTranslations);
  fs.writeFileSync(HASH_FILE, currentHash);
}

async function generateTranslations() {
  console.log('🌍 Checking for cached translations...\n');
  
  const translationsFilePath = path.join(__dirname, '../src/utils/translations.ts');
  
  // Read the current translations file
  const fileContent = fs.readFileSync(translationsFilePath, 'utf-8');
  
  // Extract German translations
  const deMatch = fileContent.match(/de:\s*\{([\s\S]*?)\n  \},/);
  if (!deMatch) {
    console.error('Could not find German translations in translations.ts');
    process.exit(1);
  }
  
  // Parse German translations
  const deTranslations = {};
  const lines = deMatch[1].split('\n');
  
  for (const line of lines) {
    const match = line.trim().match(/^(\w+):\s*['"](.+?)['"],?\s*$/);
    if (match) {
      deTranslations[match[1]] = match[2];
    }
  }
  
  console.log(`Found ${Object.keys(deTranslations).length} German translations`);
  
  // Check if translations have changed
  if (!hashHasChanged(deTranslations)) {
    console.log('✅ Translations are up to date. Using cached version.\n');
    return;
  }
  
  console.log('\n📝 German translations changed. Regenerating all translations...\n');
  
  // Generate translations for each language
  const translationsByLang = {};
  
  for (const [langCode, langName] of Object.entries(TARGET_LANGUAGES)) {
    console.log(`Translating to ${langName}...`);
    translationsByLang[langCode] = {};
    
    let count = 0;
    for (const [key, value] of Object.entries(deTranslations)) {
      try {
        const translated = await translateText(value, langCode);
        translationsByLang[langCode][key] = translated;
        count++;
        if (count % 5 === 0) process.stdout.write('.');
      } catch (error) {
        console.error(`Error translating ${key}:`, error);
        translationsByLang[langCode][key] = value;
      }
      
      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    console.log(` ✓ (${count}/${Object.keys(deTranslations).length})\n`);
  }
  
  // Save translations as JSON files in public directory
  console.log('\n💾 Saving translations to public/translations/...');
  
  for (const [langCode, langTranslations] of Object.entries(translationsByLang)) {
    const filePath = path.join(CACHE_DIR, `${langCode}.json`);
    fs.writeFileSync(filePath, JSON.stringify(langTranslations, null, 2));
    console.log(`   ✓ ${langCode}.json`);
  }
  
  // Also save German translations
  const dePath = path.join(CACHE_DIR, 'de.json');
  fs.writeFileSync(dePath, JSON.stringify(deTranslations, null, 2));
  console.log(`   ✓ de.json`);
  
  // Save hash to prevent regeneration
  saveHash(deTranslations);
  
  console.log('\n✅ All translations generated and cached!\n');
}

// Run the translation generation
generateTranslations().catch((error) => {
  console.error('Error generating translations:', error);
  process.exit(1);
});
