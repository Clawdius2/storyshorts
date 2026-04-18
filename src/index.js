/**
 * audio-streamer Worker
 * Proxies requests from audio.storyshorts.co/* → R2 bucket
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

    // Build the R2 public URL for this object
    // R2 serves objects at: https://{account_id}.r2.cloudflarestorage.com/{key}
    const r2Url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    // Fetch the object from R2
    let response;
    try {
      response = await fetch(r2Url, {
        headers: {
          "Range": request.headers.get("Range") || "",
        },
      });
    } catch (err) {
      return new Response("Upstream fetch failed", { status: 502 });
    }

    if (response.status === 404) {
      return new Response("File not found", { status: 404 });
    }

    if (response.status === 403) {
      return new Response("Access denied — bucket may not be public", { status: 403 });
    }

    // Stream the response back with CORS headers
    const newHeaders = new Headers(response.headers);

    // CORS — allow browser audio playback
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    newHeaders.set("Access-Control-Max-Age", "86400");

    // Content-Type defaults to octet-stream if not set
    // The browser needs correct MIME type for audio
    if (!newHeaders.has("Content-Type")) {
      // Infer from extension
      if (key.endsWith(".mp3")) {
        newHeaders.set("Content-Type", "audio/mpeg");
      } else if (key.endsWith(".txt")) {
        newHeaders.set("Content-Type", "text/plain; charset=utf-8");
      } else if (key.endsWith(".json")) {
        newHeaders.set("Content-Type", "application/json");
      }
    }

    // Prevent caching of dynamic audio content
    newHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};
