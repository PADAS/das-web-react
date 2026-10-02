import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CHROME_PATH = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ICO_SIZES = [16, 32, 48];
const PUBLIC_DIRECTORY = join(import.meta.dirname, '..', 'public');
const SOURCES_DIRECTORY = join(import.meta.dirname, 'app-icons');

const FAVICON_SOURCE = join(PUBLIC_DIRECTORY, 'favicon.svg');
const ICON_SOURCE = join(SOURCES_DIRECTORY, 'icon.svg');
const MASKABLE_ICON_SOURCE = join(SOURCES_DIRECTORY, 'icon-maskable.svg');

const APP_ICONS = [
  { name: 'apple-touch-icon.png', size: 180, source: MASKABLE_ICON_SOURCE },
  { name: 'icon-192.png', size: 192, source: ICON_SOURCE },
  { name: 'icon-512.png', size: 512, source: ICON_SOURCE },
  { name: 'icon-maskable-512.png', size: 512, source: MASKABLE_ICON_SOURCE },
];
const ICO_ICONS = ICO_SIZES.map((size) => ({ name: `favicon-${size}.png`, size, source: FAVICON_SOURCE }));

const toSvgDataUrl = (path) => `data:image/svg+xml;base64,${readFileSync(path).toString('base64')}`;

// Chrome rasterizes them, so the PNGs match what browsers draw from the SVGs.
const renderPngs = (icons) => {
  const jobs = icons.map((icon) => ({ name: icon.name, size: icon.size, source: toSvgDataUrl(icon.source) }));
  const page = `<script>
    Promise.all(${JSON.stringify(jobs)}.map((job) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = job.size;
        canvas.getContext('2d').drawImage(image, 0, 0, job.size, job.size);
        resolve([job.name, canvas.toDataURL('image/png').split(',')[1]]);
      };
      image.src = job.source;
    }))).then((results) => {
      const output = document.createElement('pre');
      output.id = 'output';
      output.textContent = JSON.stringify(Object.fromEntries(results));
      document.body.append(output);
    });
  </script>`;

  const dom = execFileSync(
    CHROME_PATH,
    [
      '--headless',
      '--disable-gpu',
      '--virtual-time-budget=5000',
      '--dump-dom',
      `data:text/html;base64,${Buffer.from(page).toString('base64')}`,
    ],
    { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }
  ).toString();
  const pngsByName = JSON.parse(dom.match(/<pre id="output">([\s\S]*?)<\/pre>/)[1]);

  return Object.fromEntries(Object.entries(pngsByName).map(([name, base64]) => [name, Buffer.from(base64, 'base64')]));
};

// An ICO is a 6-byte header and a 16-byte entry per image, then the PNGs.
const buildIco = (pngs) => {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  let offset = header.length;
  pngs.forEach((png, index) => {
    const entryOffset = 6 + index * 16;
    header.writeUInt8(ICO_SIZES[index], entryOffset);
    header.writeUInt8(ICO_SIZES[index], entryOffset + 1);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(png.length, entryOffset + 8);
    header.writeUInt32LE(offset, entryOffset + 12);
    offset += png.length;
  });

  return Buffer.concat([header, ...pngs]);
};

const pngsByName = renderPngs([...APP_ICONS, ...ICO_ICONS]);

APP_ICONS.forEach((icon) => writeFileSync(join(PUBLIC_DIRECTORY, icon.name), pngsByName[icon.name]));
writeFileSync(join(PUBLIC_DIRECTORY, 'favicon.ico'), buildIco(ICO_ICONS.map((icon) => pngsByName[icon.name])));
