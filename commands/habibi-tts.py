import sys, os, json, tempfile
os.environ['CUDA_VISIBLE_DEVICES'] = ''

from pathlib import Path
from importlib.resources import files
from cached_path import cached_path

from f5_tts.infer.utils_infer import load_model, load_vocoder, preprocess_ref_audio_text
from habibi_tts.infer.utils_infer import infer_process
from habibi_tts.model.utils import dialect_id_map

import soundfile as sf

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 habibi-tts.py <dialect> <text> <output_path>")
        sys.exit(1)

    dialect = sys.argv[1].upper()
    text = sys.argv[2]
    output_path = sys.argv[3]

    # Default ref audio/text
    ref_audio = str(files("habibi_tts").joinpath("assets/MSA.mp3"))
    ref_text = "كان اللعيب حاضرًا في العديد من الأنشطة والفعاليات المرتبطة بكأس العالم، مما سمح للجماهير بالتفاعل معه والتقاط الصور التذكارية."

    # Load model (cached_path will reuse downloaded files)
    ckpt_file = str(cached_path("hf://SWivid/Habibi-TTS/Unified/model_200000.safetensors"))
    vocab_file = str(cached_path("hf://SWivid/Habibi-TTS/Unified/vocab.txt"))

    from omegaconf import OmegaConf
    from hydra.utils import get_class

    model_cfg = OmegaConf.load(str(files("f5_tts").joinpath("configs/F5TTS_v1_Base.yaml")))
    model_cls = get_class(f"f5_tts.model.{model_cfg.model.backbone}")
    model_arc = model_cfg.model.arch
    vocoder_name = model_cfg.model.mel_spec.mel_spec_type

    device = "cpu"
    ema_model = load_model(model_cls, model_arc, ckpt_file, mel_spec_type=vocoder_name, vocab_file=vocab_file, device=device)
    vocoder = load_vocoder(vocoder_name=vocoder_name, device=device)

    dialect_id = dialect_id_map.get(dialect, None)

    ref_audio, ref_text = preprocess_ref_audio_text(ref_audio, ref_text)

    audio, sr, _ = infer_process(
        ref_audio, ref_text, text,
        ema_model, vocoder,
        mel_spec_type=vocoder_name,
        target_rms=0.15,
        cross_fade_duration=0.15,
        nfe_step=32,
        cfg_strength=2.0,
        sway_sampling_coef=-1.0,
        speed=1.0,
        fix_duration=None,
        device=device,
        dialect_id=dialect_id,
    )

    sf.write(output_path, audio, sr)
    print(f"OK:{output_path}")

if __name__ == "__main__":
    main()
