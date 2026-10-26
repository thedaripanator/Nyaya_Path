import logging
from typing import Dict, Any, Optional
from app.services.common.qdrant_service import search_documents
from app.services.common.llm_client import get_chat_llm, is_llm_configured
from app.services.lawyer.lawyer_prompt import get_lawyer_prompt_template
from app.services.lawyer.citation_service import extract_citations

logger = logging.getLogger(__name__)


def ask_lawyer(
    question: str,
    k: int = 5,
    filter_dict: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes the Lawyer RAG pipeline:
    1. Embeds question and searches Qdrant for top-k judgment chunks.
    2. Formats retrieved chunks with page and source citations.
    3. Prompts Google Gemini with strict Indian legal research instructions.
    4. Enforces 7-part structured response without hallucinations.
    5. Returns answer along with verified source citations.

    Args:
        question: Legal research query.
        k: Number of relevant chunks to retrieve (default: 5).
        filter_dict: Optional metadata filter (e.g. source_type, owner_id).

    Returns:
        Dict: {"answer": str, "sources": List[Dict[str, Any]]}
    """
    logger.info(f"Lawyer RAG inquiry received: '{question}' (k={k})")

    # 1. Retrieve relevant judgment chunks from Qdrant
    retrieved_docs = search_documents(query=question, k=k, filter_dict=filter_dict)

    if not retrieved_docs:
        logger.info("No relevant judgment documents found in vector store.")
        return {
            "answer": (
                "### 1. Legal Issue\n"
                f"Inquiry regarding: {question}\n\n"
                "### 2. Applicable Laws / Sections\n"
                "Information not available in database.\n\n"
                "### 3. Relevant Cases\n"
                "No matching cases found in the current legal knowledge base.\n\n"
                "### 4. Court's Decision\n"
                "N/A\n\n"
                "### 5. Court's Reasoning\n"
                "The retrieved legal records do not contain precedents or judgment excerpts matching this query. "
                "Per system safety guidelines, no ungrounded legal claims or cases are fabricated.\n\n"
                "### 6. Similar Cases\n"
                "None retrieved.\n\n"
                "### 7. Sources / References\n"
                "No database records matched this search. Please ensure the Kaggle dataset is loaded or upload relevant case PDFs."
            ),
            "sources": [],
        }

    # 2. Format context for prompt
    context_chunks = []
    for idx, doc in enumerate(retrieved_docs, start=1):
        meta = doc.metadata or {}
        source_name = meta.get("source", "Unknown Document")
        page_num = meta.get("page", "N/A")
        case_title = meta.get("case_name") or meta.get("title", "Case Reference")
        citation_info = meta.get("citation", "")

        header = f"[Chunk {idx} | Source: {source_name} | Page: {page_num} | Case: {case_title}"
        if citation_info:
            header += f" | Citation: {citation_info}"
        header += "]"

        context_chunks.append(f"{header}\n{doc.page_content.strip()}")

    formatted_context = "\n\n".join(context_chunks)
    sources = extract_citations(retrieved_docs)

    if not is_llm_configured():
        logger.warning("LLM API key is not configured.")
        preview_text = "\n\n".join([f"- **{s.get('source', 'Doc')}** (Page {s.get('page', '1')}): {d.page_content[:200]}..." for s, d in zip(sources, retrieved_docs[:3])])
        return {
            "answer": (
                "### Legal Research Result (Offline / API Key Pending)\n\n"
                "No LLM API key is configured in `ml-service/.env`.\n\n"
                f"**Retrieved {len(retrieved_docs)} relevant legal document chunk(s) from Qdrant:**\n\n"
                f"{preview_text}\n\n"
                "*Please set GOOGLE_API_KEY to generate the full structured Gemini analysis.*"
            ),
            "sources": sources,
        }

    try:
        prompt_template = get_lawyer_prompt_template()
        llm = get_chat_llm(
            temperature=0.1,
            request_timeout=90,
            retries=0,
            thinking_level="low",
            include_thoughts=False,
            max_tokens=2048,
        )

        chain = prompt_template | llm
        response = chain.invoke(
            {
                "context": formatted_context,
                "question": question,
            }
        )

        content = response.content if hasattr(response, "content") else response
        if isinstance(content, str):
            answer_text = content
        elif isinstance(content, list):
            answer_text = "\n".join(
                part if isinstance(part, str) else part["text"]
                for part in content
                if isinstance(part, str) or (isinstance(part, dict) and isinstance(part.get("text"), str))
            )
        else:
            answer_text = str(content)
        if not answer_text.strip():
            raise ValueError("Gemini returned no text for the legal research answer.")
        return {
            "answer": answer_text,
            "sources": sources,
        }

    except Exception as e:
        logger.error(f"Error during Lawyer LLM inference: {e}", exc_info=True)
        return {
            "answer": "An error occurred while generating the legal analysis. Please try again later.",
            "sources": sources,
        }
