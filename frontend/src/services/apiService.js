import { MOCK_LAWS, MOCK_JUDGMENTS } from "../data/mockData";

const BACKEND_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_BACKEND_BASE_URL || "/api";

function getAuthHeader() {
  return {};
}

function apiFetch(url, options = {}) {
  return fetch(url, { ...options, credentials: "include" });
}

function extractErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  return fallback;
}

async function parseJsonResponse(response, fallbackError) {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(`The backend could not complete this request (HTTP ${response.status}). Check that Spring Boot and PostgreSQL are running, then try again.`);
        }
        throw new Error(`${fallbackError || "Request failed."} (HTTP ${response.status}).`);
      }
      throw new Error("The server returned an invalid response. Please try again.");
    }
  }
  if (!response.ok) {
    const message = extractErrorMessage(data, fallbackError || `Request failed (${response.status}).`);
    throw new Error(response.status >= 500 && message === fallbackError
      ? `The backend could not complete this request (HTTP ${response.status}). Check that Spring Boot and PostgreSQL are running, then try again.`
      : message);
  }
  return data;
}

function persistSession(token, user) {
  localStorage.removeItem("token");
  localStorage.removeItem("nyaya_token");
  if (user) {
    localStorage.setItem("nyaya_user", JSON.stringify(user));
  }
}

export const apiService = {
  // --- AUTHENTICATION (PostgreSQL) ---

  async login(email, password) {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error("Cannot reach the backend. Make sure the Spring Boot server is running on port 8100.");
    }

    const data = await parseJsonResponse(response, "Invalid credentials. Please verify your email and password.");

    const user = data.user
      ? {
          ...data.user,
          advocateDetails: data.advocateDetails || data.user.advocateDetails || null,
        }
      : null;

    if (!user) {
      throw new Error(data.message || "Login succeeded but no user profile was returned. Please try again.");
    }

    persistSession(data.token, user);
    return { success: true, user };
  },

  async register(formData) {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
    } catch {
      throw new Error("Cannot reach the backend. Make sure the Spring Boot server is running on port 8100.");
    }

    const data = await parseJsonResponse(response, "Registration failed. Please check the provided information.");

    const registeredUser = {
      id: data.userId || data.user?.id,
      name: data.name || data.user?.name || formData.name,
      email: data.email || data.user?.email || formData.email,
      role: data.role || data.user?.role || formData.role,
      advocateDetails: formData.role === "Advocate" ? {
        enrollmentNumber: formData.enrollmentNumber,
        stateBarCouncil: formData.stateBarCouncil,
        primaryPracticeArea: formData.primaryPracticeArea,
        primaryCourt: formData.primaryCourt,
        enrollmentStatus: "VERIFIED",
      } : null,
    };

    persistSession(data.token, registeredUser);
    return { success: true, user: registeredUser };
  },

  async getCurrentUser() {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/auth/me`, {
        headers: {
          ...getAuthHeader(),
        },
      });
    } catch {
      return null;
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Session expired. Please log in again.");
    }
    const data = await parseJsonResponse(response, "Session expired. Please log in again.");
    return {
      id: data.id || data.user?.id,
      name: data.name || data.user?.name,
      email: data.email || data.user?.email,
      role: data.role || data.user?.role,
      advocateDetails: data.advocateDetails || data.advocateProfile || null,
    };
  },

  logout() {
    apiFetch(`${BACKEND_BASE_URL}/auth/logout`, { method: "POST" }).catch(() => {});
    localStorage.removeItem("nyaya_user");
    localStorage.removeItem("nyaya_token");
    localStorage.removeItem("token");
  },

  // --- CITIZEN AI ASSISTANT ---

  async askCitizenAI(question, language = "English") {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/ai/citizen/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ question, language, k: 5 }),
      });
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    const data = await parseJsonResponse(response, "Could not process your question.");
    const innerData = data.data || data;
    return {
      reply: innerData.answer || innerData.reply || "No response received.",
      sources: innerData.sources || [],
      question,
      language,
    };
  },

  // --- LAWYER AI RESEARCH ---

  async askLawyerAI(question, k = 5) {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/ai/lawyer/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ question, k }),
      });
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    const data = await parseJsonResponse(response, "Could not execute legal research query.");
    const innerData = data.data || data;
    return {
      answer: innerData.answer || innerData.comparison || "",
      sources: innerData.sources || [],
    };
  },

  // --- LAWYER CASE SEARCH ---

  async searchCases(query, k = 10) {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/ai/lawyer/search-cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ query, k }),
      });
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    const data = await parseJsonResponse(response, "Precedent search failed.");
    const innerData = data.data || data;
    return innerData.cases || [];
  },

  // --- LAWYER CASE COMPARISON ---

  async compareCases(caseA, caseB, comparisonQuery = null) {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/ai/lawyer/compare-cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ caseA, caseB, comparisonQuery, k: 5 }),
      });
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    const data = await parseJsonResponse(response, "Case comparison failed.");
    const innerData = data.data || data;
    return {
      comparison: innerData.comparison || innerData.answer || "",
      sources_case_a: innerData.sources_case_a || [],
      sources_case_b: innerData.sources_case_b || [],
    };
  },

  // --- LAWYER DOCUMENT UPLOAD (Isolated) ---

  async uploadLawyerDocument(file, metadata = {}) {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata.caseName) formData.append("case_name", metadata.caseName);
    if (metadata.court) formData.append("court", metadata.court);
    if (metadata.year) formData.append("year", metadata.year);
    if (metadata.citation) formData.append("citation", metadata.citation);

    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
        },
        body: formData,
      });
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    return parseJsonResponse(response, "Failed to upload and index document.");
  },

  async getMyUploadedDocuments() {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/documents/my-documents`, {
        headers: {
          ...getAuthHeader(),
        },
      });
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    const documents = await parseJsonResponse(response, "Could not load your uploaded documents.");
    if (!Array.isArray(documents)) {
      throw new Error("The server returned an invalid document list. Please try again.");
    }
    return documents;
  },

  // --- SAVED BOOKMARKS (PostgreSQL) ---

  async getSavedItems() {
    let response;
    try {
      response = await apiFetch(`${BACKEND_BASE_URL}/saved`, {
        headers: {
          ...getAuthHeader(),
        },
      });
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    const items = await parseJsonResponse(response, "Could not load your saved items.");
    if (!Array.isArray(items)) {
      throw new Error("The server returned an invalid saved-items list. Please try again.");
    }
    return items;
  },

  async toggleSavedItem(item) {
    const response = await apiFetch(`${BACKEND_BASE_URL}/saved`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        itemType: item.itemType || (item.category ? "LAW" : "JUDGMENT"),
        itemId: item.id || item.itemId,
        title: item.title || item.caseName,
        subtitle: item.number || item.court || "",
        category: item.category || item.court || "Legal",
      }),
    });
    const result = await parseJsonResponse(response, "Could not update your saved items.");
    if (typeof result.saved !== "boolean") {
      throw new Error("The server returned an invalid saved-item response. Please try again.");
    }
    return result;
  },

  async deleteSavedItem(itemId) {
    const response = await apiFetch(`${BACKEND_BASE_URL}/saved/${itemId}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeader(),
      },
    });
    if (!response.ok) {
      return { success: false };
    }
    return response.json();
  },

  // --- LAWS & JUDGMENTS ---

  async getLaws() {
    return MOCK_LAWS;
  },

  async getLawById(id) {
    return MOCK_LAWS.find((l) => l.id === id) || MOCK_LAWS[0];
  },

  async getJudgments() {
    return MOCK_JUDGMENTS;
  },

  async getJudgmentById(id) {
    return MOCK_JUDGMENTS.find((j) => j.id === id) || MOCK_JUDGMENTS[0];
  },


  // --- INDIAN ACTS / LEGAL INFORMATION API ---

  async getLegalActs(page = 0, size = 20) {
    let response;

    try {
      response = await apiFetch(
        `${BACKEND_BASE_URL}/legal/documents?page=${page}&size=${size}`,
        { headers: { ...getAuthHeader() } }
      );
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    return parseJsonResponse(response, "Could not load Indian Acts.");
  },

  async searchLegalActs(query, page = 0, size = 20) {
    if (!query?.trim()) {
      return this.getLegalActs(page, size);
    }

    let response;

    try {
      response = await apiFetch(
        `${BACKEND_BASE_URL}/legal/search?q=${encodeURIComponent(query.trim())}&page=${page}&size=${size}`,
        { headers: { ...getAuthHeader() } }
      );
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    return parseJsonResponse(response, "Could not search Indian Acts.");
  },

  async getLegalActById(actId) {
    let response;

    try {
      response = await apiFetch(
        `${BACKEND_BASE_URL}/legal/documents/${encodeURIComponent(actId)}`,
        { headers: { ...getAuthHeader() } }
      );
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    return parseJsonResponse(response, "Could not load the Act details.");
  },

  async getLegalProvisions(actId, page = 0, size = 50) {
    let response;

    try {
      response = await apiFetch(
        `${BACKEND_BASE_URL}/legal/documents/${encodeURIComponent(actId)}/provisions?page=${page}&size=${size}`,
        { headers: { ...getAuthHeader() } }
      );
    } catch {
      throw new Error("Cannot reach the backend. Please confirm the API server is running.");
    }

    return parseJsonResponse(response, "Could not load the Act provisions.");
  },
  // --- INDIAN ACTS / LEGAL INFORMATION API ---
    // --- BNS / BNSS SECTIONS API ---

    async getSectionsPage(act, page = 0, size = 12, language = "en", search = "") {
      if (!["All", "BNS", "BNSS"].includes(act)) {
        throw new Error("Invalid Act. Choose All, BNS or BNSS.");
      }

      let response;

      try {
        response = await apiFetch(
          `${BACKEND_BASE_URL}/sections/${act}/page?page=${page}&size=${size}&language=${encodeURIComponent(language)}&search=${encodeURIComponent(search)}`,
          { headers: { ...getAuthHeader() } }
        );
      } catch {
        throw new Error("Cannot reach the backend. Please check Spring Boot.");
      }

      return parseJsonResponse(
        response,
        `Could not load ${act} sections.`
      );
    },

    async getSectionDetails(sectionId, language = "en") {
      if (!Number.isInteger(Number(sectionId)) || Number(sectionId) <= 0) {
        throw new Error("Invalid section ID.");
      }

      let response;

      try {
        response = await apiFetch(
          `${BACKEND_BASE_URL}/sections/${encodeURIComponent(sectionId)}/details?language=${encodeURIComponent(language)}`,
          { headers: { ...getAuthHeader() } }
        );
      } catch {
        throw new Error("Cannot reach the backend. Please check Spring Boot.");
      }

      return parseJsonResponse(
        response,
        "Could not load section details."
      );
    },

    async explainLegalSection(sectionId, language = "en") {
      if (!Number.isInteger(Number(sectionId)) || Number(sectionId) <= 0) {
        throw new Error("Invalid section ID.");
      }

      let response;
      try {
        response = await apiFetch(
          `${BACKEND_BASE_URL}/legal/sections/${encodeURIComponent(sectionId)}/explain?language=${encodeURIComponent(language)}`,
          { method: "POST", headers: { ...getAuthHeader() } }
        );
      } catch {
        throw new Error("Cannot reach the backend. Please check Spring Boot.");
      }

      return parseJsonResponse(
        response,
        "Could not generate a simple explanation."
      );
    }
  };
