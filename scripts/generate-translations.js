#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.LIBRETRANSLATE_API_KEY;
const API_URL = process.env.LIBRETRANSLATE_API_URL || 'http://localhost:5000/translate';

function getHash(text) {
  // Using v2 prefix to identify LibreTranslate translations
  // Uses SHA-256 to match the Web Crypto implementation in translationUtils.ts
  return crypto.createHash('sha256').update('v2:' + (text || '')).digest('hex');
}

const TARGET_LANGUAGES = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  nl: 'Dutch',
  pl: 'Polish',
};

const TRANSLATIONS_DIR = path.join(__dirname, '../public/translations');
const CONTENT_DIR = path.join(__dirname, '../src/content');
const CACHE_FILE = path.join(TRANSLATIONS_DIR, 'translation-memory.json');

if (!fs.existsSync(TRANSLATIONS_DIR)) {
  fs.mkdirSync(TRANSLATIONS_DIR, { recursive: true });
}

const translationCache = new Map();
if (fs.existsSync(CACHE_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    for (const [key, value] of Object.entries(data)) {
      translationCache.set(key, value);
    }
  } catch (e) {}
}

function saveCache() {
  const data = Object.fromEntries(translationCache);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let lastCallTime = 0;
async function translateText(text, targetLanguage) {
  if (!text || typeof text !== 'string' || text.trim() === '') return { text, cached: false };
  
  const cacheKey = `${text}|${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return { text: translationCache.get(cacheKey), cached: true };
  }
  
  // Rate limit: 20/min = 1 every 3s. 
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  if (timeSinceLastCall < 3100) {
    await sleep(3100 - timeSinceLastCall);
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'de',
        target: targetLanguage,
        format: 'text',
        api_key: API_KEY
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    lastCallTime = Date.now();

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`LibreTranslate Error: ${response.status} ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    const result = data.translatedText;
    
    translationCache.set(cacheKey, result);
    saveCache(); 
    return { text: result, cached: false };
  } catch (err) {
    if (err.message.includes('429')) {
      console.log('\r\x1b[K      Rate limited. Waiting 30 seconds...');
      await sleep(30000);
      return translateText(text, targetLanguage);
    }
    return { text, cached: false };
  }
}

function drawProgressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((width * current) / total);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total})`);
}

async function translateUIStrings() {
  const deFilePath = path.join(TRANSLATIONS_DIR, 'de.json');
  if (!fs.existsSync(deFilePath)) {
    console.error('❌ de.json not found in public/translations/');
    return;
  }
  
  const deTranslations = JSON.parse(fs.readFileSync(deFilePath, 'utf-8'));
  const hashFilePath = path.join(TRANSLATIONS_DIR, 'ui-hashes.json');
  let uiHashes = {};
  if (fs.existsSync(hashFilePath)) {
    try { uiHashes = JSON.parse(fs.readFileSync(hashFilePath, 'utf-8')); } catch (e) {}
  }

  const languages = Object.keys(TARGET_LANGUAGES);
  const uiKeys = Object.keys(deTranslations);
  const totalUISteps = languages.length * uiKeys.length;
  let currentStep = 0;

  console.log('🌍 Syncing UI Strings...');

  for (const langCode of languages) {
    const filePath = path.join(TRANSLATIONS_DIR, `${langCode}.json`);
    let langTranslations = {};
    if (fs.existsSync(filePath)) {
      try { langTranslations = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch (e) {}
    }
    
    let updated = false;

    for (const key of uiKeys) {
      currentStep++;
      const value = deTranslations[key];
      const currentHash = getHash(value);
      const previousHash = uiHashes[key];
      
      let result;
      let method = '';

      if (langTranslations[key] && langTranslations[key] !== value && currentHash === previousHash) {
        result = { text: langTranslations[key], cached: true };
        method = '(disk-cache)';
      } else {
        process.stdout.write('\r\x1b[K');
        console.log(`    [UI:${langCode}] "${key}"... translating`);
        result = await translateText(value, langCode);
        method = result.cached ? '(mem-cache)' : '(translated)';
        if (result.text !== value) {
          langTranslations[key] = result.text;
          updated = true;
        }
      }

      process.stdout.write('\r\x1b[K');
      console.log(`    [UI:${langCode}] "${key}" -> ${result.text.substring(0, 30)}${result.text.length > 30 ? '...' : ''} ${method}`);
      drawProgressBar(currentStep, totalUISteps);
    }
    
    if (updated || !fs.existsSync(filePath)) {
      // Sort keys alphabetically before saving
      const sorted = Object.keys(langTranslations).sort().reduce((acc, key) => {
        acc[key] = langTranslations[key];
        return acc;
      }, {});
      fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2));
    }
  }

  const newHashes = {};
  for (const [key, value] of Object.entries(deTranslations)) {
    newHashes[key] = getHash(value);
  }
  fs.writeFileSync(hashFilePath, JSON.stringify(newHashes, null, 2));
  console.log('\n✅ UI Strings complete.\n');
}

async function translateContent() {
  const files = ['exhibitions.json', 'artifacts.json'];
  
  for (const filename of files) {
    const filePath = path.join(CONTENT_DIR, filename);
    if (!fs.existsSync(filePath)) continue;
    
    console.log(`📦 Processing ${filename}...`);
    let content;
    try {
      content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) { continue; }

    const items = content.exhibitions || content.artifacts;
    const itemEntries = Object.entries(items);
    const languages = Object.keys(TARGET_LANGUAGES);
    const fields = ['title', 'subtitle', 'description', 'significance', 'period'];
    const totalOps = itemEntries.length * (fields.length + 1) * languages.length;
    let currentOp = 0;

    for (const [id, item] of itemEntries) {
      if (!item.translations || !item.translations.de) {
        currentOp += (fields.length + 1) * languages.length;
        continue;
      }
      
      const deSource = item.translations.de;
      if (!item._hashes) item._hashes = {};

      for (const field of fields) {
        const deValue = deSource[field];
        const currentHash = getHash(deValue);

        for (const langCode of languages) {
          currentOp++;
          if (!item.translations[langCode]) item.translations[langCode] = {};
          const target = item.translations[langCode];
          
          let result;
          let method = '';

          if (deValue && target[field] && target[field] !== deValue && item._hashes[field] === currentHash) {
            result = { text: target[field], cached: true };
            method = '(disk-cache)';
          } else if (deValue) {
            process.stdout.write('\r\x1b[K');
            console.log(`    [${id}] [${langCode}] ${field}... translating`);
            result = await translateText(deValue, langCode);
            method = result.cached ? '(mem-cache)' : '(translated)';
            if (result.text !== deValue) {
              target[field] = result.text;
              fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            }
          } else {
            result = { text: '', cached: true };
            method = '(empty)';
          }
          
          process.stdout.write('\r\x1b[K');
          console.log(`    [${id}] [${langCode}] ${field} -> ${result.text.substring(0, 30)}... ${method}`);
          drawProgressBar(currentOp, totalOps);
        }
        if (deValue) item._hashes[field] = currentHash;
      }

      const deMD = item.detailedContent?.de;
      const currentMDHash = getHash(deMD);

      for (const langCode of languages) {
        currentOp++;
        if (!item.detailedContent) item.detailedContent = {};
        const targetMD = item.detailedContent[langCode];
        
        if (deMD && targetMD && targetMD !== deMD && item._hashes.detailedContent === currentMDHash) {
          process.stdout.write('\r\x1b[K');
          console.log(`    [${id}] [${langCode}] detailedContent -> (disk-cache)`);
        } else if (deMD) {
          process.stdout.write('\r\x1b[K');
          console.log(`    [${id}] [${langCode}] detailedContent... translating chunks`);
          const chunks = deMD.split('\n\n');
          const translatedChunks = [];
          let mdUpdated = false;
          
          for (const chunk of chunks) {
            if (chunk.trim()) {
              const mediaMatch = chunk.match(/^\[(Audio|Video):.*?\]\(.*?\)$/);
              if (mediaMatch) {
                translatedChunks.push(chunk);
                continue;
              }
              const result = await translateText(chunk, langCode);
              translatedChunks.push(result.text);
              if (result.text !== chunk) mdUpdated = true;
            } else {
              translatedChunks.push('');
            }
          }
          if (mdUpdated) {
            item.detailedContent[langCode] = translatedChunks.join('\n\n');
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            console.log(`    [${id}] [${langCode}] detailedContent -> updated.`);
          }
        }
        drawProgressBar(currentOp, totalOps);
      }
      if (deMD) item._hashes.detailedContent = currentMDHash;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    }
    console.log(`\n✅ ${filename} complete.\n`);
  }
}

async function run() {
  await translateUIStrings();
  await translateContent();
  console.log('\n✅ All translations complete.');
}

run().catch(console.error);
