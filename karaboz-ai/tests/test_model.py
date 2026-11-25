import unittest
import torch
from model.karaboz import KarabozLM, ModelConfig


class KarabozModelTests(unittest.TestCase):
    def test_forward_and_loss(self):
        cfg = ModelConfig(vocab_size=32, block_size=16, n_embd=32, n_head=4, n_layer=2, dropout=0.0)
        model = KarabozLM(cfg)
        x = torch.randint(0, cfg.vocab_size, (2, 8))
        logits, loss = model(x, x)
        self.assertEqual(tuple(logits.shape), (2, 8, cfg.vocab_size))
        self.assertTrue(torch.isfinite(loss).item())

    def test_generation_length(self):
        cfg = ModelConfig(vocab_size=16, block_size=8, n_embd=16, n_head=4, n_layer=1, dropout=0.0)
        model = KarabozLM(cfg)
        prompt = torch.randint(0, cfg.vocab_size, (1, 4))
        output = model.generate(prompt, max_new_tokens=3)
        self.assertEqual(output.shape[1], 7)


if __name__ == "__main__":
    unittest.main()
