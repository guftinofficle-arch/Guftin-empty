# Karaboz AI شروع کرنے کا آسان طریقہ

یہ پہلا مرحلہ ایک چھوٹا تجرباتی Transformer ہے۔ ابھی یہ ChatGPT جیسا تیار AI نہیں ہے۔

## Windows پر

1. Python 3.11 انسٹال کریں۔
2. اس فولڈر میں Terminal کھولیں: `karaboz-ai`
3. کمانڈ چلائیں:

```powershell
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

4. اپنی اجازت والا UTF-8 متن `data/train.txt` میں رکھیں۔ نجی چیٹس، پاس ورڈز یا ذاتی معلومات استعمال نہ کریں۔
5. ماڈل کی ابتدائی تربیت:

```powershell
python -m training.train --input data/train.txt --steps 500
```

6. API چلائیں:

```powershell
uvicorn api.main:app --host 127.0.0.1 --port 8000
```

7. براؤزر میں `http://127.0.0.1:8000/docs` کھول کر API دیکھیں۔

## احتیاط
- CPU پر تربیت سست ہو سکتی ہے۔
- API کو ابھی صرف اپنے کمپیوٹر پر چلائیں؛ اسے عوامی انٹرنیٹ پر نہ کھولیں۔
- یہ ابتدائی character-level نمونہ ہے، مضبوط اردو/انگریزی اسسٹنٹ نہیں۔
- کسی بھی عوامی استعمال سے پہلے authentication، rate limits، HTTPS، privacy controls اور بہتر tokenizer/model ضروری ہیں۔
