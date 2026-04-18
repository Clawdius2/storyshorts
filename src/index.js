/**
 * audio-streamer Worker
 * Proxies requests from audio.storyshorts.co/* → R2 bucket (bound directly, no S3 auth needed)
 * Adds CORS headers for browser playback
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Strip the leading slash from the path to get the R2 key
    const key = url.pathname.slice(1);

    if (!key) {
      return new Response("Not Found", { status: 404 });
    }

    // Fetch the object directly from the bound R2 bucket (no auth needed)
    let object;
    try {
      object = await env.AUDIO_BUCKET.get(key);
    } catch (err) {
      return new Response("R2 fetch failed: " + err.message, { status: 502 });
    }

    if (!object) {
      return new Response("File not found in R2: " + key, { status: 404 });
    }

    // Determine content type from extension
    let contentType = object.httpMetadata?.contentType;
    if (!contentType) {
      if (key.endsWith(".mp3")) contentType = "audio/mpeg";
      else if (key.endsWith(".txt")) contentType = "text/plain; charset=utf-8";
      else if (key.endsWith(".json")) contentType = "application/json";
      else contentType = "application/octet-stream";
    }

    // Stream the response back with CORS headers
    const headers = new Headers({
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    // Handle Range requests for audio seeking
    const rangeHeader = request.headers.get("Range");
    if (rangeHeader) {
      const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : object.size - 1;
        const chunkSize = end - start + 1;
        return new Response(object.body, {
          status: 206,
          headers: {
            ...Object.fromEntries(headers),
            "Content-Range": `bytes ${start}-${end}/${object.size}`,
            "Content-Length": String(chunkSize),
            "Accept-Ranges": "bytes",
          },
        });
      }
    }

    return new Response(object.body, {
      status: 200,
      headers,
    });
  },
};
