"""Generate one Cartesia TTS take per line of a piece's voice/script.json.

usage: .venv/bin/python scripts/cartesia_voice.py pieces/<name> [--only id1,id2] [--speed 1.2] [--regenerate] [--emotion excited] [--tempo 1.4]
Reads CARTESIA_API from ~/.config/clip-ai/ai-motion.env (never printed).
"""
import argparse
import json
import subprocess
import tempfile
import sys
from pathlib import Path


ENV = Path.home() / ".config/clip-ai/ai-motion.env"
VOICE_ID = "66d119d7-d752-46d0-acbf-23a582af1141"
MODEL = "sonic-3.6"


def env_key(name: str) -> str:
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"{name} not found in {ENV}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("piece", type=Path)
    parser.add_argument("--only", default="")
    parser.add_argument("--speed", type=float, default=1.2)
    parser.add_argument("--emotion", default="excited")
    parser.add_argument("--tempo", type=float, default=1.4, help="ffmpeg atempo applied to the takes (pitch kept)")
    parser.add_argument("--regenerate", action="store_true", help="Replace saved original takes")
    args = parser.parse_args()
    piece = args.piece
    only = set(args.only.split(",")) - {""}
    script = json.loads((piece / "voice/script.json").read_text())
    ids = {line["id"] for line in script["lines"]}
    if only - ids:
        parser.error(f"unknown line ids: {', '.join(sorted(only - ids))}")
    client = None
    chars = 0
    for line in script["lines"]:
        if only and line["id"] not in only:
            continue
        out = piece / "voice" / line.get("file", f"{line['id']}.wav")
        original = piece / "voice/takes-1x" / out.relative_to(piece / "voice")
        original.parent.mkdir(parents=True, exist_ok=True)
        out.parent.mkdir(parents=True, exist_ok=True)
        if args.regenerate or not original.exists():
            if client is None:
                from cartesia import Cartesia
                client = Cartesia(api_key=env_key("CARTESIA_API"), base_url="https://api.cartesia.ai")
            resp = client.tts.generate(
                model_id=MODEL,
                transcript=line["text"],
                voice=VOICE_ID,
                language="pt",
                output_format={"container": "wav", "encoding": "pcm_s16le", "sample_rate": 44100},
                generation_config={"speed": args.speed, "volume": 1, "emotion": args.emotion},
            )
            with tempfile.TemporaryDirectory(dir=original.parent) as tmp:
                take = Path(tmp) / "take.wav"
                resp.write_to_file(str(take))
                take.replace(original)
            chars += len(line["text"])
        # Replace the prepared take only after ffmpeg succeeds.
        with tempfile.TemporaryDirectory(dir=out.parent) as tmp:
            ready = Path(tmp) / "ready.wav"
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(original),
                            "-filter:a", f"atempo={args.tempo}", str(ready)], check=True)
            ready.replace(out)
        print(f"ok {line['id']:10s} -> {out}")
    print(f"{chars} characters generated")


if __name__ == "__main__":
    main()
