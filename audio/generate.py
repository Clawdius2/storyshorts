"""
StoryShorts Audio Generation Pipeline
=====================================
Fetches Gutenberg text → chunks by paragraph → classifies emotional tier
→ calls Hume TTS with tiered acting instructions → concatenates → uploads to R2.

Usage:
    python generate.py --gutenberg-id 2148 --story-title "The Tell-Tale Heart" [options]

Options:
    --gutenberg-id     Gutenberg ebook ID (required)
    --story-title      Display title for output files (required)
    --output-dir       Local output directory (default: ./output)
    --voice-name       Hume voice name (default: Edgar Allen Poe)
    --dry-run          Parse and classify chunks without calling TTS
"""

import re
import os
import sys
import json
import time
import hashlib
import argparse
from pathlib import Path
from typing import Optional

import requests  # pip install requests if needed

# =============================================================================
# CONFIGURATION
# =============================================================================

HUME_API_KEY = os.environ.get("HUME_API_KEY", "r9OPZLxU6FGNwTUQ5DQyTstJ7kgQ7ABhOXHGKtLBzneNA5I5")
HUME_SECRET_KEY = os.environ.get("HUME_SECRET_KEY", "xiApNeHzWFdqsSooyA3O4WyPDiG7lk9rUVLiCBQq5SuwKQ4e6KwqGGECR4aGdTGR")
HUME_BASE_URL = "https://api.hume.ai/v0/tts/stream/json"

R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "dfd11ff2f8b18eab632465275938c6ac")
R2_BUCKET = os.environ.get("R2_BUCKET", "shortshorts-audio-prod")
R2_API_TOKEN = os.environ.get("CF_API_TOKEN", "")  # Set via `wrangler secret put CF_API_TOKEN`

# Default voice
DEFAULT_VOICE = "Edgar Allen Poe"

# =============================================================================
# PARAGRAPH SPLITTING — Handles both \r\n\r\n (Gutenberg) and \n\n (plain)
# =============================================================================

def extract_story_text(raw_text: str, title_marker: str) -> str:
    """
    Extract the story text from raw Gutenberg HTML/plaintext.
    
    Strategy:
    1. Find ALL occurrences of the title marker
    2. Pick the one that's most likely to be the actual story start
       (closest to "*** START OF" marker, or in the body vs table of contents)
    3. Find the next story boundary (next ALL-CAPS title with blank lines before it)
    4. Strip header/license boilerplate from the story body
    """
    marker_pos = raw_text.find(title_marker)
    if marker_pos == -1:
        raise ValueError(f"Could not find story marker: {repr(title_marker[:50])}")

    # Start after the title marker; find the first real prose line ("True!..." for Poe)
    after_marker = raw_text[marker_pos + len(title_marker):]
    
    # Detect line ending style
    first_200 = after_marker[:200]
    crlf_pos = first_200.find('\r\n')
    lf_pos = first_200.find('\n')
    if crlf_pos >= 0 and (lf_pos < 0 or crlf_pos < lf_pos):
        lines = after_marker.split('\r\n')
    else:
        lines = after_marker.split('\n')

    # Find first real prose line to skip front matter
    story_start_in_after = 0
    for i, line in enumerate(lines[:8]):
        line_s = line.strip()
        if line_s.startswith("True!") or line_s.startswith("TRUE!"):
            story_start_in_after = sum(len(lines[j]) + 1 for j in range(i))
            break
        if len(line_s) > 25 and line_s[0].isupper() and line_s[-1] in '.!?' and not re.match(r'^[A-Z\s]{8,}$', line_s):
            story_start_in_after = sum(len(lines[j]) + 1 for j in range(i))
            break

    story_text = after_marker[story_start_in_after:]

    # Find story end: first sequence of 3+ CRLFs followed by an ALL-CAPS title
    # This correctly terminates the story at the boundary to the next story in the volume
    boundary_re = re.compile(r'(\r\n){3,}([A-Z][A-Z]{3,20})\r\n')
    m = boundary_re.search(story_text)
    if m:
        story_text = story_text[:m.start()]
    # else: story continues to end of file (standalone ebook — no boundary needed)

    return story_text


def split_paragraphs(text: str) -> list[str]:
    """
    Split text into paragraphs using both \r\n\r\n (Windows/Gutenberg) and \n\n (Unix).
    Returns list of non-empty, stripped paragraphs.
    """
    # Gutenberg uses \r\n; also handle plain \n\n
    if '\r\n\r\n' in text:
        paras = text.split('\r\n\r\n')
    else:
        paras = text.split('\n\n')
    
    result = []
    for p in paras:
        p = p.strip()
        if p and len(p) > 10:  # Filter out very short fragments
            result.append(p)
    
    return result


def chunk_text(paragraphs: list[str], target: int = 2800, hard_max: int = 4000) -> list[str]:
    """
    Group paragraphs into chunks targeting ~2800 chars.
    Paragraphs are merged until the chunk exceeds target, then cut.
    Single paragraphs > hard_max are sentence-split.
    """
    chunks = []
    current = ""
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        # If single paragraph exceeds hard_max, sentence-split it
        if len(para) > hard_max:
            if current:
                chunks.append(current)
                current = ""
            # Sentence split on .!?
            sentences = re.split(r'(?<=[.!?])\s+', para)
            sub_chunk = ""
            for sent in sentences:
                if len(sub_chunk) + len(sent) + 1 <= hard_max:
                    sub_chunk += (" " if sub_chunk else "") + sent
                else:
                    if sub_chunk:
                        chunks.append(sub_chunk)
                    sub_chunk = sent
            if sub_chunk:
                chunks.append(sub_chunk)
            continue
        
        # Normal case: try to add to current chunk
        if len(current) + len(para) + 2 <= target:
            current += ("\n\n" if current else "") + para
        else:
            if current:
                chunks.append(current)
            current = para
    
    if current:
        chunks.append(current)
    
    return chunks


# =============================================================================
# EMOTIONAL CLASSIFICATION — Tiered acting instructions per chunk
# =============================================================================

# Keywords that indicate emotional intensity levels
INTENSITY_KEYWORDS = {
    # Tier 4 — Extreme (murder, violence, madness)
    "extreme": [
        "dismembered", "cut off the head", "arms and legs", "ha! ha!", "buried",
        "tore", "severed", "murder", "killed", "dead", "corpse", "rotting",
        "hell", "devil", "cursed", "damned", "mad", "lunatic", "raving",
        "screamed", "shrieked", "howled", "fury", "rage", "furious",
    ],
    # Tier 3 — High tension (confrontation, pursuit, urgency)
    "high": [
        "heart beat", "pulsation", "dread", "terror", "fear", "horror",
        "watched", "crept", "slowly", "silently", "waited", "waiting",
        "cautious", "night", "dark", "shadow", "faint sound", "low sound",
        "ear", "heard", "listened", "deep noise", "rapping", "tapping",
        "stealth", "cautiously", "pale", "trembl", "nervous", "agitat",
        "gallop", "wild", "frantic", "hurried", "desperate", "rushed",
    ],
    # Tier 2 — Medium (measured narration, reflective, building)
    "medium": [
        "I think", "perhaps", "maybe", "might", "could", "would",
        "describe", "explain", "prove", "certain", "sure", "fact",
        "calm", "quiet", "still", "faint", "gentle", "soft",
        "reason", "logic", "argument", "explain", "careful", "precise",
        "observe", "noticed", "saw", "appear", "seemed", "looked",
        "thought", "wondered", "consider", "deliberate", "intention",
    ],
    # Tier 1 — Calm (opening, settling, aftermath)
    "calm": [
        "true", "nervous", "very dreadfully", "I will", "tell you",
        "hear me", "give ear", "attention", "proceed", "now",
        "object", "sense", "acute", "keen", "sharp", "overjoyed",
        "villain", "decease", "old man", "eye", "vulture", "pale blue",
        "film", "pupil", "roof", "bed", "dark", "closed", "sealed",
    ],
}


def classify_chunk(chunk: str) -> str:
    """
    Classify a text chunk into an emotional tier (calm, medium, high, extreme).
    Returns the tier name.
    """
    chunk_lower = chunk.lower()
    scores = {}
    
    for tier, keywords in INTENSITY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in chunk_lower)
        scores[tier] = score
    
    # Default to medium if no keywords match
    if max(scores.values()) == 0:
        return "medium"
    
    # Priority: extreme > high > medium > calm
    tier_priority = ["extreme", "high", "medium", "calm"]
    
    # Use the highest-scoring tier
    best_tier = max(scores, key=lambda t: scores[t])
    
    # But if calm has a score AND a higher tier also has a score,
    # pick the higher tier
    if scores["calm"] > 0:
        # Check if there's a clearer signal from a higher tier
        for tier in ["extreme", "high", "medium"]:
            if scores[tier] >= scores["calm"]:
                return tier
    
    return best_tier


# =============================================================================
# ACTING INSTRUCTIONS — Tier-specific Hume TTS parameters
# =============================================================================

ACTING_TIERS = {
    # Tier 1: Calm — measured, deliberate opening
    "calm": "Measured, deliberate. Narrator speaking with clinical precision, slight detachment.",
    # Tier 2: Medium — building tension, reflective
    "medium": "Focused, increasingly intent. Slight urgency creeping into measured cadence.",
    # Tier 3: High — heightened tension, paranoid awareness
    "high": "Heightened tension, controlled intensity. Rapid but precise, paranoid awareness.",
    # Tier 4: Extreme — full intensity, desperate, confessional
    "extreme": "Extreme intensity, desperate energy. Rapid, urgent, confessional. Listener is compelled.",
}


def get_acting_instructions(tier: str) -> str:
    """Return natural-language acting instructions for the given tier."""
    return ACTING_TIERS.get(tier, ACTING_TIERS["medium"])


# =============================================================================
# HUME TTS API
# =============================================================================

def synthesize_speech(
    text: str,
    voice_name: str = DEFAULT_VOICE,
    acting_tier: str = "medium",
) -> bytes:
    """
    Call Hume TTS API (v0 streaming endpoint) with tiered acting instructions.
    The endpoint returns streaming NDJSON — one JSON object per audio chunk,
    each with a base64-encoded MP3 payload. We collect all chunks and concatenate
    the raw audio bytes.
    Returns raw audio bytes.
    """
    acting = get_acting_instructions(acting_tier)

    # Build the utterances payload (per Hume v0 TTS streaming API)
    # Acting instructions go in each utterance's `description` field
    payload = {
        "utterances": [
            {
                "text": text,
                "description": acting,  # Acting instructions as natural-language directions
                "voice": {
                    "name": voice_name,
                    # provider defaults to CUSTOM_VOICE (user's custom voices)
                },
            }
        ],
    }

    headers = {
        "X-Hume-Api-Key": HUME_API_KEY,
        "Content-Type": "application/json",
    }

    # Use stream=True so requests returns a streaming response
    response = requests.post(
        HUME_BASE_URL,
        headers=headers,
        json=payload,
        timeout=120,
        stream=True,
    )

    if response.status_code != 200:
        raise RuntimeError(f"Hume API error {response.status_code}: {response.text[:500]}")

    # Collect all base64 audio chunks from the NDJSON stream
    import base64
    audio_chunks: list[bytes] = []
    for line in response.iter_lines():
        if not line or line.strip() == b"":
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        # Each NDJSON object has type="audio"
        if obj.get("type") == "audio":
            chunk_b64 = obj.get("audio", "")
            if chunk_b64:
                audio_chunks.append(base64.b64decode(chunk_b64))

    if not audio_chunks:
        raise RuntimeError("No audio chunks received from Hume streaming endpoint")

    return b"".join(audio_chunks)


def synthesize_speech_with_retry(
    text: str,
    voice_name: str = DEFAULT_VOICE,
    acting_tier: str = "medium",
    max_retries: int = 3,
) -> bytes:
    """Call Hume TTS with exponential backoff retry."""
    for attempt in range(max_retries):
        try:
            return synthesize_speech(text, voice_name, acting_tier)
        except Exception as e:
            wait = 2 ** attempt
            print(f"  Attempt {attempt+1} failed: {e}. Retrying in {wait}s...")
            time.sleep(wait)
    raise RuntimeError(f"Failed after {max_retries} attempts")


# =============================================================================
# AUDIO PROCESSING — ffprobe + ffmpeg for concatenation
# =============================================================================

import struct


def get_mp3_duration(mp3_bytes: bytes) -> float:
    """Get duration of an MP3 file from its bytes using ffprobe."""
    import subprocess, tempfile, os
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
        tmp.write(mp3_bytes)
        tmp_path = tmp.name
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration', '-of', 'csv=p=0', tmp_path
        ], capture_output=True, text=True, timeout=30)
        return float(result.stdout.strip())
    finally:
        os.unlink(tmp_path)


def concatenate_mp3_files(mp3_files: list[str], output_path: str) -> float:
    """
    Concatenate multiple MP3 files into a single output file using ffmpeg.
    Returns total duration in seconds.
    """
    import subprocess

    # Build ffmpeg concat command
    concat_list = output_path.replace('.mp3', '_concat.txt')

    with open(concat_list, 'w') as f:
        for mp3_file in mp3_files:
            escaped_path = mp3_file.replace("'", "'\\''")
            f.write(f"file '{escaped_path}'\n")

    try:
        result = subprocess.run([
            'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
            '-i', concat_list,
            '-c', 'copy', output_path
        ], capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg concat failed: {result.stderr}")

        # Get duration
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration', '-of', 'csv=p=0', output_path
        ], capture_output=True, text=True, timeout=30)

        total_duration = float(result.stdout.strip())
        return total_duration

    finally:
        if os.path.exists(concat_list):
            os.unlink(concat_list)


# =============================================================================
# R2 UPLOAD
# =============================================================================

def upload_to_r2(local_file_path: str, r2_key: str) -> str:
    """
    Upload a file to Cloudflare R2 using the REST API.
    Returns the R2 object URL.
    """
    if not R2_API_TOKEN:
        print("  ⚠ CF_API_TOKEN not set — skipping R2 upload")
        return local_file_path
    
    with open(local_file_path, 'rb') as f:
        data = f.read()
    
    url = f"https://api.cloudflare.com/client/v4/accounts/{R2_ACCOUNT_ID}/r2/buckets/{R2_BUCKET}/objects/{r2_key}"
    
    headers = {
        "Authorization": f"Bearer {R2_API_TOKEN}",
        "Content-Type": "audio/mpeg",  # We upload MP3
    }
    
    response = requests.put(url, headers=headers, data=data, timeout=300)
    
    if response.status_code not in (200, 201):
        raise RuntimeError(f"R2 upload failed: {response.status_code} {response.text}")
    
    return f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{R2_BUCKET}/{r2_key}"


# =============================================================================
# MAIN PIPELINE
# =============================================================================

def run_pipeline(
    gutenberg_id: str,
    story_title: str,
    output_dir: str = "./output",
    voice_name: str = DEFAULT_VOICE,
    dry_run: bool = False,
    skip_upload: bool = False,
):
    """
    Run the full audio generation pipeline for a story.
    """
    print(f"\n{'='*60}")
    print(f" StoryShorts Audio Pipeline")
    print(f" Story: {story_title}")
    print(f" Gutenberg ID: {gutenberg_id}")
    print(f" Voice: {voice_name}")
    print(f" Output: {output_dir}")
    print(f"{'='*60}\n")
    
    # Ensure output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # ---- Step 1: Fetch Gutenberg text ----
    print(f"[1/7] Fetching Gutenberg text for ID {gutenberg_id}...")
    
    # Gutenberg plain text URL
    url = f"https://www.gutenberg.org/cache/epub/{gutenberg_id}/pg{gutenberg_id}.txt"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    raw_text = response.text
    
    print(f"  Downloaded {len(raw_text):,} chars")
    
    # ---- Step 2: Extract story text ----
    print(f"\n[2/7] Extracting story text...")
    
    # For The Tell-Tale Heart: it's in Poe Complete Works Vol 2 (2148)
    # The marker is "TELL-TALE HEART.\r\n\r\n\r\n" and it ends before "BERENICE"
    title_markers = {
        "The Tell-Tale Heart": "TELL-TALE HEART.\r\n\r\n\r\n",
        "The Gift of the Magi": "THE GIFT OF THE MAGI\r\n",
        "The Necklace": "THE NECKLACE\r\n",
        "The Monkeys Paw": "THE MONKEY'S PAW\r\n",
        "The Last Question": "THE LAST QUESTION\r\n",
        "The Yellow Wallpaper": "THE YELLOW WALLPAPER\r\n",
        "The Open Window": "THE OPEN WINDOW\r\n",
        "A Sound of Thunder": "A SOUND OF THUNDER\r\n",
        "An Occurrence at Owl Creek Bridge": "AN OCCURRENCE AT OWL CREEK BRIDGE\r\n",
        "The Machine Stops": "THE MACHINE STOPS\r\n",
    }
    
    marker = title_markers.get(story_title, f"{story_title.upper()}\r\n")
    
    try:
        story_text = extract_story_text(raw_text, marker)
    except ValueError as e:
        print(f"  ⚠ {e}")
        print("  Attempting fallback extraction by looking for first paragraph...")
        # Fallback: just take from the marker to the end
        pos = raw_text.find(marker.split('\r\n')[0])
        if pos >= 0:
            story_text = raw_text[pos + len(marker):].strip()
        else:
            raise ValueError(f"Cannot find story start marker for: {story_title}")
    
    print(f"  Extracted {len(story_text):,} chars of story text")
    print(f"  First 100 chars: {repr(story_text[:100])}")
    
    # ---- Step 3: Split into paragraphs ----
    print(f"\n[3/7] Splitting into paragraphs...")
    
    paragraphs = split_paragraphs(story_text)
    print(f"  Found {len(paragraphs)} paragraphs")
    
    # ---- Step 4: Chunk text ----
    print(f"\n[4/7] Chunking paragraphs (target=2800, hard_max=4000)...")
    
    chunks = chunk_text(paragraphs)
    print(f"  Created {len(chunks)} chunks")
    
    for i, chunk in enumerate(chunks):
        print(f"  Chunk {i:03d}: {len(chunk):5d} chars | {len(chunk.split())} words")
    
    # ---- Step 5: Classify emotional tiers ----
    print(f"\n[5/7] Classifying emotional tiers...")
    
    chunk_tiers = []
    for i, chunk in enumerate(chunks):
        tier = classify_chunk(chunk)
        chunk_tiers.append(tier)
        print(f"  Chunk {i:03d}: [{tier.upper():8s}] {chunk[:80]}...")
    
    if dry_run:
        print("\n[dry-run] Skipping TTS generation (--dry-run mode)")
        return
    
    # ---- Step 6: Generate audio for each chunk ----
    print(f"\n[6/7] Generating audio via Hume TTS...")
    
    chunk_audio_files = []
    
    for i, (chunk, tier) in enumerate(zip(chunks, chunk_tiers)):
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', story_title)[:30]
        chunk_file = os.path.join(output_dir, f"{safe_name}_chunk_{i:03d}.mp3")
        
        print(f"\n  Chunk {i:03d}/{len(chunks)} | tier={tier} | {len(chunk)} chars")
        print(f"  Acting: {get_acting_instructions(tier)}")
        
        try:
            audio_bytes = synthesize_speech_with_retry(chunk, voice_name, tier)
            
            with open(chunk_file, 'wb') as f:
                f.write(audio_bytes)
            
            duration = get_mp3_duration(audio_bytes)
            print(f"  ✓ Generated {duration:.1f}s → {chunk_file}")
            
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            raise
        
        chunk_audio_files.append(chunk_file)
    
    # ---- Step 7: Concatenate ----
    print(f"\n[7/7] Concatenating chunks...\n")
    
    safe_name = re.sub(r'[^a-zA-Z0-9]', '_', story_title)[:30]
    final_mp3 = os.path.join(output_dir, f"{safe_name}.mp3")
    
    total_duration = concatenate_mp3_files(chunk_audio_files, final_mp3)
    print(f"  Concatenated {len(chunk_audio_files)} chunks → {total_duration:.1f}s")
    
    if not skip_upload:
        r2_key = f"books/{gutenberg_id}/audio/{story_title.replace(' ', '_')}.mp3"
        r2_url = upload_to_r2(final_mp3, r2_key)
        print(f"  Uploaded to R2: {r2_url}")
    else:
        print(f"  (skipping R2 upload — local files remain in {output_dir})")
    
    # ---- Summary ----
    print(f"\n{'='*60}")
    print(f" Pipeline complete!")
    print(f" Final audio: {final_mp3}")
    print(f" Duration: {total_duration:.1f}s ({total_duration/60:.1f} min)")
    print(f" Chunks: {len(chunks)}")
    print(f" Tier distribution:")
    for tier in ["calm", "medium", "high", "extreme"]:
        count = chunk_tiers.count(tier)
        print(f"    {tier}: {count}")
    print(f"{'='*60}\n")
    
    return {
        "story_title": story_title,
        "gutenberg_id": gutenberg_id,
        "final_mp3": final_mp3,
        "total_duration": total_duration,
        "num_chunks": len(chunks),
        "chunk_tiers": chunk_tiers,
    }


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="StoryShorts Audio Generation Pipeline")
    parser.add_argument("--gutenberg-id", required=True, help="Gutenberg ebook ID")
    parser.add_argument("--story-title", required=True, help="Story title (for output naming)")
    parser.add_argument("--output-dir", default="./output", help="Output directory")
    parser.add_argument("--voice-name", default=DEFAULT_VOICE, help="Hume voice name")
    parser.add_argument("--dry-run", action="store_true", help="Parse and classify without TTS")
    parser.add_argument("--skip-upload", action="store_true", help="Skip R2 upload")
    
    args = parser.parse_args()
    
    result = run_pipeline(
        gutenberg_id=args.gutenberg_id,
        story_title=args.story_title,
        output_dir=args.output_dir,
        voice_name=args.voice_name,
        dry_run=args.dry_run,
        skip_upload=args.skip_upload,
    )