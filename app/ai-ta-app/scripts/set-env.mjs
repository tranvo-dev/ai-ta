// Generates src/environments/environment.ts at build time from env vars.
// On Vercel, set API_URL in Project Settings → Environment Variables.
// Falls back to the value below for local production builds.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, '../src/environments/environment.ts');

const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

const contents = `// GENERATED FILE — produced by scripts/set-env.mjs at build time.
// Do not edit; set API_URL in the environment (e.g. Vercel) instead.
export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
};
`;

writeFileSync(target, contents);
console.log(`[set-env] apiUrl = ${apiUrl}`);
