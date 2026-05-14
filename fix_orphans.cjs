const { Client } = require('pg');
const client = new Client({
  host: 'roundhouse.proxy.rlwy.net',
  port: 52118,
  database: 'railway',
  user: 'postgres',
  password: 'VnpXTBSPRsBLAiUzHnprssKqJQHOKCnd'
});

const BASE = 'https://audio-streamer.gusf.workers.dev';
const orphans = [
  'books/47875/audio/Isaac_Asimov.The_Last_Question.mp3',
  'books/62129/audio/W.W._Jacobs.The_Monkeys_Paw.mp3',
  'books/19555/audio/Guy_de_Maupassant.The_Necklace.mp3',
  'books/2148/audio/Edgar_Allan_Poe.The_Tell-Tale_Heart.mp3',
  'books/1952/audio/Charlotte_Perkins_Gilman.The_Yellow_Wallpaper.mp3',
  'books/38369/audio/Saki.The_Open_Window.mp3',
  'books/375/audio/Ambrose_Bierce.An_Occurrence_at_Owl_Creek_Bridge.mp3',
  'books/41/audio/Washington_Irving.The_Legend_of_Sleepy_Hollow.mp3',
  'books/47394/audio/Silas_Vale.The_Machine_Stops.mp3',
  'arsene-lupin-the-arrest/audio/arsene-lupin-the-arrest.mp3',
];

async function main() {
  await client.connect();
  let updated = 0;
  for (const audioKey of orphans) {
    const url = BASE + '/' + audioKey;
    const res = await client.query(
      'UPDATE "Book" SET "publicAudioUrl" = $1, "updatedAt" = NOW() WHERE "audioKey" = $2 RETURNING title',
      [url, audioKey]
    );
    if (res.rows.length > 0) {
      console.log('Updated:', res.rows[0].title);
      updated++;
    }
  }
  console.log('Total updated:', updated);
  await client.end();
}
main().catch(e => { console.error(e); process.exit(1); });
