import logging
from app.config import GOOGLE_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)


def is_llm_configured() -> bool:
    return bool(GOOGLE_API_KEY and not GOOGLE_API_KEY.startswith(("YOUR_", "PUT_")))


def get_chat_llm(
    temperature: float = 0.2,
    request_timeout: float | None = None,
    retries: int = 6,
    thinking_level: str | None = None,
    include_thoughts: bool | None = None,
    max_tokens: int | None = None,
):
    """
    Returns the configured Gemini chat model.
    """
    if GOOGLE_API_KEY and not GOOGLE_API_KEY.startswith(("YOUR_", "PUT_")):
        from langchain_google_genai import ChatGoogleGenerativeAI

        model_options = {
            "model": GEMINI_MODEL,
            "google_api_key": GOOGLE_API_KEY,
            "temperature": temperature,
            "retries": retries,
        }
        if request_timeout is not None:
            model_options["request_timeout"] = request_timeout
        if thinking_level is not None:
            model_options["thinking_level"] = thinking_level
        if include_thoughts is not None:
            model_options["include_thoughts"] = include_thoughts
        if max_tokens is not None:
            model_options["max_tokens"] = max_tokens

        return ChatGoogleGenerativeAI(
            **model_options,
        )

    raise RuntimeError("No Gemini API key is configured. Set GOOGLE_API_KEY in ml-service/.env")
