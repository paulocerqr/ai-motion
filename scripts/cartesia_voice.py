"""Generate one Cartesia TTS take per line of a piece's voice/script.json.

usage: .venv/bin/python scripts/cartesia_voice.py pieces/<name> [--voice <id>] [--only id1,id2] [--speed 1.2] [--emotion excited]
Reads CARTESIA_API from ~/.config/clip-ai/ai-motion.env (never printed).
"""
import json
import sys
from pathlib import Path

from cartesia import Cartesia

ENV = Path.home() / ".config/clip-ai/ai-motion.env"
VOICE_ID = "66d119d7-d752-46d0-acbf-23a582af1141"
MODEL = "sonic-3.6"


def env_key(name: str) -> str:
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"{name} not found in {ENV}")


def opt(args, flag, default):
    return args[args.index(flag) + 1] if flag in args else default


def main():
    args = sys.argv[1:]
    piece = Path(args[0])
    only = set(opt(args, "--only", "").split(",")) - {""}
    speed = float(opt(args, "--speed", "1.2"))
    emotion = opt(args, "--emotion", "excited")
    voice = opt(args, "--voice", VOICE_ID)
    script = json.loads((piece / "voice/script.json").read_text())
    client = Cartesia(api_key=env_key("CARTESIA_API"), base_url="https://api.cartesia.ai")
    chars = 0
    for line in script["lines"]:
        if only and line["id"] not in only:
            continue
        out = piece / "voice" / line.get("file", f"{line['id']}.wav")
        resp = client.tts.generate(
            model_id=MODEL,
            transcript=line["text"],
            voice=voice,
            language="pt",
            output_format={"container": "wav", "encoding": "pcm_s16le", "sample_rate": 44100},
            generation_config={"speed": speed, "volume": 1, "emotion": emotion},
        )
        resp.write_to_file(str(out))
        chars += len(line["text"])
        print(f"ok {line['id']:10s} -> {out}")
    print(f"{chars} characters generated")


if __name__ == "__main__":
    main()
