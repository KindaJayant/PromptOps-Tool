import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv("d:/prompt-ops-tool/backend/.env")
key = os.getenv("OPENROUTER_API_KEY")

url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}
payload = {
    "model": "arcee/arcee-trinity-large",
    "messages": [{"role": "user", "content": "hi"}],
    "max_tokens": 10
}
try:
    resp = httpx.post(url, headers=headers, json=payload)
    with open('d:/prompt-ops-tool/out.txt', 'w') as f:
        f.write(resp.text)
except Exception as e:
    with open('d:/prompt-ops-tool/out.txt', 'w') as f:
        f.write(str(e))
