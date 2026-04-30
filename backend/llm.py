import json
import os

import httpx
from dotenv import load_dotenv
from jinja2 import Template

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it:free")

def render_template(template_content: str, input_data: str):
    # Try to parse input_data as JSON for Jinja2 context
    try:
        context = json.loads(input_data)
    except Exception:
        context = {"input": input_data}

    try:
        return Template(template_content).render(**context)
    except Exception as e:
        return f"Template rendering failed: {str(e)}\n\nOriginal Content: {template_content}"

async def call_llm(template_content: str, input_data: str):
    rendered_prompt = render_template(template_content, input_data)
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "user", "content": rendered_prompt}
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
    
    # Combine system and user prompt for call_llm (which now just takes rendered content)
    combined_content = f"{system_prompt}\n\n{user_prompt}"
    response_text = await call_llm(combined_content, "{}")
    
    # Try to parse JSON from the response
    try:
        clean_text = response_text.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(clean_text)
        return result
    except Exception as e:
        return {
            "score": 0.0,
            "reasoning": f"Failed to parse judge output: {str(e)}. Raw output: {response_text}"
        }
