# Mitose — LOG

## Run 1 (2026-11-07)
- Style: cut paper, 9:16, 32.5s, voice-led (Cartesia sonic-3.6, speed 1.2, excited). **Voice is a scratch take** (stock "Felipe") — the user's cloned voice id `66d119d7-…` returned 404 for the key in `~/.config/clip-ai/ai-motion.env`.
- Format: locked-off build on one stage (the cell), 0 hard cuts, 0 morphs; camera does the scale changes.
- Device: the orange chromosome (hero) copies itself; the copies are pulled apart on the snap; each daughter cell keeps one.
- Claims: phases and events per Nature Scitable / BioNinja / OpenStax-derived texts; 46 = human somatic cells (textbook).
- Simplification: 4 chromosomes drawn to stand for 46.

### Review (tools/review.mjs)
| check | result |
|---|---|
| narration density | PASS (max 3.05 w/s) |
| story arc | PASS 6/6 (after lowering the goodbye pad: −24.6 vs gift −15.6 dB) |
| loudest 100ms | 17.2s, in the payoff act; 1.0s ≤ −40 dBFS before it |
| text | PASS (0 cut-off/overlap) |
| dead beats | PASS |
| loudness | −14.3 LUFS, true peak −1.8 dBFS |
| determinism | true |

### Per shot
| shot | PASS | note |
|---|---|---|
| 1 uma célula | PASS | hero asleep, wakes on "mitose" |
| 2 cópia (close) | PASS | extreme close-up, twin faces visible |
| 3 prófase | PASS | envelope tears into scraps |
| 4 metáfase + silêncio | PASS | fibres taut, equator dashed |
| 5 anáfase | PASS | arms trail; neighbours startled |
| 6 telófase + citocinese | PASS | nuclei pop slightly before chromatids arrive (weakest) |
| 7 duas células | PASS | identical layouts, "=" and "46" tags |

**Weakest shot:** 6 — the new nuclei appear while the chromatids are still at the poles; delay `CU.nuclei` pop by ~0.4s or start `gather` earlier.

## Toolchain notes (this machine)
- `tools/voice_words.py` patched: `VO_LANG` env for the Whisper language; audio decoded by ffmpeg (PyAV 19 broke faster-whisper's decoder). Run voice.mjs with `PATH=<repo>/.venv/bin:$PATH VO_LANG=pt ... --model small`.
- Installed Comic Neue to `~/.local/share/fonts` (no handwriting font on the system; `cursive` fell back to an Urdu font).

## Run 2 (2026-11-07)
- User: look approved ("esse estilo mais estático de explicação"), but subtitles were missing.
- Replaced the bottom caption tag with in-canvas narration subtitles (`drawSubs` in src/scenes2.js): 1–3 words per chunk from `VOICE.lines[].words`, spoken word lit yellow, white Comic Neue Bold with ink outline, above the bottom safe zone. Driven by voice.json, so they follow a new voice take automatically.
- Review: all PASS (text 0 cut-off/overlap, arc 6/6, −14.3 LUFS, dead beats 0).


## Run 3 — alinhamento aos padrões atuais
- Narração provisória substituída pela voz clonada do usuário, `sonic-3.6`, emoção `excited`; originais em `voice/takes-1x/` e falas aceleradas com `atempo=1.4`.
- Pausas divididas uma única vez por 1.4, com mínimo de 0.25 s. Tempos recalculados com Whisper em português: 65/69 palavras reconhecidas, demais interpoladas; duração de 20.168 s.
- Formato atualizado para 30 fps; música desligada, efeitos a -18 dB sob a voz e impacto final suavizado.
- As revisões dos runs anteriores descrevem versões antigas. MP4 e revisão audiovisual completa precisam ser refeitos para esta versão.
- Validação técnica: build passou e os 605 quadros foram desenhados no Chromium sem erros de JavaScript, em 1080×1920 a 30 fps. Isso não substitui a revisão audiovisual.
