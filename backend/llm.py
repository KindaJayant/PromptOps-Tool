import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "arcee/arcee-trinity-large")

async def call_llm(system_prompt: str, user_prompt: str):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 1024
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=60.0)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def run_judge(expected_output: str, actual_output: str):
    system_prompt = "You are an eval judge. Compare the actual output to the expected output. Return only JSON: { \"score\": float 0-1, \"reasoning\": string }. Score 1.0 = perfect match in intent, 0.0 = completely wrong."
    user_prompt = f"Expected: {expected_output}\nActual: {actual_output}"
    
    response_text = await call_llm(system_prompt, user_prompt)
    
    # Try to parse JSON from the response
    try:
        # Arcee might sometimes include markdown blocks, so let's clean it
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:-3].strip()
        
        result = json.loads(clean_text)
        return result
    except Exception as e:
        return {
            "score": 0.0,
            "reasoning": f"Failed to parse judge output: {str(e)}. Raw output: {response_text}"
        }
