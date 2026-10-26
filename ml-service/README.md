# Nyaya-Path ML/AI Service ⚖️

AI-Powered Legal Information and Research System for Indian Law.

Nyaya-Path is a specialized legal research and plain-language assistant built using **FastAPI**, **LangChain**, **Qdrant**, **Sentence Transformers**, and **Google Gemini**.

It provides two distinct, tailored interfaces backed by a unified legal knowledge base:
1. **Citizen Assistant**: Explains legal rights, sections, and concepts in simple, accessible language without confusing legal jargon.
2. **Lawyer Assistant**: Delivers rigorous 7-part legal research briefings (Legal Issue, Applicable Laws, Relevant Cases, Decisions, Reasoning, Precedents, Sources) with precise source citations.

---

## 🏗️ Architecture & Data Flow

```text
                    React Frontend
                         │
                    Spring Boot
                         │ REST API
                         ▼
                    Python FastAPI
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
    Citizen RAG                    Lawyer RAG
  (Plain Language)             (7-Part Research)
          │                             │
          └──────────────┬──────────────┘
                         │
                     LangChain
                         │
                      Qdrant
               (Vector Database)
                         │
               ┌─────────┴─────────┐
               ▼                   ▼
       Kaggle SC Dataset     Lawyer Uploads
       (Public Knowledge)  (Private/Isolated)
               │                   │
               └─────────┬─────────┘
                         ▼
              Sentence Transformers
           (all-MiniLM-L6-v2, 384-dim)
```

---

## 📁 Project Structure

```text
ml-service/
│
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI entry point, CORS, routes
│   ├── config.py                   # Configuration and environment loader
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── citizen_routes.py       # POST /api/citizen/ask
│   │   ├── lawyer_routes.py        # POST /api/lawyer/ask, /search-cases, /compare-cases
│   │   └── document_routes.py      # POST /api/documents/upload
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   │
│   │   ├── common/
│   │   │   ├── __init__.py
│   │   │   ├── pdf_processor.py    # PyPDFLoader / PyMuPDF with page metadata
│   │   │   ├── text_chunker.py     # RecursiveCharacterTextSplitter (1000/150)
│   │   │   ├── embedding_service.py# SentenceTransformers HuggingFaceEmbeddings
│   │   │   └── qdrant_service.py   # Qdrant client, auto collection, isolation filters
│   │   │
│   │   ├── citizen/
│   │   │   ├── __init__.py
│   │   │   ├── citizen_rag.py      # Plain language RAG pipeline
│   │   │   ├── citizen_prompt.py   # Empathetic, jargon-free prompt template
│   │   │   └── citizen_response.py # Citizen-friendly source extraction
│   │   │
│   │   └── lawyer/
│   │       ├── __init__.py
│   │       ├── lawyer_rag.py       # 7-part structured legal research RAG
│   │       ├── lawyer_prompt.py    # Strict anti-hallucination legal research prompt
│   │       ├── case_search.py      # Semantic precedent search with scores
│   │       ├── case_comparison.py  # Ratio decidendi & facts comparative analysis
│   │       └── citation_service.py # Verifiable citation formatter (source, page, year)
│
├── data/
│   ├── kaggle/
│   │   └── supreme_court_judgments/ # Indian Supreme Court judgments repository
│   ├── uploads/
│   │   └── lawyer_documents/       # Isolated lawyer PDF uploads
│   └── qdrant_storage/             # Optional local development Qdrant
│
├── scripts/
│   ├── load_kaggle_data.py         # Batch ingest Kaggle judgments with deduplication
│   └── create_embeddings.py        # Verification utility for embeddings & Qdrant
│
├── .env.example
├── .env
├── .gitignore
├── requirements.txt
└── README.md
```

---

## ⚙️ Prerequisites & Setup

### 1. Python Environment

Ensure Python 3.11+ is installed.

```bash
cd ml-service
python -m venv venv

# Windows:
venv\Scripts\activate

# Linux / macOS:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env` by copying `.env.example`:

```bash
cp .env.example .env
```

Configure your parameters in `.env`:

```env
# Vector Database
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=nyaya_path
QDRANT_LOCAL_MODE=false

# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Google Gemini LLM
GOOGLE_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
ML_SERVICE_API_KEY=the_same_random_service_token_as_backend
```

> Configure a shared `ML_SERVICE_API_KEY`; the FastAPI API rejects requests without it. Use `QDRANT_LOCAL_MODE=true` only for small local development data. Production and Kaggle ingestion use the hosted Qdrant URL and key.

### 3. Start Qdrant (Docker)

```bash
docker run -d -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage:z qdrant/qdrant
```

---

## 🚀 Running the Service

Set `ML_SERVICE_API_KEY`, `GOOGLE_API_KEY`, and either hosted Qdrant credentials or `QDRANT_LOCAL_MODE=true` before starting FastAPI. All `/api/*` routes require the service token header, which should be sent by the trusted Spring backend only.

Start the FastAPI application with Uvicorn:

```bash
uvicorn app.main:app --reload --port 8001
```

- API Base URL: `http://localhost:8001`
- Interactive OpenAPI Docs (Swagger): `http://localhost:8001/docs`
- Redoc Documentation: `http://localhost:8001/redoc`

---

## 📚 Loading Kaggle Supreme Court Judgments from a Notebook

For the full 5 GB corpus, attach the Kaggle dataset as a Notebook input. Add `QDRANT_URL` and `QDRANT_API_KEY` as Kaggle Secrets, clone or upload this repository, then load the secrets in a Python notebook cell:

```python
import os
from kaggle_secrets import UserSecretsClient

secrets = UserSecretsClient()
os.environ["QDRANT_URL"] = secrets.get_secret("QDRANT_URL")
os.environ["QDRANT_API_KEY"] = secrets.get_secret("QDRANT_API_KEY")
```

In another notebook cell, install the requirements and run the loader:

```bash
!pip install -r ml-service/requirements.txt
!python ml-service/scripts/load_kaggle_data.py --data-dir /kaggle/input/<dataset-slug> --batch-size 50
```

Replace `<dataset-slug>` with Kaggle's mounted input folder. The notebook reads attached data directly and writes batches into hosted Qdrant; your computer does not need a copy. Start with `--sample 5`, review metadata and citations, then run full ingestion. Check the dataset license before use. The hosted collection must match the app's `QDRANT_COLLECTION`.
## 🔌 API Endpoints & Examples

### Health Check

```bash
curl http://localhost:8001/health
```
Response:
```json
{"status": "healthy"}
```

---

### 1. Citizen Chatbot (`POST /api/citizen/ask`)

Explains legal questions in plain language with simple examples and disclaimer.

**Request:**
```bash
curl -X POST http://localhost:8001/api/citizen/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is anticipatory bail and when can someone apply for it?"}'
```

---

### 2. Lawyer Chatbot (`POST /api/lawyer/ask`)

Provides structured legal analysis adhering to the 7-part legal framework.

**Request:**
```bash
curl -X POST http://localhost:8001/api/lawyer/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Find Supreme Court cases related to Section 302 where prosecution evidence was insufficient.", "k": 5}'
```

---

### 3. Lawyer Semantic Case Search (`POST /api/lawyer/search-cases`)

Retrieves precedents by similarity score.

**Request:**
```bash
curl -X POST http://localhost:8001/api/lawyer/search-cases \
  -H "Content-Type: application/json" \
  -d '{"query": "circumstantial evidence five golden principles", "k": 5}'
```

---

### 4. Lawyer Document Upload (`POST /api/documents/upload`)

Uploads and indexes private judgments with isolation metadata.

**Request:**
```bash
curl -X POST http://localhost:8001/api/documents/upload \
  -F "file=@case_brief.pdf" \
  -F "case_name=State of Maharashtra v. Milind" \
  -F "year=2000" \
  -F "owner_id=lawyer_101"
```
