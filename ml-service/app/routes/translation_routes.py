import json
import logging

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import MODEL_API_URL

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Legal Translation"])


class TranslationRequest(BaseModel):
    target_language: str = Field(pattern="^(Hindi|Kannada|Marathi)$")
    texts: list[str] = Field(min_length=1, max_length=30)


class TranslationResponse(BaseModel):
    target_language: str
    translations: list[str]


@router.post("/translate", response_model=TranslationResponse)
async def translate_batch(data: TranslationRequest):
    if any(not text.strip() or len(text) > 4000 for text in data.texts):
        raise HTTPException(
            status_code=422,
            detail="Each text must contain 1 to 4000 characters."
        )
    if sum(len(text) for text in data.texts) > 15000:
        raise HTTPException(
            status_code=422,
            detail="A translation batch cannot exceed 15000 characters."
        )

    prompt = f"""
Translate each input item into {data.target_language}. Return a JSON object with
exactly one key, "translations", whose value is an array of strings in the same
order and with exactly {len(data.texts)} items. Translate faithfully, preserve
legal meaning, names, section numbers, citations, punctuation, and paragraph
breaks. Translate official Indian Act names into the target language and retain
their abbreviations (BNS or BNSS) in parentheses. Do not add explanations or
omit content. This is machine translation, not legal advice.

Input strings:
{json.dumps(data.texts, ensure_ascii=False)}
"""
    payload = {
        "model": "Qwen/Qwen3-4B-GGUF:Q4_K_M",
        "messages": [
            {"role": "system", "content": "You are a precise legal-document translator. Return valid JSON only."},
            {"role": "user", "content": prompt + "\n/no_think"}
        ],
        "temperature": 0.1,
        "max_tokens": min(3000, max(500, sum(len(text) for text in data.texts) * 2)),
        "response_format": {"type": "json_object"}
    }

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(MODEL_API_URL, json=payload)
            response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        result = json.loads(content)
        translations = result.get("translations")
        if (
            not isinstance(translations, list)
            or len(translations) != len(data.texts)
            or any(not isinstance(item, str) or not item.strip() for item in translations)
        ):
            raise ValueError("The model returned an incomplete translation batch.")
        return TranslationResponse(
            target_language=data.target_language,
            translations=[item.strip() for item in translations]
        )
    except httpx.HTTPStatusError as error:
        logger.exception("Translation model returned an HTTP error")
        raise HTTPException(status_code=502, detail="The translation model returned an error.") from error
    except httpx.RequestError as error:
        logger.exception("Could not connect to the translation model")
        raise HTTPException(status_code=503, detail="The translation model is currently unavailable.") from error
    except (KeyError, IndexError, json.JSONDecodeError, ValueError) as error:
        logger.exception("Translation model returned an invalid response")
        raise HTTPException(status_code=502, detail="Could not produce a complete translation.") from error
