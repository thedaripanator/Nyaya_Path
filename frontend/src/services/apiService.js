import { MOCK_LAWS, MOCK_JUDGMENTS } from "../data/mockData";

const API_BASE_URL = "http://localhost:8100/api";

export const apiService = {


  // LOGIN
  async login(email, password) {

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data || "Login failed");
    }

    // Store JWT
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    // Store user information
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return {
      success: true,
      user: data.user,
      token: data.token,
    };
  },


  // REGISTER
  async register(data) {

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result || "Registration failed");
    }

    return {
      success: true,
      user: {
        id: result.userId,
        name: result.name,
        email: result.email,
        role: result.role,
      },
      message: result.message,
    };
  },


  // LAWS
  async getLaws() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_LAWS;
  },


  async getLawById(id) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_LAWS.find((law) => law.id === id) || MOCK_LAWS[0];
  },


  // JUDGMENTS
  async getJudgments() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_JUDGMENTS;
  },


  async getJudgmentById(id) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return (
      MOCK_JUDGMENTS.find((item) => item.id === id) ||
      MOCK_JUDGMENTS[0]
    );
  },


  // NYAYA AI
  async askNyayaAI(query, language = "English") {

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const q = query.toLowerCase();

    let result = {
      intent: "General Legal Query",
      confidence: 0.91,
      topic: "General Legal Information",
      entities: [
        {
          type: "topic",
          value: "Legal Query",
        },
      ],
      reply:
        "This is a frontend demonstration response. A future NLP/RAG backend should retrieve verified legal sources before producing an answer.",
      sources: [
        {
          title: "Verified legal source",
          section: "To be connected",
          type: "Future API",
        },
      ],
    };

    if (
      q.includes("salary") ||
      q.includes("employer") ||
      q.includes("wage")
    ) {
      result = {
        intent: "Employment Query",
        confidence: 0.94,
        topic: "Labour Law",
        entities: [
          {
            type: "concept",
            value: "Unpaid Wages",
          },
          {
            type: "org",
            value: "Employer",
          },
        ],
        reply:
          "Your question appears related to employment and unpaid wages. In the production version, Nyaya Path should retrieve the applicable current labour provisions and explain possible procedures with source citations.",
        sources: [
          {
            title: "Industrial Disputes Act, 1947",
            section: "Relevant provision",
            type: "Act",
          },
        ],
      };
    } else if (
      q.includes("landlord") ||
      q.includes("rent") ||
      q.includes("deposit")
    ) {
      result = {
        intent: "Rental / Property Query",
        confidence: 0.96,
        topic: "Property Law",
        entities: [
          {
            type: "concept",
            value: "Rental Dispute",
          },
          {
            type: "person",
            value: "Landlord/Tenant",
          },
        ],
        reply:
          "Your question appears related to a rental or security-deposit dispute. A production RAG system should identify the applicable state law, tenancy agreement terms and verified legal sources before suggesting next steps.",
        sources: [
          {
            title: "Applicable tenancy law",
            section: "To be retrieved",
            type: "Future RAG Source",
          },
        ],
      };
    }

    return {
      query,
      language,
      ...result,
    };
  },



  // DOCUMENT ANALYSIS

  async uploadAndAnalyzeDoc(file) {

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      id: `doc-${Date.now()}`,
      fileName: file.name,
      uploadDate: new Date().toISOString().split("T")[0],
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      summary:
        "Demo analysis: a future document-processing/NLP service will extract clauses, entities, dates and legal references.",
      clauses: [
        {
          title: "Termination Clause",
          snippet: "Sample extracted termination provision.",
        },
        {
          title: "Dispute Resolution",
          snippet: "Sample extracted dispute-resolution provision.",
        },
        {
          title: "Indemnity",
          snippet: "Sample extracted indemnity provision.",
        },
      ],
      entities: [
        {
          type: "org",
          label: "Organization",
          value: "Sample Organization",
        },
        {
          type: "law",
          label: "Governing Law",
          value: "To be detected",
        },
        {
          type: "location",
          label: "Jurisdiction",
          value: "To be detected",
        },
      ],
    };
  },
};