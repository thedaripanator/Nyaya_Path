# Nyaya-Sum ⚖️

## AI-Powered Legal Assistant for Indian Court Judgments

Nyaya-Sum is an AI-powered legal assistance platform designed to make Indian legal information easier to search, understand, summarize, and compare.

The system uses **Retrieval-Augmented Generation (RAG)**, semantic search, document processing, embeddings, and Large Language Models (LLMs) to provide source-grounded responses from Indian court judgments.

Nyaya-Sum supports legal document summarization, semantic legal search, similar-case retrieval, case comparison, role-based legal assistance, and multilingual explanations.

> **Disclaimer:** Nyaya-Sum is an educational and informational technology project. It does not provide legal advice and should not be considered a substitute for a qualified legal professional.

---

## 🚀 Features

### 👤 Role-Based Access

Nyaya-Sum provides different functionality depending on the user's role.

#### User / Citizen Mode

- Ask legal questions in natural language
- Get simplified explanations of legal information
- Summarize lengthy court judgments
- Search for similar cases
- View supporting legal sources
- Receive multilingual explanations

#### Advocate Mode

- Detailed legal explanations
- Technical legal terminology
- Similar precedent retrieval
- Case comparison
- Detailed judgment analysis
- Access restricted to verified advocates

#### Admin Mode

- User management
- Advocate verification
- Legal document management
- System administration

---

## ⚖️ Core Features

### 1. AI Legal Document Summarization

Nyaya-Sum converts lengthy Indian court judgments into concise and understandable summaries.

The system can identify:

- Case facts
- Legal issues
- Arguments
- Applicable legal provisions
- Court reasoning
- Final judgment
- Case outcome

---

### 2. 🔎 Semantic Legal Search

Users can search for legal cases using natural-language queries instead of relying only on exact keyword matching.

**Example**

```text
Cases related to compensation for delayed delivery of property
```

The system converts the query into an embedding and retrieves semantically relevant legal documents.

---

### 3. 🤖 RAG-Based Legal Chatbot

Nyaya-Sum uses Retrieval-Augmented Generation (RAG) to generate responses based on relevant retrieved legal documents.

**RAG Flow**

```text
User Query
    ↓
Query Processing
    ↓
Query Embedding
    ↓
Semantic Search
    ↓
Relevant Legal Chunks
    ↓
Context Construction
    ↓
LLM
    ↓
Grounded Answer
    ↓
Source References
```

The objective is to reduce unsupported responses by grounding the generated answer in retrieved legal documents.

---

### 4. 📚 Similar Case & Precedent Retrieval

The system retrieves legally relevant judgments based on semantic similarity.

Users can discover cases with similar:

- Facts
- Legal issues
- Applicable provisions
- Judicial reasoning
- Case outcomes

---

### 5. ⚖️ Case Comparison

Nyaya-Sum allows users to compare multiple legal judgments.

The comparison can include:

- Case facts
- Legal issues
- Arguments
- Applicable laws
- Court reasoning
- Judgment
- Outcome

---

### 6. 🌐 Multilingual Legal Explanation

Nyaya-Sum is designed to make complex legal information accessible to users who may not be comfortable reading legal English.

The system can provide simplified and multilingual explanations of retrieved legal information.

---

### 7. 🔗 Source References

AI-generated responses are connected to the underlying legal documents used during retrieval.

Users can inspect the relevant judgment or source instead of relying only on the generated response.

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │    React Frontend    │
                         └──────────┬───────────┘
                                    │
                              REST API
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Spring Boot        │
                         │   Main Backend       │
                         └──────────┬───────────┘
                                    │
                              REST API
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Python FastAPI     │
                         │   ML/AI Service      │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌──────────────┐     ┌──────────────┐      ┌──────────────┐
       │ PDF/OCR      │     │ Embeddings   │      │ RAG + LLM    │
       │ Processing   │     │ Sentence     │      │ Generation   │
       │              │     │ Transformers │      │              │
       └──────────────┘     └──────┬───────┘      └──────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Vector Database │
                          │  FAISS / Chroma  │
                          └──────────────────┘

                          ┌──────────────────┐
                          │   PostgreSQL     │
                          │ Users / Cases /  │
                          │ Metadata / Chats │
                          └──────────────────┘
```

---

## 🧩 Architecture Responsibilities

### React Frontend

The React application provides the user interface for:

- User registration and login
- Legal chatbot
- Document upload
- Legal search
- Judgment summaries
- Similar case results
- Case comparison
- Advocate dashboard
- Admin dashboard

### Spring Boot Backend

Spring Boot acts as the main application backend and communication layer.

Responsibilities include:

- REST APIs
- Authentication
- Authorization
- Role-based access control
- User management
- Advocate registration
- Advocate verification
- Case management
- Document metadata
- Chat history
- Database communication
- Communication with the Python ML service

### Python FastAPI ML Service

FastAPI is used specifically for the ML/NLP/AI modules.

Responsibilities include:

- PDF text extraction
- OCR processing
- Text cleaning
- Text chunking
- Embedding generation
- Semantic search
- Similar-case retrieval
- RAG pipeline
- Legal document summarization
- LLM integration
- Multilingual processing

---

## 🔄 Backend Communication

The system uses a service-based architecture.

```text
React Frontend
      │
      │ HTTP / REST
      ▼
Spring Boot Backend
      │
      │ HTTP / REST
      ▼
Python FastAPI ML Service
      │
      ├── Embeddings
      ├── Vector Search
      ├── RAG
      ├── Summarization
      └── LLM
```

Spring Boot acts as the central application backend, while FastAPI provides specialized AI/ML capabilities.

---

## 📄 Legal Document Processing Pipeline

Court judgments are processed before they become searchable.

```text
Indian Court Judgment PDF
          ↓
    Text Extraction
          ↓
      OCR if needed
          ↓
     Text Cleaning
          ↓
       Chunking
          ↓
 Embedding Generation
          ↓
     Vector Storage
          ↓
    Semantic Search
```

---

## 🧠 RAG Pipeline

Nyaya-Sum uses Retrieval-Augmented Generation.

### Indexing Phase

```text
Judgment PDF
     ↓
Text Extraction
     ↓
Cleaning
     ↓
Chunking
     ↓
Sentence Transformer
     ↓
Embeddings
     ↓
Vector Database
```

### Query Phase

```text
User Question
     ↓
Query Processing
     ↓
Query Embedding
     ↓
Vector Similarity Search
     ↓
Top-K Relevant Legal Chunks
     ↓
Context Construction
     ↓
LLM
     ↓
Generated Response
     ↓
Source References
```

---

## 🛠️ Technology Stack

### Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Tailwind CSS

### Main Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- REST APIs
- Maven

### AI / ML Service

- Python 3.x
- FastAPI
- Sentence Transformers
- PyMuPDF
- Tesseract OCR

### Large Language Models

The ML service can integrate with:

- OpenAI GPT models
- Anthropic Claude
- Self-hosted LLaMA models

### Embeddings

- Sentence Transformers
- Transformer-based embedding models

### Vector Database

- FAISS
- ChromaDB

### Relational Database

- PostgreSQL

### Development Tools

- Git
- GitHub
- Docker
- Postman
- IntelliJ IDEA
- VS Code

### Operating Systems

- Windows
- Linux

---

## 🗃️ Legal Dataset

Nyaya-Sum is designed to work with Indian court judgments.

The legal document collection can contain:

- Judgment ID
- Case Title
- Court
- Case Number
- Citation
- Judges
- Decision Date
- Judgment Text
- Source PDF
- Source URL
- Language

The original source reference is maintained so that users can verify information against the underlying judgment.

---

## 📊 Database Design

### PostgreSQL

PostgreSQL stores application and structured legal data.

Example entities:

- User
- Advocate
- AdvocateVerification
- Judgment
- CaseMetadata
- ChatHistory
- SourceReference

### Vector Database

The vector database stores embeddings of legal-document chunks.

```text
Judgment
    ↓
Text Chunks
    ↓
Embeddings
    ↓
Vector Database
```

This allows semantic similarity search.

---

## 🔐 Security

Nyaya-Sum uses role-based access control.

```text
USER
 ├── Legal Search
 ├── Legal Chatbot
 ├── Document Summarization
 └── Similar Cases


VERIFIED ADVOCATE
 ├── Legal Search
 ├── Legal Chatbot
 ├── Detailed Case Analysis
 ├── Similar Cases
 └── Case Comparison


ADMIN
 ├── User Management
 ├── Advocate Verification
 └── Document Management
```

Authentication and authorization are handled by Spring Security.

---

## 🔌 API Communication

### Frontend → Spring Boot

The React frontend communicates with Spring Boot through REST APIs.

Example:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/chat
GET  /api/judgments
GET  /api/judgments/{id}
POST /api/cases/compare
```

### Spring Boot → FastAPI

Spring Boot communicates with the ML service through REST APIs.

Example:

```text
POST /ml/embed
POST /ml/search
POST /ml/summarize
POST /ml/chat
POST /ml/similar-cases
POST /ml/compare
```

The exact endpoints may change as development progresses.

---

## 📂 Project Structure

```text
nyaya-sum/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── README.md
│
├── ml-service/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   ├── rag/
│   │   ├── embeddings/
│   │   └── utils/
│   │
│   ├── data/
│   ├── requirements.txt
│   └── README.md
│
├── docs/
│   ├── architecture/
│   ├── diagrams/
│   └── api/
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Install the following:

- Java 17+
- Maven
- Python 3.x
- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/nyaya-sum.git
cd nyaya-sum
```

### 2. Start PostgreSQL

Create a PostgreSQL database for the application.

Example database name:

```text
nyaya_sum
```

Configure the database connection in the Spring Boot application.

### 3. Run Spring Boot Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The Spring Boot backend will run on its configured port.

Example:

```text
http://localhost:8080
```

### 4. Run the Python ML Service

Open a new terminal.

```bash
cd ml-service
```

Create a virtual environment:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux / macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Example:

```text
http://localhost:8000
```

### 5. Run the React Frontend

Open another terminal.

```bash
cd frontend
npm install
npm run dev
```

The frontend will start using the development server.

---

## 🔑 Environment Variables

Create environment variables for sensitive configuration.

Example:

```text
DATABASE_URL=your_database_url
LLM_API_KEY=your_llm_api_key
ML_SERVICE_URL=http://localhost:8000
VECTOR_DB_PATH=./data/vector_db
```

Never commit API keys, passwords, database credentials, or other sensitive information to GitHub.

Add environment files to `.gitignore`.

Example:

```text
.env
.env.*
```

---

## 🧪 Testing

Testing will be performed at multiple levels.

### Spring Boot

- Unit testing
- Integration testing
- REST API testing
- Authentication testing
- Authorization testing

### FastAPI ML Service

- Embedding tests
- Retrieval tests
- RAG tests
- Summarization tests
- Similar-case retrieval tests

### React

- Component testing
- API integration testing
- UI testing

---

## 📈 Evaluation

The AI components can be evaluated using:

### Retrieval

- Precision@K
- Recall@K
- Similarity scores

### Summarization

- ROUGE
- BERTScore
- Human evaluation

### Question Answering

- Answer relevance
- Faithfulness
- Context relevance
- Citation correctness

---

## 🚀 Future Enhancements

- Support for additional High Court judgments
- Improved multilingual support
- Indian-language legal translation
- Advanced legal citation extraction
- Improved similar-case retrieval
- Legal timeline generation
- Voice-based legal queries
- Advanced RAG evaluation
- Domain-specific legal model fine-tuning
- Better hallucination detection
- Production deployment
- AI observability and monitoring

---

## 🤝 Contribution

Contributions, suggestions, and improvements are welcome.

**Development workflow**

```text
Fork
  ↓
Create Feature Branch
  ↓
Implement Changes
  ↓
Test
  ↓
Commit
  ↓
Push
  ↓
Create Pull Request
```

---

## 📜 License

This project is intended for educational, research, and development purposes.

The licenses and attribution requirements of external datasets, models, APIs, and libraries used by the project must be respected.

---

## ⚠️ Legal Disclaimer

Nyaya-Sum is an AI-based legal information and research tool.

The system does not replace a qualified advocate or legal professional.

AI-generated information may contain errors or omissions. Users should verify important information against the original legal sources and consult a qualified legal professional for advice concerning specific legal matters.

---

## 🎯 Project Goal

Making Indian legal information easier to search, understand, summarize, compare, and access through AI.

---

⭐ **Nyaya-Sum**

*Search. Understand. Compare. Verify.*
