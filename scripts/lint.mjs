import { readFile } from 'node:fs/promises';

const files = ['index.html', 'src/main.js', 'src/style.css', 'vite.config.js'];
const contents = new Map(await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')])));
const errors = [];

for (const [file, source] of contents) {
  if (source.includes('\t')) errors.push(`${file}: tabs are not allowed`);
  if (source.includes('debugger')) errors.push(`${file}: debugger statement found`);
  if (source.includes('TODO')) errors.push(`${file}: TODO marker found`);
}

const html = contents.get('index.html');
for (const id of ['video', 'overlay', 'status', 'camera-toggle', 'retry-button']) {
  if (!html.includes(`id="${id}"`)) errors.push(`index.html: missing required #${id}`);
}

const source = contents.get('src/main.js');
for (const token of ['MAX_PARTICLES', 'getUserMedia', 'stopCamera', 'friendlyCameraError']) {
  if (!source.includes(token)) errors.push(`src/main.js: missing ${token}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Lint passed: ${files.length} files checked.`);
