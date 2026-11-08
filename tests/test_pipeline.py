import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import Mock, patch
import wave

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / '.claude/skills/animate/tools'
spec = importlib.util.spec_from_file_location('voice', ROOT / 'scripts/cartesia_voice.py')
voice = importlib.util.module_from_spec(spec)
spec.loader.exec_module(voice)


class PipelineTests(unittest.TestCase):
    def test_reuse_original_and_preserve_prepared_take_on_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            piece = Path(tmp)
            original = piece / 'voice/takes-1x/open.wav'
            original.parent.mkdir(parents=True)
            with wave.open(str(original), 'wb') as wav:
                wav.setparams((1, 2, 44100, 0, 'NONE', 'not compressed'))
                wav.writeframes(b'\x00\x20' * 44100)
            script = {'lead': 0.1, 'tail': 0.2, 'lines': [
                {'id': 'open', 'text': 'Uma célula é dividida em duas.', 'after': 0.25}]}
            (piece / 'voice/script.json').write_text(json.dumps(script))
            saved = original.read_bytes()
            with patch('sys.argv', ['voice', str(piece)]), patch.object(voice, 'env_key', side_effect=AssertionError('API must not be called')):
                voice.main()
            prepared = piece / 'voice/open.wav'
            with wave.open(str(prepared)) as wav:
                self.assertLess(wav.getnframes() / wav.getframerate(), 0.8)
            self.assertEqual(saved, original.read_bytes())
            good = prepared.read_bytes()
            with patch('sys.argv', ['voice', str(piece)]), patch.object(voice.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'ffmpeg')):
                with self.assertRaises(subprocess.CalledProcessError):
                    voice.main()
            self.assertEqual(good, prepared.read_bytes())
            # Supply recognizer output without downloading a model during tests.
            python = piece / 'python3'
            heard = [{'w': word, 't0': round(0.1 + i * 0.08, 3), 't1': round(0.17 + i * 0.08, 3)}
                     for i, word in enumerate(['Uma', 'celula', 'é', 'dividida', 'em', 'duas.'])]
            python.write_text('#!/usr/bin/python3\nprint(' + repr(json.dumps(heard)) + ')\n')
            python.chmod(0o755)
            subprocess.run(['node', str(TOOLS / 'voice.mjs'), str(piece)], check=True, capture_output=True,
                           env={**os.environ, 'PATH': str(piece) + os.pathsep + os.environ['PATH']})
            data = json.loads((piece / 'voice.json').read_text())
            words = data['lines'][0]['words']
            self.assertEqual([w['w'] for w in words], script['lines'][0]['text'].split())
            self.assertTrue(all(not w.get('est') for w in words))
            self.assertTrue(all(w['t0'] <= w['t1'] for w in words))
            self.assertTrue(all(a['t1'] <= b['t0'] for a, b in zip(words, words[1:])))

    def test_failed_generation_keeps_existing_takes(self):
        with tempfile.TemporaryDirectory() as tmp:
            piece = Path(tmp)
            original = piece / 'voice/takes-1x/open.wav'
            original.parent.mkdir(parents=True)
            original.write_bytes(b'original')
            prepared = piece / 'voice/open.wav'
            prepared.write_bytes(b'prepared')
            (piece / 'voice/script.json').write_text(json.dumps({'lines': [
                {'id': 'open', 'text': 'Uma célula.'}]}))
            response = Mock()
            response.write_to_file.side_effect = OSError('interrupted download')
            cartesia = Mock()
            cartesia.Cartesia.return_value.tts.generate.return_value = response
            with patch.dict('sys.modules', {'cartesia': cartesia}), patch.object(voice, 'env_key', return_value='test'), patch('sys.argv', ['voice', str(piece), '--regenerate']):
                with self.assertRaises(OSError):
                    voice.main()
            self.assertEqual(original.read_bytes(), b'original')
            self.assertEqual(prepared.read_bytes(), b'prepared')

    def test_captions_use_current_export(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ['export.mjs', 'gpu.mjs']:
                (root / name).write_bytes((TOOLS / name).read_bytes())
            module = root / 'node_modules/playwright'
            module.mkdir(parents=True)
            (module / 'index.js').write_text('''
const meta = {frames:1,fps:30,width:16,height:16,narration:[{t0:0,t1:1,text:'Olá'}]};
const page = {goto:async()=>{}, waitForFunction:async()=>{}, close:async()=>{}, on:()=>{},
 evaluate:async(fn)=>fn.toString().includes('const T =') ? meta : ''};
exports.chromium = {launch:async()=>({newPage:async()=>page, close:async()=>{},
 newContext:async()=>({newPage:async()=>page})})};
''')
            ffmpeg = root / 'ffmpeg'
            ffmpeg.write_text('#!/usr/bin/env python3\nimport sys,json,os\nwith open(os.environ["FFMPEG_LOG"],"a") as f: f.write(json.dumps(sys.argv[1:])+"\\n")\n')
            ffmpeg.chmod(0o755)
            log = root / 'calls.jsonl'
            for options, expected in [(['--out', 'custom.mp4'], 'custom.mp4'), (['--format', '1:1'], 'final-16x16.mp4')]:
                log.write_text('')
                subprocess.run(['node', str(root / 'export.mjs'), str(root), '--no-audio', *options],
                               env={**os.environ, 'PATH': str(root) + os.pathsep + os.environ['PATH'], 'FFMPEG_LOG': str(log)},
                               check=True, capture_output=True)
                calls = [json.loads(line) for line in log.read_text().splitlines()]
                self.assertEqual(calls[1][calls[1].index('-i') + 1], str(root / 'renders' / expected))
                self.assertEqual(calls[1][-1], str(root / 'renders' / expected.replace('.mp4', '-captions.mp4')))


if __name__ == '__main__':
    unittest.main()
