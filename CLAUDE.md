# ai-motion: instruções para o Claude

Este projeto produz shorts explicativos verticais em português, feitos em código, com a skill `animate` (`.claude/skills/animate/`). Antes de começar uma peça nova, leia o `README.md` e o `LOG.md` da peça que vai servir de modelo.

## Quando pedirem um vídeo novo

1. Siga a skill `animate`. Faça as três aprovações antes de animar: roteiro, look e storyboard. **Não renderize sem aprovação.**
2. Escolha o modelo pelo tipo de vídeo:
   - **3D** (montagem de peças mecânicas, formato "Desmontando o Mundo"): copie a estrutura de `pieces/freio-disco/`.
     - Use o estilo `styles/lowpoly3d/kit.js`, `vendor/three.min.js` (r159, com as URLs desarmadas) e os arquivos `src/world.js`, `src/scenes.js`, `src/render.js` e `src/score.js`.
     - Use `TIMELINE.gpu = true`.
   - **2D** (explicação mais estática): copie a estrutura de `pieces/mitose/` (recorte de papel), ou use outro estilo da skill se o usuário pedir.
3. Crie a peça em `pieces/<nome-em-kebab-case>/` e registre as decisões no `LOG.md` dela.
4. **Thumbnail 9:16 sempre** (os vídeos vão para YouTube Shorts): depois do vídeo aprovado, gere `renders/thumbnail.jpg` (1080×1920) com `node scripts/thumbnail.mjs pieces/<nome>`.
   - Configure em `piece.json` → `"thumbnail"`: `t` (o segundo usado como cena), `cam` opcional (`{ "pos", "tgt", "fov" }`) e `lines` (textos: `text`, `color` yellow/white, `size`, `y`).
   - A peça precisa respeitar `window.THUMB`: o `render.js` não desenha legendas, títulos e contadores, e o `camAt3()` devolve `window.THUMB.cam` quando existir (veja `pieces/abrigo-nuclear/src/`).
   - Boa capa: escolha um momento com a ação mais forte (raios acesos, peças montadas), não o fim apagado. Use no máximo 2 linhas curtas (pergunta-gancho em branco no alto, nome do tema em amarelo embaixo), texto entre y ≈ 400 e 1600, e confira a imagem antes de entregar.

## Padrões do usuário (sempre)

- Formato 9:16, 1080×1920, 30 fps, em português do Brasil.
- **Legendas palavra por palavra sempre**: a palavra falada acende em amarelo. Os tokens vêm do texto do roteiro, e os tempos vêm das palavras alinhadas; as palavras que faltarem recebem tempo interpolado.
- No 3D, o formato é cumulativo: **problema → solução → "Esse é o X"**. Cada peça nomeada ganha um título amarelo com contorno escuro. A fonte é Fira Sans Heavy (900).
- Narração com a voz clonada do usuário via `scripts/cartesia_voice.py` (voz "kauan dev", `sonic-3.6`, emoção `content`, `--speed 1.0`). Desde 2026-11-08 o usuário prefere `content`: a combinação `excited` + 1.4x soou robotizada e rápida demais.
  - **Use só essa voz.** Não use vozes de terceiros nem vozes de celebridades.
- **Narração em 1.2x** (`--tempo 1.2`; o freio-disco usou 1.4x): a velocidade da Cartesia quase não muda essa voz. Por isso:
  1. o script guarda as takes originais em `voice/takes-1x/`;
  2. o script gera `voice/<id>.wav` com `ffmpeg -filter:a atempo=<tempo>`, que mantém o tom;
  3. ao escrever um roteiro novo, divida os `after` do `voice/script.json` pelo tempo (mínimo de 0.25 s). Não divida novamente ao regenerar a voz.
  - Originais existentes são reutilizados; `--regenerate [--only id1,id2]` solicita novas takes.
- **Sem música de fundo por enquanto:** só efeitos sonoros (`const MUSIC = false` no `score.js`), com `voice.music` em −18 dB no `piece.json`.
- **Impactos de "conclusão" suaves.** O kit normaliza o volume da trilha, então efeitos esparsos sem música ficam altos. Deixe-os baixos.
- Referências externas (canais, vídeos) servem só como formato e visual. **O roteiro e os modelos são originais**: não copie texto nem material de outros.

## Regras da revisão que o usuário aceita falhar

Nestes casos, a preferência do usuário vale mais que a regra do `review.mjs`:

- densidade da fala acima de 3,5 palavras/s (efeito da aceleração);
- regras de volume do arco da história ("gift loudest", "goodbye decays"), que falham por não haver música e pelo final ser suave.

Todo o resto da revisão precisa passar: área segura do texto, cortes no tempo, trechos parados e −14 LUFS.

## Comandos

```bash
.venv/bin/python scripts/cartesia_voice.py pieces/<nome> --emotion content --speed 1.0 --tempo 1.2 [--only id1,id2] [--regenerate]
PATH=$PWD/.venv/bin:$PATH VO_LANG=pt node .claude/skills/animate/tools/voice.mjs pieces/<nome> --model small
node .claude/skills/animate/tools/build.mjs pieces/<nome>
node .claude/skills/animate/tools/export.mjs pieces/<nome> --share     # 3D: ~2 min na GPU
node .claude/skills/animate/tools/review.mjs pieces/<nome>
node scripts/thumbnail.mjs pieces/<nome>                                # thumbnail 9:16 → renders/thumbnail.jpg
```

## Segurança e ambiente

- A chave da Cartesia (`CARTESIA_API`) fica em `~/.config/clip-ai/ai-motion.env`. **Nunca mostre, copie nem commite esse valor.**
- No Linux com NVIDIA, use ANGLE `gl-egl` em `tools/gpu.mjs`. O Vulkan quebra os shaders do three.js.
- O `build.mjs` proíbe URLs e `data:` no código. Em bibliotecas embutidas, desarme as URLs (`"http:"+"//..."`).
- Gotchas do 3D: `RNG(...)` retorna um objeto (use `.f`). O `render.js` precisa expor `window.TIMELINE`, `shotAtFrame`, `BRIDGES` e `anchorAt` para o `review.mjs`.
- Não commite áudio, vídeo, `frames/`, `renders/`, `review/` nem `index.html`: o `.gitignore` já cobre esses arquivos.
