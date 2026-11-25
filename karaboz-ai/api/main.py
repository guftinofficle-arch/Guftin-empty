"""Local development API for Karaboz Mini."""
import os
from pathlib import Path
import torch
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from model.karaboz import KarabozLM, ModelConfig

app = FastAPI(title="Karaboz AI API", version="0.1.0")
CHECKPOINT = Path(os.getenv("KARABOZ_CHECKPOINT", "checkpoints/karaboz-mini.pt"))
API_KEY = os.getenv("KARABOZ_API_KEY", "")
model = None
vocab = None
device = "cuda" if torch.cuda.is_available() else "cpu"


@app.on_event("startup")
def load_model():
    global model, vocab
    if CHECKPOINT.exists():
        payload = torch.load(CHECKPOINT, map_location=device, weights_only=False)
        cfg = ModelConfig(**payload["config"])
        model = KarabozLM(cfg).to(device)
        model.load_state_dict(payload["state_dict"])
        model.eval()
        vocab = payload["vocab"]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    max_new_tokens: int = Field(default=80, ge=1, le=160)


@app.get("/v1/health")
def health():
    return {"service": "Karaboz AI", "status": "ready" if model else "not_trained",
            "checkpoint_loaded": model is not None, "device": device}


@app.post("/v1/chat")
def chat(body: ChatRequest, x_api_key: str | None = Header(default=None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    if model is None or vocab is None:
        raise HTTPException(status_code=503, detail="No trained checkpoint. Train the model first.")
    stoi = {ch: i for i, ch in enumerate(vocab)}
    itos = {i: ch for i, ch in enumerate(vocab)}
    unknown = next((ch for ch in body.message if ch not in stoi), None)
    if unknown is not None:
        raise HTTPException(status_code=422, detail="Input contains characters absent from the training vocabulary.")
    idx = torch.tensor([[stoi[ch] for ch in body.message]], dtype=torch.long, device=device)
    output = model.generate(idx, max_new_tokens=body.max_new_tokens)
    generated = output[0, idx.shape[1]:].tolist()
    return {"model": "karaboz-mini", "reply": "".join(itos[i] for i in generated),
            "notice": "Experimental character-level baseline; not a production assistant."}
