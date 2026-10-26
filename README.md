# Nyaya-Path ⚖️
## AI-Powered Legal Information & Research System for Indian Law

Nyaya-Path is a full-stack, enterprise-grade AI legal platform specifically engineered for the Indian legal system. It bridges the gap between complex Indian jurisprudence and both **citizens** seeking plain-language legal clarity and **legal advocates** requiring deep precedent analysis, case comparison, and structured research briefings.

---

## 🌟 Key Capabilities & Role Separation

Nyaya-Path uses PostgreSQL for application accounts and records, JWT authentication, and role checks. Advocate accounts are activated immediately after registration, with no separate lawyer approval gate.

### 👥 1. Citizen / General Public Mode
Designed to make Indian law accessible, simple, and reassuring:
* **Plain-Language AI Legal Assistant**: Ask everyday legal questions (FIR procedures, consumer rights, traffic fines, tenancy disputes, bailable vs non-bailable offenses) and receive plain, understandable explanations with relevant statutory sections.
* **Legal Glossary & Context**: Clear breakdowns of complex legal jargon into everyday language.
* **Bookmark Statutes & Precedents**: Save key legal sections and judgments to your PostgreSQL profile.
* **Full Chat History**: Chat records are stored in PostgreSQL for subsequent review.

### ⚖️ 2. Advocate / Lawyer Workspace
Engineered specifically for practicing advocates and legal researchers:
* **7-Part Structured Legal Research Briefing**: Automatically structures research into:
  1. *Legal Issue*
  2. *Applicable Laws / Sections*
  3. *Relevant Cases & Precedents*
  4. *Court's Decision (Ratio Decidendi)*
  5. *Court's Reasoning*
  6. *Similar Cases*
  7. *Sources & Citations*
* **Semantic Precedent Search**: Natural language search against Indian Supreme Court judgments using dense vector embeddings (`sentence-transformers/all-MiniLM-L6-v2`) with cosine similarity scoring.
* **Case Comparison Matrix**: Compare two landmark judgments side-by-side across facts, legal questions, statutory provisions, court decisions, and judicial rationales.
* **Isolated Client Document Indexing**: Upload client PDF briefs and case filings. Documents are chunked, embedded, and indexed with strict tenant isolation (`owner_id`), allowing lawyers to search their own case records privately.
* **Advocate Access**: Advocate signups capture Bar Council Enrollment Numbers, State Bar Councils, and practice areas; research tools are available immediately after registration without manual approval.

---

## 🏗️ Architecture & Technology Stack

```
                               ┌─────────────────────────────────┐
                               │   React 18 + Vite + Tailwind    │
                               │        (Port 5173 / 4173)       │
                               └────────────────┬────────────────┘
                                                │ REST + JWT
                                                ▼
                               ┌─────────────────────────────────┐
                               │       Spring Boot Backend       │
                               │           (Port 8100)           │
                               │  - Spring Security + JWT        │
                               │  - Spring Data JPA / PostgreSQL │
                               │  - Role Verification Gate       │
                               │  - Chat History & Bookmarks     │
                               └────────┬───────────────┬────────┘
                                        │               │
                     Proxy ML Requests  │               │ PostgreSQL
                                        ▼               ▼
                       ┌────────────────────┐   ┌────────────────┐
                       │   FastAPI Service  │   │ App Records   │
                       │     (Port 8001)    │   │ Users, Profiles│
                       │ - LangChain RAG    │   │ Chats, Records │
                       │ - MiniLM Embeddings│   └────────────────┘
                       │ - Qdrant Vectors   │
                       │ - Google Gemini LLM│
                       └────────────────────┘
```

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, responsive role-based dashboards.
* **Core Backend**: Java 17+, Spring Boot 4.x, Spring Security (JWT), Spring Data JPA, Flyway.
* **Database**: PostgreSQL for users, advocate profiles, chats, bookmarks, and uploaded-document metadata. Qdrant remains the vector database for legal text and embeddings.
* **AI / ML Service**: Python 3.11+, FastAPI, Uvicorn, LangChain, Qdrant Vector Store, HuggingFace Sentence Transformers (`sentence-transformers/all-MiniLM-L6-v2`), Google Gemini (`gemini-3.5-flash-lite`).

---

## 🚀 Quick Start Guide

### Prerequisites
* **Java 17 or 21** installed and configured in `PATH`.
* **Node.js 18+ and npm** installed.
* **Python 3.11+** installed.
* **PostgreSQL 15+** running with a `nyaya_path` database created.

---

### Option A: 1-Click Launch (Recommended on Windows)
Simply double-click the included batch script:
```cmd
start_all.bat
```
This automatically launches all three services in separate, dedicated terminal windows:
1. Python FastAPI ML Service on `http://127.0.0.1:8001`
2. Spring Boot Backend on `http://127.0.0.1:8100`
3. React Frontend on `http://localhost:5173`

The launcher enables Spring's `dev` profile so the local development account seeder runs. Do not enable this profile in production.
It waits for the Python ML health endpoint and Spring Boot auth endpoint to become ready before opening the frontend, so legal research, registration, and login are not attempted while their services are still starting. If either service does not start within two minutes, check that service's terminal for dependency or configuration errors.

To stop all services at any time, run:
```cmd
stop_all.bat
```

---

### Option B: Manual Service Startup

#### 1. Configure local secrets and databases

Edit `backend/Nyaya-Path/.env` and `ml-service/.env` before starting. Put a random `JWT_SECRET` of at least 32 characters in the backend file, and put the same strong `ML_SERVICE_API_KEY` in both files. The backend has no signing-secret fallback. The ML file is configured for local Qdrant at `localhost:6333`; for hosted Qdrant, replace the URL and add its API key.

#### 2. Start the Python FastAPI ML Service
```bash
cd ml-service

# Create virtual environment if not already created
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8001
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

#### 3. Start the Spring Boot Backend
```bash
cd backend/Nyaya-Path

# Use the dev profile for local development seed accounts only. Do not use in production.
# Command Prompt:
set SPRING_PROFILES_ACTIVE=dev
# PowerShell:
$env:SPRING_PROFILES_ACTIVE = "dev"

# Build and run
.\mvnw.cmd spring-boot:run
# Or run the pre-built JAR:
# java -jar target\Nyaya-Path-0.0.1-SNAPSHOT.jar
```
The backend starts on `http://localhost:8100`.

#### 4. Start the React Frontend
```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔐 Authentication & Roles Setup

When opening the app for the first time:
1. Click **Sign Up** or navigate to any feature (e.g. *Plain Legal AI* or *Legal Research AI*).
2. Choose your role:
   * **Citizen**: Enter Name, Email, Password, and City.
   * **Advocate**: Enter Name, Email, Password, Bar Council Enrollment Number, State Bar Council, Practice Area, and Court.
3. The backend stores the JWT in an HttpOnly cookie; the frontend does not read or store the token.
4. The navigation bar and dashboard adapt instantly to your role.

---

## 🤖 Environment Variables & Gemini AI Key

In `ml-service/.env`:
```ini
# Hosted Qdrant (recommended for the full legal corpus)
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=nyaya_path
QDRANT_LOCAL_MODE=false

# Sentence Transformer Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Google Gemini API Key for LLM Generation
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.5-flash-lite
ML_SERVICE_API_KEY=the_same_random_service_token_as_the_backend
```

The backend also needs the matching `ML_SERVICE_API_KEY`; the ML API rejects requests without it. Keep secrets out of source control. Local embedded Qdrant is for development only; production and Kaggle ingestion should use hosted Qdrant.

For production, set `NYAYA_COOKIE_SECURE=true` so the session cookie is sent only over HTTPS.

To bootstrap the first administrator, register the intended account, then promote it directly in PostgreSQL (`UPDATE users SET role='Admin' WHERE email='admin@example.com';`) and sign in again. Advocate access requires no manual approval step in the app flow.

---

## 📚 Kaggle Supreme Court Judgments Ingestion

To populate hosted Qdrant from a Kaggle Notebook without keeping the 5 GB source files on your computer:

1. Attach the Kaggle judgments dataset as a notebook input.
2. Add `QDRANT_URL` and `QDRANT_API_KEY` as Kaggle Secrets.
3. Clone or upload this repository in the notebook and install `ml-service/requirements.txt`.
4. Run `python ml-service/scripts/load_kaggle_data.py --data-dir /kaggle/input/<dataset-slug> --batch-size 50`, replacing the path with Kaggle's mounted input directory.

Use Kaggle's `UserSecretsClient` in a Python notebook cell to load `QDRANT_URL` and `QDRANT_API_KEY` into `os.environ` before running the command. The script reads the attached files and batches vector inserts. Kaggle's runtime storage is temporary and separate from your PC. Check the dataset license and verify extracted metadata on a sample before full ingestion. The application and notebook must point to the same hosted Qdrant collection.

### Existing MongoDB data

The backend now writes new records to PostgreSQL. To preserve records from an existing MongoDB database, first start the backend once to let Flyway create the SQL schema, then use `backend/Nyaya-Path/migration/migrate_mongo_to_postgres.py` with `MONGODB_URI`, `MONGODB_DATABASE`, and `POSTGRES_DSN`. Verify copied row counts and sample records before retiring MongoDB. The script copies application records; it does not move uploaded PDF files or Qdrant vectors.

The services load their local `.env` files at startup. Fill in the PostgreSQL password, a random JWT secret, a Gemini API key, and the same random ML service key in both files, then run `start_all.bat`.

## 🧪 Verification

Run backend checks with `backend/Nyaya-Path/mvnw.cmd test`, build the frontend with `npm run build` from `frontend`, and run ML service checks from `ml-service/scripts`. The former machine-specific end-to-end test path was outside this repository and has been removed.
