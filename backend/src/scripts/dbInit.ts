import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getDb } from '../server/db.js';

async function main() {
  const schemaPath = path.resolve('schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const db = getDb();

  // Note: This runs everything as-is; production migrations should use a proper tool.
  await db.query(sql);
  // eslint-disable-next-line no-console
  console.log('DB initialized using schema.sql');

  await db.end();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

