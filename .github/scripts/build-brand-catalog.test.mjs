import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { publishBrandCatalog } from './build-brand-catalog.mjs';

test('a new index adds a property, a rename keeps its ID, and order changes are ignored', () => {
  const dir = mkdtempSync(join(tmpdir(), 'odin-brand-catalog-'));
  const put = (hotelId, hotelName, rows = []) => writeFileSync(
    join(dir, 'availability_index_' + hotelId + '.json'),
    JSON.stringify({ schemaVersion: 'public_availability_index_v1', hotelId, hotelName, rows }),
  );
  const output = () => readFileSync(join(dir, 'brand_catalog.json'), 'utf8');
  const first = new Date('2026-11-24T00:00:00Z');
  const second = new Date('2026-11-25T00:00:00Z');
  put('3126', '遇見秘境');
  publishBrandCatalog(dir, first);
  const initial = output();
  put('3126', '遇見秘境', [['ignored']]);
  publishBrandCatalog(dir, second);
  assert.equal(output(), initial);
  put('3126', '測試更名');
  put('99999999', '測試新館');
  publishBrandCatalog(dir, second);
  assert.deepEqual(JSON.parse(output()), {
    schemaVersion: 1,
    updatedAt: second.toISOString(),
    hotels: [{ hotelId: '3126', name: '測試更名' }, { hotelId: '99999999', name: '測試新館' }],
  });
});
