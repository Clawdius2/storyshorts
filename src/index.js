/**
 * audio-streamer Worker — uses R2 binding directly (no REST API)
 * R2 bucket is bound as AUDIO_BUCKET in wrangler.audio.toml
 */
class AudioStreamer {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    if (!key) {
      return new Response("Not Found", { status: 404 });
    }

    let contentType = "audio/mpeg";
    if (key.endsWith(".wav")) contentType = "audio/wav";
    else if (key.endsWith(".mp3")) contentType = "audio/mpeg";
    else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (key.endsWith(".png")) contentType = "image/png";

    const rangeHeader = request.headers.get("Range");
    const rangeMatch = rangeHeader ? rangeHeader.match(/^bytes=(\d+)-(\d+)$/) : null;

    try {
      let object;
      let usedRange = false;

      // Try with range first if valid Range header
      if (rangeMatch) {
        try {
          object = await env.AUDIO_BUCKET.get(key, {
            range: { start: parseInt(rangeMatch[1]), end: parseInt(rangeMatch[2]) },
          });
          usedRange = !!object.range;
        } catch (rangeErr) {
          // Range failed — fall through to try full object
          object = null;
        }
      }

      // Fall back to full object if range didn't work or wasn't attempted
      if (!object) {
        object = await env.AUDIO_BUCKET.get(key);
      }

      if (!object) {
        return new Response(`Not found: ${key}`, { status: 404 });
      }

      const headers = new Headers();
      headers.set("Content-Type", contentType);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      headers.set("Access-Control-Max-Age", "86400");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      if (usedRange && object.range) {
        const cfRange = object.range;
        headers.set("Content-Range", `bytes ${cfRange.start}-${cfRange.end}/${object.size}`);
        headers.set("Content-Length", String(cfRange.end - cfRange.start + 1));
        return new Response(object.body, { status: 206, headers });
      }

      headers.set("Content-Length", String(object.size));
      return new Response(object.body, { headers });

    } catch (err) {
      return new Response(`Worker error: ${err.message}`, { status: 502 });
    }
  }
}

export default new AudioStreamer();
