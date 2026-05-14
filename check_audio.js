const { Client } = require('pg');
const client = new Client({
  host: 'roundhouse.proxy.rlwy.net',
  port: 52118,
  database: 'railway',
  user: 'postgres',
  password: process.env.PG_PASS || 'VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd'
});

async function main() {
  await client.connect();

  // Books with audio ready but no public URL — these are broken/preview but not live
  const r = await client.query(`
    SELECT title, narrator, "gutenbergId", "audioKey", "publicAudioUrl", status
    FROM "Book"
    WHERE "publicAudioUrl" IS NULL AND status = 'ready'
    ORDER BY title
  `);
  console.log('Books with audio but no public URL:');
  console.log(JSON.stringify(r.rows, null, 2));

  // All books with audioKey
  const all = await client.query(`
    SELECT title, narrator, "gutenbergId", "audioKey", "publicAudioUrl", status
    FROM "Book"
    WHERE "audioKey" IS NOT NULL AND status = 'ready'
    ORDER BY title
  `);
  console.log('\nAll books with audio:');
  console.log(JSON.stringify(all.rows, null, 2));

  await client.end();
}

main().catch(console.error);