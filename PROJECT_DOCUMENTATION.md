# Museum Rodenberg Documentation

This project is a web application for the Museum Rodenberg, providing information about exhibitions, artifacts, and media in multiple languages. The application is built with React, TypeScript, and Tailwind CSS, and uses Vite as the build tool.

## Features
- Multilingual support (English, German, Spanish, French, Italian, Dutch, Polish)
- Exhibition and artifact details
- Media viewer for images and other media
- Accessibility options
- Search functionality
- QR code scanner for artifact lookup
- Text-to-speech for content

## Project Structure
- `src/` — Main source code
  - `components/` — React components for UI
  - `content/` — JSON files with exhibition and artifact data
  - `contexts/` — React context providers (e.g., language)
  - `hooks/` — Custom React hooks
  - `types/` — TypeScript type definitions
  - `utils/` — Utility functions
- `public/translations/` — Translation files for supported languages
- `scripts/` — Utility scripts (e.g., translation generation)

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Customization
- Add or update translations in `public/translations/`.
- Update artifact and exhibition data in `src/content/`.

## License
See `LICENSE` for details.
