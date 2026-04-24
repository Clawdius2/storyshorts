// Audio and cover URLs — routed through the audio-streamer Worker
const AUDIO_BASE_URL = "https://audio-streamer.gusf.workers.dev";

export function buildAudioUrl(audioKey: string) {
  return `${AUDIO_BASE_URL}/${audioKey}`;
}

export function buildCoverUrl(coverImageKey: string) {
  return `${AUDIO_BASE_URL}/${coverImageKey}`;
}
