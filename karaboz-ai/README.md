# Karaboz AI

An independent, zero-budget-first AI research project intended for later integration with Guftin.

## Current stage
This repository contains the **initial engineering scaffold**, not a trained assistant. The first model is deliberately small so it can be studied and tested on modest hardware. It will not have ChatGPT-level capability.

## Architecture
- `model/`: a small decoder-only Transformer language model
- `training/`: local text preparation and training
- `api/`: FastAPI inference service; refuses chat requests until a trained checkpoint exists
- `data/`: place legally usable plain-text training material here (not committed)
- `checkpoints/`: generated model files (not committed)

## Start locally
1. Create a Python virtual environment.
2. Install `requirements.txt`.
3. Put a UTF-8 plain-text corpus you have permission to use at `data/train.txt`.
4. Run `python -m training.train --input data/train.txt --steps 500`.
5. Start the API with `uvicorn api.main:app --host 127.0.0.1 --port 8000`.

Training on CPU may be very slow. Free hosted GPU runtimes have quotas and may disconnect. Do not expose this development API publicly without authentication, HTTPS, rate limits, and resource limits.

## API
- `GET /v1/health`: reports whether a trained checkpoint is available
- `POST /v1/chat`: generates text only after a checkpoint has been trained

Example:
```json
{"message":"سلام، آپ کون ہیں؟","max_new_tokens":80}
```

## Important limitations
The initial character-level tokenizer and tiny model are a learning baseline, not a production-grade multilingual LLM. A stronger tokenizer, larger legally sourced dataset, evaluation suite, instruction tuning, safety testing, and capable inference hardware are required before public release.

## Privacy
Do not train on private Guftin messages or user data without explicit, informed permission. Keep credentials and datasets out of Git.
