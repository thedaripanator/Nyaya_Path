import logging
from typing import Dict, Any, Optional
from app.services.common.qdrant_service import search_documents
from app.services.common.llm_client import get_chat_llm, is_llm_configured
from app.services.citizen.citizen_prompt import get_citizen_prompt_template
from app.services.citizen.citizen_response import format_citizen_sources

logger = logging.getLogger(__name__)


def ask_citizen(
    question: str,
    k: int = 5,
    filter_dict: Optional[Dict[str, Any]] = None,
    language: str = "English",
) -> Dict[str, Any]:
    """
    Executes the Citizen RAG pipeline:
    1. Embeds user question and searches Qdrant vector database.
    2. Formats retrieved judgment context with plain source tags.
    3. Prompts the configured LLM with citizen-focused plain-language instructions.
    4. Explains concepts simply with examples and terminology breakdowns.
    5. Returns simplified answer and source references.
    """
    logger.info(f"Citizen RAG inquiry received: '{question}' (k={k}, language={language})")

    retrieved_docs = search_documents(query=question, k=k, filter_dict=filter_dict)

    if not retrieved_docs:
        logger.info("No relevant judgment documents found for citizen query.")
        return {
            "answer": (
                "I searched our Indian court judgment database, but I couldn't find enough information "
                "about your question in the available records.\n\n"
                "To ensure accuracy and prevent incorrect legal information, Nyaya-Path only provides answers "
                "substantiated by verified judgments. Please try rephrasing your question or check if relevant judgments have been uploaded."
            ),
            "sources": [],
        }

    context_chunks = []
    for idx, doc in enumerate(retrieved_docs, start=1):
        meta = doc.metadata or {}
        source_name = meta.get("source", "Court Document")
        page_num = meta.get("page", 1)
        case_title = meta.get("case_name") or meta.get("title", "")
        header = f"[Record {idx}: {source_name}"
        if case_title:
            header += f" - {case_title}"
        if page_num:
            header += f" (Page {page_num})"
        header += "]"
        context_chunks.append(f"{header}\n{doc.page_content.strip()}")

    formatted_context = "\n\n".join(context_chunks)
    sources = format_citizen_sources(retrieved_docs)

    if not is_llm_configured():
        logger.warning("LLM API key is not configured.")
        preview_text = "\n\n".join(
            [f"- **{s.get('source', 'Document')}** (Page {s.get('page', '1')}): {d.page_content[:200]}..."
             for s, d in zip(sources, retrieved_docs[:3])]
        )
        return {
            "answer": (
                "An LLM API key is not configured in `ml-service/.env`.\n\n"
                f"We retrieved {len(retrieved_docs)} relevant legal document chunk(s) from the database:\n\n"
                f"{preview_text}\n\n"
                "*Please configure GOOGLE_API_KEY in the ML service environment to enable Gemini responses.*"
            ),
            "sources": sources,
        }

    try:
        prompt_template = get_citizen_prompt_template()
        llm = get_chat_llm(temperature=0.2)

        chain = prompt_template | llm
        response = chain.invoke(
            {
                "context": formatted_context,
                "question": question,
                "language": language or "English",
            }
        )

        answer_text = response.content if hasattr(response, "content") else str(response)

        disclaimer = (
            "\n\n---\n*Disclaimer: Nyaya-Path is an informational AI platform and does not provide legal advice. "
            "Please consult a certified legal advocate for specific legal situations.*"
        )
        if "Disclaimer" not in answer_text:
            answer_text += disclaimer

        return {
            "answer": answer_text,
            "sources": sources,
        }

    except Exception as e:
        logger.error(f"Error during Citizen LLM inference: {e}", exc_info=True)
        return {
            "answer": "An error occurred while preparing your explanation. Please try again later.",
            "sources": sources,
        }
