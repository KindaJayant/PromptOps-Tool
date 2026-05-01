import asyncio
import json
import os
import random

import httpx
from dotenv import load_dotenv
from jinja2 import Template

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 2.0


def render_template(template_content: str, input_data: str):
    try:
        context = json.loads(input_data)
    except Exception:
        context = {"input": input_data}

    try:
        return Template(template_content).render(**context)
    except Exception as error:
        return f"Template rendering failed: {error}\n\nOriginal Content: {template_content}"


async def _generate_text(prompt: str):
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set")

    url = f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(MAX_RETRIES):
            response = await client.post(
                url,
                params={"key": GEMINI_API_KEY},
                json=payload,
            )

            if response.status_code in (429, 503):
                if attempt == MAX_RETRIES - 1:
                    response.raise_for_status()
                retry_after = response.headers.get("retry-after")
                retry_after_seconds = float(retry_after) if retry_after and retry_after.isdigit() else 0.0
                delay = max(retry_after_seconds, BASE_BACKOFF_SECONDS * (2**attempt) + random.uniform(0, 0.6))
                await asyncio.sleep(delay)
                continue

            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates") or []
            if not candidates:
                raise RuntimeError("Gemini returned no candidates")

            parts = candidates[0].get("content", {}).get("parts", [])
            text_chunks = [part.get("text", "") for part in parts if part.get("text")]
            if not text_chunks:
                raise RuntimeError("Gemini returned an empty response")
            return "\n".join(text_chunks).strip()


async def call_llm(template_content: str, input_data: str):
    rendered_prompt = render_template(template_content, input_data)
    return await _generate_text(rendered_prompt)


def _extract_json_block(response_text: str):
    clean_text = response_text.strip()
    if "```json" in clean_text:
        clean_text = clean_text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in clean_text:
        clean_text = clean_text.split("```", 1)[1].split("```", 1)[0].strip()

    start = clean_text.find("{")
    end = clean_text.rfind("}")
    if start != -1 and end != -1 and end >= start:
        clean_text = clean_text[start : end + 1]
    return clean_text


async def run_judge(expected_output: str, actual_output: str):
    judge_prompt = (
        'You are an eval judge. Compare the actual output to the expected output. '
        'Return only JSON in this exact shape: {"score": float, "reasoning": string}. '
        "Score 1.0 means the actual output fully matches the expected intent and constraints. "
        "Score 0.0 means it is completely wrong."
        f"\n\nExpected:\n{expected_output}\n\nActual:\n{actual_output}"
    )

    response_text = await _generate_text(judge_prompt)

    try:
        return json.loads(_extract_json_block(response_text))
    except Exception as error:
        return {
            "score": 0.0,
            "reasoning": f"Failed to parse judge output: {error}. Raw output: {response_text}",
        }
