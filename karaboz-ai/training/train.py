"""Train the tiny Karaboz baseline on a permitted UTF-8 text corpus."""
import argparse
import json
from pathlib import Path
import torch
from model.karaboz import KarabozLM, ModelConfig


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/train.txt")
    parser.add_argument("--steps", type=int, default=500)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--block-size", type=int, default=128)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    args = parser.parse_args()

    source = Path(args.input)
    if not source.exists():
        raise SystemExit(f"Training file not found: {source}")
    text = source.read_text(encoding="utf-8")
    if len(text) < 1000:
        raise SystemExit("Please provide at least 1,000 characters of permitted training text.")

    chars = sorted(set(text))
    stoi = {ch: i for i, ch in enumerate(chars)}
    encoded = torch.tensor([stoi[ch] for ch in text], dtype=torch.long)
    if len(encoded) <= args.block_size + 1:
        raise SystemExit("Corpus is too short for the selected block size.")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    cfg = ModelConfig(vocab_size=len(chars), block_size=args.block_size)
    model = KarabozLM(cfg).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate)

    def batch():
        starts = torch.randint(0, len(encoded) - args.block_size - 1, (args.batch_size,))
        x = torch.stack([encoded[s:s + args.block_size] for s in starts]).to(device)
        y = torch.stack([encoded[s + 1:s + args.block_size + 1] for s in starts]).to(device)
        return x, y

    model.train()
    for step in range(args.steps):
        x, y = batch()
        _, loss = model(x, y)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        if (step + 1) % 50 == 0:
            print(f"step {step + 1}/{args.steps} loss={loss.item():.4f} device={device}")

    out = Path("checkpoints")
    out.mkdir(exist_ok=True)
    torch.save({"config": cfg.to_dict(), "state_dict": model.state_dict(), "vocab": chars},
               out / "karaboz-mini.pt")
    (out / "tokenizer.json").write_text(json.dumps({"chars": chars}, ensure_ascii=False), encoding="utf-8")
    print(f"Saved baseline checkpoint to {out / 'karaboz-mini.pt'}")


if __name__ == "__main__":
    main()
