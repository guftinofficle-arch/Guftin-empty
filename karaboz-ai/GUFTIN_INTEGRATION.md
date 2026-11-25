# Guftin میں Karaboz AI شامل کرنے کی ہدایات

## موجودہ حقیقت
Karaboz AI کا FastAPI backend اس فولڈر میں تیار کیا گیا ہے۔ Guftin کی Android source files اس repository کے root میں موجود نہیں، اس لیے ابھی Android app میں code patch یا APK build نہیں کیا گیا۔

## API contract
- Health check: `GET /v1/health`
- Chat: `POST /v1/chat`
- JSON body: `{"message":"سلام","max_new_tokens":80}`
- اگر server پر `KARABOZ_API_KEY` مقرر ہو تو ہر chat request میں `X-API-Key` header بھیجیں۔
- کامیاب جواب میں `model`, `reply`, اور `notice` ہوں گے۔
- تربیت شدہ checkpoint نہ ہو تو chat endpoint HTTP 503 دے گا۔

## Android/Guftin integration checklist
1. Guftin کے chat screen میں الگ AI conversation entry بنائیں؛ عام user-to-user chats کو تبدیل نہ کریں۔
2. Android app میں HTTPS استعمال کرتے ہوئے اپنے deployed API کا base URL مقرر کریں۔ localhost صرف اسی کمپیوٹر کے مقامی ٹیسٹ کے لیے ہے، موبائل فون کے لیے نہیں۔
3. POST request میں JSON body کے طور پر message بھیجیں اور response کا `reply` دکھائیں۔
4. Loading، timeout، offline، HTTP 401، HTTP 422 اور HTTP 503 کی حالتیں UI میں سنبھالیں۔
5. API key کو Android APK میں مستقل secret سمجھ کر شامل نہ کریں؛ APK سے key نکالی جا سکتی ہے۔ عوامی ایپ کے لیے authenticated backend proxy، per-user authorization، rate limits، abuse protection اور HTTPS لازم ہیں۔
6. AI request کے لیے واضح privacy notice دیں۔ Guftin کے نجی پیغامات خودکار طور پر training data میں شامل نہ کریں۔

## فون پر آزمانے سے پہلے
- پہلے مقامی کمپیوٹر پر `GET /v1/health` کامیاب کریں۔
- ایک اجازت یافتہ UTF-8 corpus سے checkpoint train کریں۔
- backend کو محفوظ HTTPS hosting پر deploy کریں۔
- پھر Guftin Android source میں network client اور AI screen شامل کریں اور debug APK بنائیں۔

## اہم حد
موجودہ model ایک چھوٹا character-level learning baseline ہے۔ یہ ابھی معیاری اردو assistant نہیں، اور اس کا random character output حقیقی AI chat معیار نہیں رکھتا۔ اسے صرف backend wiring اور ابتدائی تجربے کے لیے استعمال کریں، عوامی صارفین کے لیے مکمل assistant کے طور پر نہیں۔
