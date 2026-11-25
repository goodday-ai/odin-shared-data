import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function publishBrandCatalog(directory, now = new Date()) {
  const hotels = readdirSync(directory).sort().flatMap((file) => {
    const hotelId = /^availability_index_(\d{1,16})\.json$/.exec(file)?.[1];
    if (!hotelId) return [];
    const index = JSON.parse(readFileSync(join(directory, file), 'utf8'));
    const name = typeof index.hotelName === 'string' ? index.hotelName.trim() : '';
    if (index.schemaVersion !== 'public_availability_index_v1' ||
        String(index.hotelId) !== hotelId || !name || name.length > 160) {
      throw new Error('Invalid brand metadata in ' + file);
    }
    return [{ hotelId, name }];
  });
  if (!hotels.length) throw new Error('No public availability indexes found');

  const path = join(directory, 'brand_catalog.json');
  let previous;
  try {
    previous = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (previous?.schemaVersion === 1 && Number.isFinite(Date.parse(previous.updatedAt)) &&
      JSON.stringify(previous.hotels) === JSON.stringify(hotels)) return;

  const catalog = { schemaVersion: 1, updatedAt: now.toISOString(), hotels };
  writeFileSync(path, JSON.stringify(catalog, null, 2) + '\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  publishBrandCatalog('data/odin/latest');
}
