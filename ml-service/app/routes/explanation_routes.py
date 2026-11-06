
import json
import logging
import re

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import MODEL_API_URL


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["Legal Explanation"]
)


# =========================================================
# SYSTEM PROMPT
# =========================================================

SYSTEM_PROMPT = """
You are Nyaya-Path, an Indian legal language translator
and public legal education assistant.

YOUR PRIMARY OBJECTIVE:

Transform complicated Indian legal provisions into
simple, conversational language that an ordinary person
with no legal education can understand.

You are NOT supposed to merely summarize, reorganize,
or categorize the original statutory text.

You must explain what the law actually means in
everyday situations.

IMPORTANT INSTRUCTIONS:

1. SIMPLE LANGUAGE
- Use the response language specified in the user prompt.
- If English is requested, use everyday English.
- Avoid complicated legal vocabulary wherever possible.
- Write as if explaining something to an ordinary person.
- Prefer short sentences.
- Do not copy sentences directly from the legal text
  unless quoting a necessary legal term.

2. EXPLAIN LEGAL TERMINOLOGY
- Identify difficult legal words and phrases.
- Explain what each means in simple language.
- Retain important legal terms and explain them immediately.

3. RELATABLE EXAMPLES
- Give realistic examples involving ordinary people.
- Use situations involving families, workplaces,
  public places, police interactions and courts where relevant.
- Clearly label hypothetical examples.
- Never present hypothetical situations as actual cases.

4. EXPLAIN PRACTICAL IMPACT
- Explain how the provision affects an ordinary person.
- Explain when or why it becomes relevant.
- Describe what a person should understand from it.

5. LEGAL ACCURACY
- Use only the supplied statutory text as the legal basis.
- Never invent a punishment, right, procedure or exception.
- Preserve all important conditions and limitations.
- If punishment is not specified in the provision,
  explicitly state that.
- If the provision depends on another section,
  mention that dependency.
- Do not turn a legal possibility into a legal certainty.
- Do not confuse a hypothetical example with a legal rule.

6. AUDIENCE
Assume the reader:
- Has never studied law.
- Does not understand legal terminology.
- Wants to understand how the law relates to daily life.

7. OUTPUT FORMAT

Return valid JSON only, using exactly these keys:

{
    "simple_explanation": "...",
    "technical_terms_explained": "...",
    "why_this_law_matters": "...",
    "real_life_example": "...",
    "conditions_and_exceptions": "...",
    "punishment_or_legal_consequence": "..."
}

Each field must contain a meaningful explanation.
Do not merely repeat the original statutory text.
Do not use unnecessary legal jargon.
Do not provide personalized legal advice.
"""


# =========================================================
# REQUIRED RESPONSE FIELDS
# =========================================================

REQUIRED_FIELDS = {
    "simple_explanation",
    "technical_terms_explained",
    "why_this_law_matters",
    "real_life_example",
    "conditions_and_exceptions",
    "punishment_or_legal_consequence"
}


# =========================================================
# REQUEST MODEL
# =========================================================

class ExplainRequest(BaseModel):

    act: str = Field(min_length=1)

    section: str = Field(min_length=1)

    legal_text: str = Field(min_length=10)
    language: str = Field(default="en", pattern="^(en|hi|kn|mr)$")


# =========================================================
# HELPER: EXTRACT JSON FROM MODEL RESPONSE
# =========================================================

def extract_json(content: str) -> dict:

    if not content or not content.strip():
        raise ValueError("Empty Qwen response")

    content = content.strip()

    # Remove Markdown code fences if present
    content = re.sub(
        r"^```(?:json)?\s*",
        "",
        content,
        flags=re.IGNORECASE
    )

    content = re.sub(
        r"\s*```$",
        "",
        content
    )

    try:
        explanation = json.loads(content)

    except json.JSONDecodeError:

        # Attempt to extract the first JSON object
        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end == -1 or end <= start:
            raise ValueError(
                "Qwen did not return a valid JSON object"
            )

        explanation = json.loads(
            content[start:end + 1]
        )

    if not isinstance(explanation, dict):
        raise ValueError("Expected a JSON object")

    return explanation


def extract_completion(result: dict) -> tuple[str, str | None]:
    if not isinstance(result, dict):
        raise ValueError("Qwen returned an invalid completion response")

    choices = result.get("choices")
    if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
        raise ValueError("Qwen returned no completion choices")

    message = choices[0].get("message")
    content = message.get("content") if isinstance(message, dict) else None
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Qwen returned empty explanation content")

    finish_reason = choices[0].get("finish_reason")
    return content, finish_reason if isinstance(finish_reason, str) else None


def parse_explanation(content: str) -> dict:
    return validate_explanation(extract_json(content))


def build_retry_payload(payload: dict, user_prompt: str) -> dict:
    return {
        **payload,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": (
                    user_prompt
                    + "\nReturn exactly one JSON object with the six required keys. "
                    "Do not include reasoning, markdown, or text outside the JSON object."
                    "\n/no_think"
                )
            }
        ]
    }


# =========================================================
# HELPER: VALIDATE EXPLANATION
# =========================================================

def validate_explanation(explanation: dict) -> dict:

    missing_fields = REQUIRED_FIELDS - explanation.keys()

    if missing_fields:

        logger.error(
            "Missing explanation fields: %s",
            missing_fields
        )

        raise ValueError(
            f"Missing required fields: {missing_fields}"
        )

    validated = {}

    for field in REQUIRED_FIELDS:

        value = explanation[field]

        if not isinstance(value, str):

            raise ValueError(
                f"Invalid response type for field: {field}"
            )

        if not value.strip():

            raise ValueError(
                f"Empty explanation field: {field}"
            )

        validated[field] = value.strip()

    return validated


# =========================================================
# MAIN EXPLANATION ENDPOINT
# =========================================================

@router.post("/explain")
async def explain_section(
    request: Request,
    data: ExplainRequest
):

    # -----------------------------------------------------
    # DEBUG: Inspect incoming request
    # -----------------------------------------------------

    logger.info("========== EXPLANATION REQUEST ==========")

    logger.info("Act: %s", data.act)

    logger.info("Section: %s", data.section)

    logger.info("Legal text length: %s", len(data.legal_text))

    logger.info(
        "Content-Type: %s",
        request.headers.get("content-type")
    )

    # -----------------------------------------------------
    # Construct user prompt
    # -----------------------------------------------------

    language_name = {
        "en": "English",
        "hi": "Hindi",
        "kn": "Kannada",
        "mr": "Marathi"
    }[data.language]

    user_prompt = f"""
Act: {data.act}

Provision: Section {data.section}

Response language: {language_name}

Official statutory text:

<statutory_text>
{data.legal_text}
</statutory_text>

YOUR TASK:

Explain this legal provision to an ordinary person
who has never studied law.

Do not simply summarize or rearrange the statutory text.

Translate technical legal terminology into everyday language.

Explain why the provision matters in real life.

Give a realistic hypothetical example.

Preserve all important legal conditions and exceptions.

If the supplied provision does not specify a punishment,
clearly state that.

Return all six fields specified in the system prompt.

Write every explanation value in {language_name}. Keep the six JSON keys in
English exactly as specified in the system prompt.

Return valid JSON only.
"""

    # -----------------------------------------------------
    # QWEN REQUEST PAYLOAD
    # -----------------------------------------------------

    payload = {
        "model": "Qwen/Qwen3-4B-GGUF:Q4_K_M",

        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_prompt + "\n/no_think"
            }
        ],

        "temperature": 0.1,

        "max_tokens": 1200,

        "response_format": {
            "type": "json_object"
        }
    }

    # -----------------------------------------------------
    # CALL QWEN MODEL
    # -----------------------------------------------------

    try:

        async with httpx.AsyncClient(
            timeout=300.0
        ) as client:

            response = await client.post(
                MODEL_API_URL,
                json=payload
            )

            response.raise_for_status()

            content, finish_reason = extract_completion(response.json())
            try:
                explanation = parse_explanation(content)
            except (json.JSONDecodeError, ValueError):
                logger.warning(
                    "Qwen returned invalid explanation output "
                    "(finish_reason=%s, content_length=%d); retrying once",
                    finish_reason,
                    len(content)
                )
                retry_payload = build_retry_payload(payload, user_prompt)
                retry_response = await client.post(
                    MODEL_API_URL,
                    json=retry_payload
                )
                retry_response.raise_for_status()
                retry_content, _ = extract_completion(retry_response.json())
                explanation = parse_explanation(retry_content)

        disclaimers = {
            "en": "AI-generated information for general understanding. This is not a substitute for professional legal advice.",
            "hi": "यह जानकारी सामान्य समझ के लिए AI द्वारा तैयार की गई है। यह पेशेवर कानूनी सलाह का विकल्प नहीं है।",
            "kn": "ಈ ಮಾಹಿತಿಯನ್ನು ಸಾಮಾನ್ಯ ತಿಳುವಳಿಕೆಗಾಗಿ AI ರಚಿಸಿದೆ. ಇದು ವೃತ್ತಿಪರ ಕಾನೂನು ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.",
            "mr": "ही माहिती सामान्य समजुतीसाठी AI ने तयार केली आहे. हा व्यावसायिक कायदेशीर सल्ल्याचा पर्याय नाही."
        }

        logger.info(
            "Explanation generated for %s Section %s in %s",
            data.act,
            data.section,
            data.language
        )

        # -------------------------------------------------
        # FINAL API RESPONSE
        # -------------------------------------------------

        return {
            "act": data.act,

            "section": data.section,

            "explanation": explanation,

            "disclaimer": disclaimers[data.language]
        }

    # -----------------------------------------------------
    # HTTP ERRORS FROM QWEN
    # -----------------------------------------------------

    except httpx.HTTPStatusError as error:

        logger.error(
            "Qwen returned HTTP %s: %s",
            error.response.status_code,
            error.response.text[:500]
        )

        raise HTTPException(
            status_code=502,
            detail="The AI model service returned an error."
        ) from error

    # -----------------------------------------------------
    # CONNECTION ERRORS
    # -----------------------------------------------------

    except httpx.RequestError as error:

        logger.exception(
            "Could not connect to Qwen"
        )

        raise HTTPException(
            status_code=503,
            detail="The AI model is currently unavailable."
        ) from error

    # -----------------------------------------------------
    # INVALID MODEL RESPONSE
    # -----------------------------------------------------

    except (
        KeyError,
        IndexError,
        json.JSONDecodeError,
        ValueError
    ) as error:

        logger.exception(
            "Invalid Qwen response"
        )

        raise HTTPException(
            status_code=502,
            detail="Could not generate a valid legal explanation."
        ) from error

    # -----------------------------------------------------
    # UNEXPECTED ERRORS
    # -----------------------------------------------------

    except Exception as error:

        logger.exception(
            "Unexpected explanation error"
        )

        raise HTTPException(
            status_code=500,
            detail="Unexpected error while generating explanation."
        ) from error


# =========================================================
# DEBUG ENDPOINT
# =========================================================

@router.post("/debug")
async def debug_request(request: Request):

    raw_body = await request.body()

    return {
        "method": request.method,

        "content_type": request.headers.get("content-type"),

        "body": raw_body.decode(
            "utf-8",
            errors="replace"
        )
    }
