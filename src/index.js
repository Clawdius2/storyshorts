/**
 * audio-streamer Worker — uses R2 binding directly (no REST API)
 * R2 bucket is bound as AUDIO_BUCKET in wrangler.audio.toml
 * GET  — stream audio from R2
 * PUT   — upload audio to R2 (for audiobook production pipeline)
 */
class AudioStreamer {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    if (!key) {
      return new Response("Not Found", { status: 404 });
    }

    // PUT — upload to R2
    if (request.method === "PUT") {
      try {
        const contentType = request.headers.get("Content-Type") || "audio/mpeg";
        const body = await request.arrayBuffer();
        
        // Put the object directly via the R2 binding
        const object = await env.AUDIO_BUCKET.put(key, body, {
          httpMetadata: { contentType },
          customMetadata: { uploadedAt: new Date().toISOString() }
        });

        return new Response(JSON.stringify({ success: true, key, size: object.size }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(`Upload error: ${err.message}`, { status: 500 });
      }
    }

    // GET — stream from R2
    if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
      return new Response("Method Not Allowed", { status: 405 });
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
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, PUT, OPTIONS");
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
