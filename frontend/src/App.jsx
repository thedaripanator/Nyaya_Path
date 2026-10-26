import React, { useEffect, useRef, useState } from "react";
import {
  Scale, BookOpen, FileText, Search, MessageSquare, Upload, User, Settings,
  HelpCircle, LogOut, ChevronRight, Mic, Send, Globe, Bookmark, BookmarkCheck,
  Sparkles, ShieldAlert, FileCheck, Menu, X, ArrowRight,
  AlertCircle, SplitSquareVertical, Briefcase, FileSearch
} from "lucide-react";
import { MOCK_LAWS, MOCK_JUDGMENTS } from "./data/mockData";
import { apiService } from "./services/apiService";

const CITIZEN_WORKSPACE_NAV = [
  ["/dashboard", "Overview", Briefcase],
  ["/ask", "Legal guidance", MessageSquare],
  ["/laws", "Indian laws", BookOpen],
  ["/judgments", "Court judgments", FileSearch]
];

const ADVOCATE_WORKSPACE_NAV = [
  ["/dashboard", "Overview", Briefcase],
  ["/lawyer-ask", "Legal research", Scale],
  ["/precedent-search", "Precedent search", Search],
  ["/case-compare", "Case comparison", SplitSquareVertical],
  ["/documents", "Client documents", Upload],
  ["/laws", "Indian laws", BookOpen],
  ["/judgments", "Court judgments", FileSearch]
];

const PRACTICE_AREAS = [
  'Criminal Law',
  'Civil Law',
  'Corporate Law',
  'Constitutional Law',
  'Family Law',
  'Property Law',
  'Consumer Law',
  'Cyber Law',
  'Other'
];

const PRIMARY_COURTS = [
  'District Court',
  'High Court',
  'Supreme Court',
  'Tribunal',
  'Other'
];

const PUBLIC_ROUTES = ["/", "/about", "/login", "/register", "/help", "/not-found"];
const ADVOCATE_ROUTES = ["/lawyer-ask", "/precedent-search", "/case-compare", "/documents"];
const STATIC_ROUTES = [
  ...PUBLIC_ROUTES,
  "/dashboard",
  "/ask",
  "/lawyer-ask",
  "/precedent-search",
  "/case-compare",
  "/laws",
  "/judgments",
  "/documents",
  "/profile",
  "/settings",
  "/not-found",
];

function decodeRouteId(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function routeFromPath(pathname) {
  const lawMatch = pathname.match(/^\/laws\/([^/]+)$/);
  if (lawMatch) {
    return { route: "/laws/:id", param: decodeRouteId(lawMatch[1]) };
  }

  const judgmentMatch = pathname.match(/^\/judgments\/([^/]+)$/);
  if (judgmentMatch) {
    return { route: "/judgments/:id", param: decodeRouteId(judgmentMatch[1]) };
  }

  return STATIC_ROUTES.includes(pathname)
    ? { route: pathname, param: null }
    : { route: "/not-found", param: null };
}

function pathForRoute(route, id) {
  if (route === "/laws/:id" || route === "/judgments/:id") {
    return route.replace(":id", encodeURIComponent(id));
  }
  return route;
}

function isAdvocateUser(user) {
  return String(user?.role || "").toLowerCase() === "advocate";
}

function hasVerifiedAdvocateAccess(user) {
  return isAdvocateUser(user);
}

export default function App() {
  const [route, setRoute] = useState(() => routeFromPath(window.location.pathname).route);
  const [param, setParam] = useState(() => routeFromPath(window.location.pathname).param);
  const [user, setUser] = useState(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("nyaya_token");
      return JSON.parse(localStorage.getItem("nyaya_user")) || null;
    } catch {
      return null;
    }
  });

  const [savedLaws, setSavedLaws] = useState([]);
  const [savedJudgments, setSavedJudgments] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authGateMessage, setAuthGateMessage] = useState(null);
  const [appNotice, setAppNotice] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileOpen(false);
  }, [route, param]);

  useEffect(() => {
    if (!appNotice) return undefined;
    const timer = window.setTimeout(() => setAppNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [appNotice]);

  useEffect(() => {
    const syncLocation = () => {
      let nextLocation = routeFromPath(window.location.pathname);
      if (!PUBLIC_ROUTES.includes(nextLocation.route) && !user) {
        setAuthGateMessage("Please sign up or log in with your account to access Nyaya Path's legal tools.");
        nextLocation = { route: "/login", param: null };
        window.history.replaceState({}, "", "/login");
      } else if (ADVOCATE_ROUTES.includes(nextLocation.route) && !isAdvocateUser(user)) {
        nextLocation = { route: "/dashboard", param: null };
        window.history.replaceState({}, "", "/dashboard");
      }
      setRoute(nextLocation.route);
      setParam(nextLocation.param);
    };

    syncLocation();
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, [user]);

  useEffect(() => {
    if (!localStorage.getItem("nyaya_user")) return;
    apiService.getCurrentUser().then((profile) => {
      if (profile?.email) {
        const nextUser = {
          ...profile,
          advocateDetails: profile.advocateDetails || null,
        };
        localStorage.setItem("nyaya_user", JSON.stringify(nextUser));
        setUser(nextUser);
      }
    }).catch(() => {
      apiService.logout();
      setUser(null);
    });
  }, []);

  // Load saved items from PostgreSQL if logged in
  useEffect(() => {
    let isCurrentSession = true;
    if (user) {
      setSavedLaws([]);
      setSavedJudgments([]);
      apiService.getSavedItems().then((items) => {
        if (!isCurrentSession) return;
        const lawIds = items.filter((x) => x.itemType === "LAW").map((x) => x.itemId);
        const judgIds = items.filter((x) => x.itemType === "JUDGMENT").map((x) => x.itemId);
        setSavedLaws(lawIds);
        setSavedJudgments(judgIds);
      }).catch((err) => {
        if (!isCurrentSession) return;
        setAppNotice({ type: "error", message: err.message || "Could not load your saved items." });
      });
    } else {
      setSavedLaws([]);
      setSavedJudgments([]);
    }
    return () => {
      isCurrentSession = false;
    };
  }, [user]);

  const navigate = (nextRoute, id = null, authenticatedUser = null) => {
    const activeUser = authenticatedUser || user;
    const hasSession = Boolean(activeUser);
    if (!PUBLIC_ROUTES.includes(nextRoute) && !hasSession) {
      setAuthGateMessage("Please sign up or log in with your account to access Nyaya Path's legal tools.");
      window.history.pushState({}, "", "/login");
      setRoute("/login");
      setParam(null);
      return;
    }

    if (ADVOCATE_ROUTES.includes(nextRoute) && !isAdvocateUser(activeUser)) {
      window.history.pushState({}, "", "/dashboard");
      setRoute("/dashboard");
      setParam(null);
      return;
    }

    setAuthGateMessage(null);
    const nextPath = pathForRoute(nextRoute, id);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setRoute(nextRoute);
    setParam(id);
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setAuthGateMessage(null);
    setMobileOpen(false);
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    setRoute("/");
    setParam(null);
  };

  const toggleSave = async (id, type) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const item = type === "LAW"
        ? MOCK_LAWS.find((x) => x.id === id)
        : MOCK_JUDGMENTS.find((x) => x.id === id);
      if (!item) {
        throw new Error("This item is no longer available.");
      }

      const result = await apiService.toggleSavedItem({ ...item, itemType: type, itemId: id });
      const updateSaved = (setItems) => {
        setItems((previous) => result.saved
          ? (previous.includes(id) ? previous : [...previous, id])
          : previous.filter((savedId) => savedId !== id));
      };
      updateSaved(type === "LAW" ? setSavedLaws : setSavedJudgments);
      setAppNotice({
        type: "success",
        message: result.saved ? "Added to your saved items." : "Removed from your saved items.",
      });
    } catch (err) {
      setAppNotice({ type: "error", message: err.message || "Could not update your saved items." });
    }
  };

  let content;
  if (route === "/") {
    content = <LandingPage navigate={navigate} user={user} />;
  } else if (route === "/about") {
    content = <AboutPage navigate={navigate} />;
  } else if (route === "/login") {
    content = <LoginPage navigate={navigate} setUser={setUser} message={authGateMessage} />;
  } else if (route === "/register") {
    content = <RegisterPage navigate={navigate} setUser={setUser} />;
  } else if (route === "/dashboard") {
    content = (
      <DashboardPage
        user={user}
        navigate={navigate}
        savedLaws={savedLaws}
        savedJudgments={savedJudgments}
      />
    );
  } else if (route === "/ask") {
    content = <CitizenAIPage user={user} navigate={navigate} />;
  } else if (route === "/lawyer-ask") {
    content = <LawyerResearchPage user={user} navigate={navigate} />;
  } else if (route === "/precedent-search") {
    content = <PrecedentSearchPage user={user} navigate={navigate} />;
  } else if (route === "/case-compare") {
    content = <CaseComparePage user={user} navigate={navigate} />;
  } else if (route === "/laws") {
    content = (
      <LawsPage
        navigate={navigate}
        savedLaws={savedLaws}
        toggleSave={(id) => toggleSave(id, "LAW")}
      />
    );
  } else if (route === "/laws/:id") {
    content = (
      <LawDetailPage
        id={param}
        navigate={navigate}
        savedLaws={savedLaws}
        toggleSave={(id) => toggleSave(id, "LAW")}
      />
    );
  } else if (route === "/judgments") {
    content = (
      <JudgmentsPage
        navigate={navigate}
        savedJudgments={savedJudgments}
        toggleSave={(id) => toggleSave(id, "JUDGMENT")}
      />
    );
  } else if (route === "/judgments/:id") {
    content = (
      <JudgmentDetailPage
        id={param}
        navigate={navigate}
        savedJudgments={savedJudgments}
        toggleSave={(id) => toggleSave(id, "JUDGMENT")}
      />
    );
  } else if (route === "/documents") {
    content = <DocumentsPage user={user} navigate={navigate} />;
  } else if (route === "/profile") {
    content = <ProfilePage user={user} setUser={setUser} />;
  } else if (route === "/settings") {
    content = <SettingsPage />;
  } else if (route === "/not-found") {
    content = <NotFoundPage navigate={navigate} />;
  } else {
    content = <HelpPage navigate={navigate} />;
  }

  const isPublicRoute = ["/", "/about", "/login", "/register", "/not-found"].includes(route)
    || (route === "/help" && !user);

  return (
    <div className={`app-root${isPublicRoute ? " public-app-root" : ""}`}>
      {appNotice && (
        <div className={`app-notice app-notice-${appNotice.type}`} role={appNotice.type === "error" ? "alert" : "status"}>
          <span>{appNotice.message}</span>
          <button type="button" onClick={() => setAppNotice(null)} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}
      {isPublicRoute ? (
        <>
          <PublicNavbar route={route} user={user} navigate={navigate} />
          <main className="public-main">{content}</main>
          <Footer navigate={navigate} />
        </>
      ) : (
        <AuthenticatedLayout
          route={route}
          user={user}
          navigate={navigate}
          logout={logout}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        >
          {content}
          <Footer navigate={navigate} />
        </AuthenticatedLayout>
      )}
    </div>
  );
}

function Brand({ subtitle }) {
  return (
    <span className="brand-lockup">
      <span className="brand-mark"><Scale size={20} strokeWidth={1.7} /></span>
      <span className="brand-wordmark">
        <b>Nyaya<span>Path</span></b>
        {subtitle && <small>{subtitle}</small>}
      </span>
    </span>
  );
}

function PublicNavbar({ route, user, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ["/", "Home"],
    ["/judgments", "Case Laws"],
    ["/laws", "Indian Laws"],
    ["/about", "About"]
  ];

  const follow = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="public-nav">
      <div className="public-nav-inner">
        <button className="brand-button" onClick={() => follow("/")} aria-label="NyayaPath home">
          <Brand subtitle="LEGAL INFORMATION, MADE CLEAR" />
        </button>
        <nav className="public-nav-links" aria-label="Main navigation">
          {links.map(([path, label]) => (
            <button key={path} className={route === path ? "public-nav-link active" : "public-nav-link"} onClick={() => follow(path)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="public-nav-actions">
          <button className="nav-search-button" onClick={() => follow("/judgments")} aria-label="Search court judgments" title="Search court judgments">
            <Search size={18} />
          </button>
          {user ? (
            <button className="nav-login-button" onClick={() => follow("/dashboard")}>Workspace</button>
          ) : (
            <>
              <button className="nav-login-button" onClick={() => follow("/login")}>Login</button>
              <button className="nav-signup-button" onClick={() => follow("/register")}>Sign up</button>
            </>
          )}
        </div>
        <button
          className="public-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {menuOpen && (
        <div className="public-mobile-menu">
          {links.map(([path, label]) => (
            <button key={path} className={route === path ? "public-mobile-link active" : "public-mobile-link"} onClick={() => follow(path)}>
              {label}<ArrowRight size={15} />
            </button>
          ))}
          <button className="public-mobile-link" onClick={() => follow("/judgments")}>Search court judgments<Search size={15} /></button>
          {user ? (
            <button className="public-mobile-link" onClick={() => follow("/dashboard")}>Go to workspace<ArrowRight size={15} /></button>
          ) : (
            <div className="public-mobile-actions">
              <button className="nav-login-button" onClick={() => follow("/login")}>Login</button>
              <button className="nav-signup-button" onClick={() => follow("/register")}>Sign up</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function AuthenticatedLayout({ route, user, navigate, logout, mobileOpen, setMobileOpen, children }) {
  const isAdvocate = isAdvocateUser(user);
  const navigation = isAdvocate ? ADVOCATE_WORKSPACE_NAV : CITIZEN_WORKSPACE_NAV;
  const isActiveRoute = (path) => route === path
    || (path === "/laws" && route.startsWith("/laws/"))
    || (path === "/judgments" && route.startsWith("/judgments/"));
  const currentPage = navigation.find(([path]) => isActiveRoute(path))?.[1]
    || (route === "/profile" ? "My profile" : route === "/settings" ? "Settings" : "Help & support");

  return (
    <div className="workspace-layout">
      {mobileOpen && (
        <button
          className="workspace-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`workspace-sidebar${mobileOpen ? " is-open" : ""}`} aria-label="Workspace navigation">
        <button className="workspace-brand-button" onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}>
          <Brand subtitle={isAdvocate ? "ADVOCATE WORKSPACE" : "CITIZEN WORKSPACE"} />
        </button>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="workspace-nav">
          {navigation.map(([path, label, Icon]) => (
            <button
              key={path}
              className={`workspace-nav-link${isActiveRoute(path) ? " active" : ""}`}
              onClick={() => { navigate(path); setMobileOpen(false); }}
              aria-current={isActiveRoute(path) ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-section-label sidebar-account-label">ACCOUNT</div>
        <nav className="workspace-nav">
          {[
            ["/profile", "My profile", User],
            ["/settings", "Settings", Settings],
            ["/help", "Help & support", HelpCircle]
          ].map(([path, label, Icon]) => (
            <button
              key={path}
              className={`workspace-nav-link${route === path ? " active" : ""}`}
              onClick={() => { navigate(path); setMobileOpen(false); }}
              aria-current={route === path ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="sidebar-avatar"><User size={17} /></span>
          <span className="sidebar-user-copy">
            <b>{user?.name || user?.email || "Account"}</b>
            <small>{isAdvocate ? "Advocate" : "Citizen"}</small>
          </span>
        </div>
        <button className="workspace-logout" onClick={logout}>
          <LogOut size={17} /><span>Log out</span>
        </button>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <button
            className="workspace-menu-toggle"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="workspace-breadcrumb"><span>NyayaPath</span><ChevronRight size={15} /><b>{currentPage}</b></div>
          <button className="workspace-user-button" onClick={() => navigate("/profile")}>
            <span className="workspace-user-avatar"><User size={16} /></span>
            <span>{user?.name || user?.email || "My account"}</span>
          </button>
        </header>
        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}

// ==========================================
// 1. LANDING PAGE
// ==========================================
function LandingPage({ navigate, user }) {
  const [question, setQuestion] = useState("");

  const openLegalAssistant = (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/register");
      return;
    }
    navigate(isAdvocateUser(user) ? "/lawyer-ask" : "/ask");
  };

  const services = [
    [Search, "Case law search", "Explore court judgments and legal precedents.", "/judgments"],
    [BookOpen, "Indian laws", "Browse statutes and their key provisions.", "/laws"],
    [MessageSquare, "Legal guidance", "Ask a legal question in straightforward language.", "/ask"]
  ];
  const areas = [
    ["Property law", "Ownership, tenancy and property disputes.", "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=720&q=85"],
    ["Criminal law", "Criminal procedure, bail and individual rights.", "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=720&q=85"],
    ["Family law", "Family matters, relationships and legal protections.", "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=720&q=85"],
    ["Consumer rights", "Consumer complaints, products and services.", "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=720&q=85"]
  ];

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <span className="eyebrow hero-eyebrow"><span /> LEGAL CLARITY FOR EVERYONE</span>
            <h1>YOUR PATH<br />TO <em>JUSTICE.</em></h1>
            <p>Connect with legal knowledge and navigate India’s legal landscape with confidence.</p>
            <form className="hero-question-form" onSubmit={openLegalAssistant}>
              <label className="sr-only" htmlFor="hero-legal-question">Ask a legal question</label>
              <Search size={19} aria-hidden="true" />
              <input
                id="hero-legal-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What would you like to understand?"
              />
              <button type="submit" aria-label={user ? "Open legal assistant" : "Create an account to ask"}>
                <ArrowRight size={18} />
              </button>
            </form>
            <div className="hero-actions">
              <button className="button button-tan" onClick={() => user ? navigate(isAdvocateUser(user) ? "/lawyer-ask" : "/ask") : navigate("/register")}>
                EXPLORE LEGAL TOOLS <ArrowRight size={16} />
              </button>
              <button className="button button-outline-light" onClick={() => navigate("/judgments")}>
                EXPLORE CASE LAWS
              </button>
            </div>
          </div>
          <div className="landing-hero-visual">
            <div className="hero-image-frame">
              <img
                src="https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=1200&q=90"
                alt="A classical statue representing justice"
              />
            </div>
            <div className="hero-image-caption"><Scale size={17} /><span>JUSTICE, WITHIN REACH</span></div>
          </div>
        </div>
        <div className="hero-bottom-rule" />
      </section>

      <section className="landing-services section-wrap" aria-labelledby="services-heading">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">A CLEARER WAY FORWARD</span>
            <h2 id="services-heading">Legal help, made accessible</h2>
          </div>
          <p>Useful legal information and research tools, brought together in one place.</p>
        </div>
        <div className="service-grid">
          {services.map(([Icon, title, description, path], index) => (
            <button key={title} className="service-item" onClick={() => navigate(path)}>
              <span className="service-icon"><Icon size={22} strokeWidth={1.6} /></span>
              <span className="service-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="service-link">Explore <ArrowRight size={15} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-inner section-wrap">
          <div className="editorial-copy">
            <span className="eyebrow">NYAYAPATH BRIDGES THE GAP</span>
            <h2>EMPOWER YOUR<br /><em>DECISIONS.</em></h2>
            <p>Legal systems can feel difficult to navigate. NyayaPath brings legal information, case law and role-specific research tools into a thoughtful, approachable workspace.</p>
            <button className="button button-dark" onClick={() => navigate("/about")}>LEARN MORE <ArrowRight size={16} /></button>
          </div>
          <div className="editorial-image">
            <img
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85"
              alt="A quiet, professional office interior"
              loading="lazy"
            />
            <span className="image-note">A more considered way to find your next step.</span>
          </div>
        </div>
      </section>

      <section className="how-section section-wrap" aria-labelledby="how-heading">
        <div className="centered-section-heading">
          <span className="eyebrow">A SIMPLE PLACE TO BEGIN</span>
          <h2 id="how-heading">Clarity, one step at a time</h2>
        </div>
        <div className="steps-grid">
          {[
            [Search, "Search or browse", "Start with legal topics, statutes or court judgments."],
            [BookOpen, "Explore the details", "Read summaries and review relevant information."],
            [MessageSquare, "Take your next step", "Ask a question or continue with the tools available to your role."]
          ].map(([Icon, title, description], index) => (
            <div className="step-item" key={title}>
              <span className="step-number">0{index + 1}</span>
              <span className="step-icon"><Icon size={21} strokeWidth={1.6} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="areas-section">
        <div className="section-wrap">
          <div className="section-heading-row areas-heading">
            <div>
              <span className="eyebrow">EXPLORE BY TOPIC</span>
              <h2>Legal areas that touch everyday life</h2>
            </div>
            <button className="text-link" onClick={() => navigate("/laws")}>Browse Indian laws <ArrowRight size={16} /></button>
          </div>
          <div className="areas-grid">
            {areas.map(([title, description, image]) => (
              <button className="area-card" key={title} onClick={() => navigate("/laws")}>
                <img src={image} alt="" loading="lazy" />
                <span className="area-overlay" />
                <span className="area-card-copy">
                  <span>{title}</span>
                  <small>{description}</small>
                  <ArrowRight size={17} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="knowledge-section section-wrap">
        <div className="knowledge-image">
          <img
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=85"
            alt="Shelves of books in a law library"
            loading="lazy"
          />
        </div>
        <div className="knowledge-copy">
          <span className="eyebrow">KNOWLEDGE EMPOWERS</span>
          <h2>Understand the law.<br /><em>Move forward.</em></h2>
          <p>Explore Indian laws and court judgments at your own pace, with legal guidance tools available when you need a deeper explanation.</p>
          <button className="button button-dark" onClick={() => navigate("/laws")}>EXPLORE RESOURCES <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-inner section-wrap">
          <div className="faq-intro">
            <span className="eyebrow">GOOD TO KNOW</span>
            <h2>Questions, answered.</h2>
            <p>Learn what NyayaPath currently offers and how to get started.</p>
          </div>
          <div className="faq-list">
            <details>
              <summary>How can I find a verified lawyer?<span>+</span></summary>
              <p>NyayaPath does not currently provide a lawyer directory or appointment booking. The platform offers legal information for citizens and research tools for advocates.</p>
            </details>
            <details>
              <summary>Is legal information on NyayaPath legal advice?<span>+</span></summary>
              <p>No. NyayaPath is an informational and technological platform, not a source of formal legal representation. Important matters should be verified with a qualified advocate.</p>
            </details>
            <details>
              <summary>Can I search court judgments?<span>+</span></summary>
              <p>Yes. Court judgments and advocate precedent-search tools are available through their existing sections. Sign in to access protected legal tools.</p>
            </details>
            <details>
              <summary>Do I need an account to browse legal tools?<span>+</span></summary>
              <p>Some areas, including the legal assistants and research tools, require an account. Login and registration use the existing NyayaPath account system.</p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

function CTA({ onClick, icon, text, primary }) {
  return (
    <button
      onClick={onClick}
      className={`button ${primary ? "button-tan" : "button-outline-light"}`}
    >
      {React.cloneElement(icon, { size: 17 })}
      {text}
    </button>
  );
}

function SectionTitle({ title, desc }) {
  return (
    <div className="text-center max-w-2xl mx-auto px-4">
      <h1 className="text-3xl font-black text-slate-950 tracking-tight">{title}</h1>
      <p className="text-slate-500 text-sm mt-2">{desc}</p>
    </div>
  );
}

// ==========================================
// 2. AUTHENTICATION PAGES (PostgreSQL + HttpOnly JWT cookie)
// ==========================================
function LoginPage({ navigate, setUser, message }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(message || null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.login(email, password);
      if (!result?.user) {
        throw new Error("Login did not return a user session.");
      }
      setUser(result.user);
      navigate("/dashboard", null, result.user);
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your NyayaPath workspace."
      kicker="YOUR WORKSPACE"
      variant="login"
    >
      {error && (
        <div className="auth-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={submit} className="auth-form">
        <Input label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" autoComplete="current-password" />
        <button disabled={loading} className="auth-submit">
          <span>{loading ? "Signing in..." : "Sign in"}</span>
          {!loading && <ArrowRight size={17} />}
        </button>
        <div className="auth-switch">
          <span>New to NyayaPath?</span>
          <button type="button" onClick={() => navigate("/register")}>
            Create an account
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

function RegisterPage({ navigate, setUser }) {
  const [role, setRole] = useState("Citizen");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    enrollmentNumber: "",
    stateBarCouncil: "Bar Council of Delhi",
    practiceArea: "Criminal Law",
    primaryCourt: "Supreme Court"
  });

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role,
        ...(role === "Advocate" && {
          enrollmentNumber: formData.enrollmentNumber,
          stateBarCouncil: formData.stateBarCouncil,
          primaryPracticeArea: formData.practiceArea,
          primaryCourt: formData.primaryCourt
        })
      };

      const result = await apiService.register(payload);
      if (!result?.user) {
        throw new Error("Account created, but session was not started. Please sign in.");
      }
      setUser(result.user);
      navigate("/dashboard", null, result.user);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-register">
      <div className="auth-layout">
        <AuthAside />
        <section className="auth-card">
        <div className="auth-card-heading">
          <span className="eyebrow">JOIN NYAYAPATH</span>
          <h1>Create your account</h1>
          <p>Choose how you’ll use NyayaPath and set up your workspace.</p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="auth-register-grid">
          <form onSubmit={submit} className="auth-form register-form">
            <label className="field-label">
              Account type
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="field-control"
              >
                <option value="Citizen">Citizen / General Public</option>
                <option value="Advocate">Advocate / Legal Professional</option>
              </select>
            </label>

            <Input label="Full name" value={formData.name} onChange={(v) => handleChange("name", v)} placeholder="Your full name" autoComplete="name" />
            <Input label="Email address" type="email" value={formData.email} onChange={(v) => handleChange("email", v)} placeholder="you@example.com" autoComplete="email" />
            <Input label="Password" type="password" value={formData.password} onChange={(v) => handleChange("password", v)} placeholder="At least 6 characters" autoComplete="new-password" minLength={6} />

            {role === "Advocate" && (
              <>
                <Input
                  label="Bar Council Enrollment Number"
                  value={formData.enrollmentNumber}
                  onChange={(v) => handleChange("enrollmentNumber", v)}
                  placeholder="e.g. D/1234/2018"
                  autoComplete="off"
                />

                <Input
                  label="State Bar Council"
                  value={formData.stateBarCouncil}
                  onChange={(v) => handleChange("stateBarCouncil", v)}
                  placeholder="Bar Council name"
                  autoComplete="organization"
                />

                <label className="field-label">
                  Primary practice area
                  <select
                    value={formData.practiceArea}
                    onChange={(e) => handleChange("practiceArea", e.target.value)}
                    className="field-control"
                  >
                    {PRACTICE_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </label>

                <label className="field-label">
                  Primary court jurisdiction
                  <select
                    value={formData.primaryCourt}
                    onChange={(e) => handleChange("primaryCourt", e.target.value)}
                    className="field-control"
                  >
                    {PRIMARY_COURTS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <button
              disabled={loading}
              type="submit"
              className="auth-submit"
            >
              <span>{loading ? "Creating account..." : role === "Advocate" ? "Create advocate account" : "Create citizen account"}</span>
              {!loading && <ArrowRight size={17} />}
            </button>

            <div className="auth-switch">
              <span>Already have an account?</span>
              <button type="button" onClick={() => navigate("/login")}>Sign in</button>
            </div>
          </form>

          {role === "Advocate" && (
            <aside className="auth-register-note">
                <div className="auth-note-icon">
                  <Scale size={28} />
                </div>
                <span className="eyebrow">ADVOCATE WORKSPACE</span>
                <h3>Research tools for legal professionals.</h3>
                <p>Use structured legal research, semantic precedent search, case comparison and private document tools.</p>
            </aside>
          )}
        </div>
        </section>
      </div>
    </div>
  );
}

function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-brand"><Brand subtitle="LEGAL INFORMATION, MADE CLEAR" /></div>
      <div className="auth-aside-copy">
        <span className="eyebrow">A CLEARER WAY FORWARD</span>
        <h2>Understand your rights.<br /><em>Find your way.</em></h2>
        <p>Explore legal information and the tools available in your NyayaPath workspace.</p>
      </div>
      <div className="auth-aside-foot"><Scale size={18} /><span>Knowledge is the first step toward clarity.</span></div>
    </aside>
  );
}

function AuthShell({ title, subtitle, kicker, variant, children }) {
  return (
    <div className={`auth-page auth-page-${variant}`}>
      <div className="auth-layout">
        <AuthAside />
        <section className="auth-card">
          <div className="auth-card-heading">
            <span className="eyebrow">{kicker}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, autoComplete, minLength }) {
  return (
    <label className="field-label">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        className="field-control"
        required
      />
    </label>
  );
}

// ==========================================
// 3. DASHBOARDS (ROLE DIFFERENTIATED)
// ==========================================
function DashboardPage({ user, navigate, savedLaws, savedJudgments }) {
  const isAdvocate = isAdvocateUser(user);
  const actions = isAdvocate
    ? [
        ["Legal research", "/lawyer-ask", Scale, "Run a structured legal research query"],
        ["Precedent search", "/precedent-search", Search, "Search judgments by legal reasoning"],
        ["Case comparison", "/case-compare", SplitSquareVertical, "Compare two court judgments"],
        ["Client documents", "/documents", FileText, "Upload and review indexed briefs"]
      ]
    : [
        ["Ask Nyaya AI", "/ask", MessageSquare, "Get a plain-language legal explanation"],
        ["Explore Indian laws", "/laws", BookOpen, "Browse acts and key provisions"],
        ["Court judgments", "/judgments", Scale, "Read selected landmark decisions"]
      ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <span className="eyebrow">{isAdvocate ? "ADVOCATE WORKSPACE" : "CITIZEN WORKSPACE"}</span>
          <h1>Welcome back, {user?.name || user?.email || "Counsel"}</h1>
          <p>
            {isAdvocate
              ? `Advocate${user?.advocateDetails?.primaryPracticeArea ? ` · ${user.advocateDetails.primaryPracticeArea}` : ""}${user?.advocateDetails?.primaryCourt ? ` · ${user.advocateDetails.primaryCourt}` : ""}`
              : "Your legal information and guidance tools, all in one place."}
          </p>
        </div>
        <div className="dashboard-welcome-actions">
          {isAdvocate ? (
            <>
              <CTA onClick={() => navigate("/lawyer-ask")} icon={<Scale />} text="New research" primary />
              <CTA onClick={() => navigate("/documents")} icon={<Upload />} text="Upload brief" />
            </>
          ) : (
            <>
              <CTA onClick={() => navigate("/ask")} icon={<MessageSquare />} text="Ask a question" primary />
              <CTA onClick={() => navigate("/laws")} icon={<BookOpen />} text="Browse laws" />
            </>
          )}
        </div>
      </section>

      <h2 className="dashboard-actions-heading">Your tools</h2>
      <div className="dashboard-quick-grid">
        {actions.map(([title, path, Icon, description]) => (
          <button key={path} className="dashboard-quick-card" onClick={() => navigate(path)}>
            <span className="dashboard-quick-icon"><Icon size={19} strokeWidth={1.7} /></span>
            <b>{title}</b>
            <small>{description}</small>
          </button>
        ))}
      </div>

      <div className="dashboard-saved-grid">
        <Saved
          title={`Saved Laws & Acts (${savedLaws.length})`}
          items={savedLaws.map((id) => MOCK_LAWS.find((x) => x.id === id)).filter(Boolean)}
          onClick={(id) => navigate("/laws/:id", id)}
        />
        <Saved
          title={`Saved Judgments (${savedJudgments.length})`}
          items={savedJudgments.map((id) => MOCK_JUDGMENTS.find((x) => x.id === id)).filter(Boolean)}
          onClick={(id) => navigate("/judgments/:id", id)}
        />
      </div>
    </div>
  );
}

function Saved({ title, items, onClick }) {
  return (
    <section className="saved-card">
      <h3>{title}</h3>
      <div className="saved-items">
        {items.length === 0 ? (
          <p className="saved-empty">No bookmarks saved yet.</p>
        ) : (
          items.map((x) => (
            <button
              key={x.id}
              onClick={() => onClick(x.id)}
              className="saved-item"
            >
              <span>{x.title || x.caseName}</span>
              <ChevronRight size={16} />
            </button>
          ))
        )}
      </div>
    </section>
  );
}

// ==========================================
// 4. CITIZEN AI ASSISTANT (PLAIN LANGUAGE)
// ==========================================
function CitizenAIPage({ user, navigate }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Namaste! I am your Nyaya-Path plain language legal guide. Ask any question regarding your rights, property disputes, bail, or employment laws."
    }
  ]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("English");
  const [loading, setLoading] = useState(false);
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setLoading(true);

    try {
      const res = await apiService.askCitizenAI(question, lang);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.reply,
          sources: res.sources
        }
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: e.message || "Could not process your question.", error: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-tool-page citizen-ai-page max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-10rem)]">
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4 mb-4">
        <div>
          <span className="text-[11px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Citizen Mode
          </span>
          <h1 className="text-2xl font-black text-slate-950 mt-1 flex items-center gap-2">
            <Sparkles className="text-amber-500" /> Plain Legal Language Assistant
          </h1>
        </div>

        <label className="text-xs font-bold flex items-center gap-2 text-slate-600 bg-white border p-2 rounded-xl">
          <Globe size={15} />
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-transparent outline-none">
            <option>English</option>
            <option>Hindi</option>
            <option>Bengali</option>
            <option>Tamil</option>
            <option>Telugu</option>
            <option>Marathi</option>
            <option>Kannada</option>
          </select>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-2xl rounded-3xl p-5 shadow-sm ${
              m.sender === "user" ? "bg-slate-950 text-white" : "bg-white border border-slate-200 text-slate-800"
            }`}>
              <div className="text-[10px] uppercase font-bold opacity-60 mb-1.5">
                {m.sender === "user" ? user?.name || "Citizen" : "Nyaya Path Guide"}
              </div>
              <p className="text-sm whitespace-pre-line leading-relaxed" role={m.error ? "alert" : undefined}>
                {m.error ? `Could not get a response: ${m.text}` : m.text}
              </p>

              {m.sources && m.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <b className="text-slate-700 block mb-1">Court References & Sources:</b>
                  <div className="space-y-1">
                    {m.sources.map((s, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        📄 {s.case_name || s.source} {s.page ? `(Page ${s.page})` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 p-3 rounded-2xl w-fit">
            <Sparkles className="animate-spin w-4 h-4" /> Synthesizing plain-language legal explanation...
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="bg-white border border-slate-300 rounded-3xl p-3 shadow-lg mt-4 flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows="2"
          placeholder="Ask in simple words (e.g. 'What is anticipatory bail under Section 438?')..."
          className="w-full resize-none outline-none p-2 text-sm text-slate-800"
        />
        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">Press Enter to send</span>
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. LAWYER RESEARCH CONSOLE (7-PART STRUCTURE)
// ==========================================
function LawyerResearchPage({ user, navigate }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await apiService.askLawyerAI(query);
      setResult(data);
    } catch (err) {
      setError(err.message || "Legal research failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-tool-page lawyer-research-page max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <span className="text-[11px] font-bold text-amber-600 uppercase bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Advocate Research Console
          </span>
          <h1 className="text-2xl font-black text-slate-950 mt-1 flex items-center gap-2">
            <Scale className="text-amber-500" /> 7-Part Indian Legal Research AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Retrieves grounded legal context: Legal Issue, Statutes, Decisions, Ratio Decidendi, and Citations.
          </p>
        </div>
      </div>

      {hasVerifiedAdvocateAccess(user) && <form onSubmit={handleResearch} className="bg-white border border-slate-300 rounded-3xl p-5 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          Enter Legal Research Query
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows="3"
            placeholder="e.g. Find Supreme Court cases related to Section 302 where prosecution circumstantial evidence was insufficient..."
            className="mt-1 w-full border border-slate-200 rounded-2xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </label>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-400">Grounded strictly in indexed Indian Supreme Court judgments</span>
          <button
            disabled={loading || !query.trim()}
            className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Sparkles className="animate-spin w-4 h-4" /> : <Search size={15} />}
            {loading ? "Searching Precedents..." : "Execute Legal Research"}
          </button>
        </div>
      </form>}

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}

      {/* Structured Result Display */}
      {hasVerifiedAdvocateAccess(user) && result && (
        <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-black text-slate-900">Structured Legal Briefing</h2>
            <span className="text-xs bg-amber-50 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200">
              Verified Legal Sources: {result.sources?.length || 0}
            </span>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-800 whitespace-pre-line leading-relaxed font-mono text-[13px]">
            {result.answer}
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-xs uppercase text-slate-500 mb-3 tracking-wider">
                Extracted Authoritative Citations
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {result.sources.map((s, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <b className="text-slate-900 block truncate">{s.case_name || s.source}</b>
                    <span className="text-slate-500 text-[11px] block mt-1">Citation: {s.citation || "SCC/AIR Record"}</span>
                    {s.page && <span className="text-amber-700 text-[11px]">Page {s.page}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. PRECEDENT SEMANTIC SEARCH (LAWYER)
// ==========================================
function PrecedentSearchPage({ user, navigate }) {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const results = await apiService.searchCases(query, 10);
      setCases(results);
      setHasSearched(true);
    } catch (err) {
      setCases([]);
      setHasSearched(false);
      setError(err.message || "Precedent search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-tool-page tool-page precedent-search-page max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="tool-page-heading border-b pb-4">
        <span className="text-[11px] font-bold text-amber-600 uppercase bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          Precedent Search
        </span>
        <h1 className="text-2xl font-black text-slate-950 mt-1">Semantic Case Law & Precedent Finder</h1>
        <p className="text-xs text-slate-500 mt-1">
          Search judgments by judicial reasoning, propositions of law, or case facts.
        </p>
      </div>

      {hasVerifiedAdvocateAccess(user) && <form onSubmit={search} className="precedent-search-form bg-white border rounded-2xl p-2 shadow-sm flex items-center">
        <Search className="m-3 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHasSearched(false);
            setError(null);
          }}
          placeholder="e.g. circumstantial evidence five golden principles..."
          className="flex-1 outline-none text-sm text-slate-800"
        />
        <button
          disabled={loading || !query.trim()}
          className="px-6 py-2.5 bg-slate-950 text-amber-400 font-bold rounded-xl text-xs transition"
        >
          {loading ? "Searching..." : "Search Precedents"}
        </button>
      </form>}

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}

      {hasVerifiedAdvocateAccess(user) && <div className="space-y-4">
        {!error && !loading && hasSearched && cases.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600" role="status">
            No matching precedents found. Try a broader query.
          </p>
        )}
        {cases.map((c, i) => (
          <div key={i} className="precedent-result-card bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-bold text-slate-950 text-base">{c.case_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {c.court} • Year {c.year} {c.citation ? `• Citation: ${c.citation}` : ""}
                </p>
              </div>
              {c.similarity_score != null && (
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg">
                  Score: {(c.similarity_score * 100).toFixed(1)}%
                </span>
              )}
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed font-mono">
              "{c.relevant_text}"
            </p>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ==========================================
// 7. CASE COMPARISON MATRIX (LAWYER)
// ==========================================
function CaseComparePage({ user, navigate }) {
  const [caseA, setCaseA] = useState("Sharad Birdhichand Sarda v. State of Maharashtra");
  const [caseB, setCaseB] = useState("Gurbaksh Singh Sibbia v. State of Punjab");
  const [comparisonQuery, setComparisonQuery] = useState("Compare the evidentiary requirements and judicial reasoning");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const compare = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await apiService.compareCases(caseA, caseB, comparisonQuery);
      setResult(res);
    } catch (err) {
      setError(err.message || "Case comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-tool-page case-compare-page max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b pb-4">
        <span className="text-[11px] font-bold text-amber-600 uppercase bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          Case Law Comparative Analysis
        </span>
        <h1 className="text-2xl font-black text-slate-950 mt-1">Side-by-Side Precedent Comparison</h1>
        <p className="text-xs text-slate-500 mt-1">
          Analyzes facts, issues, statutory interpretations, decisions, similarities, and differences.
        </p>
      </div>

      {hasVerifiedAdvocateAccess(user) && <form onSubmit={compare} className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Case A (Title or Reference)" value={caseA} onChange={setCaseA} />
          <Input label="Case B (Title or Reference)" value={caseB} onChange={setCaseB} />
        </div>
        <Input label="Comparison Focus / Question" value={comparisonQuery} onChange={setComparisonQuery} />

        <button
          disabled={loading}
          className="w-full py-3 bg-slate-950 text-amber-400 font-bold rounded-xl text-xs transition"
        >
          {loading ? "Analyzing and Comparing..." : "Generate Comparative Analysis"}
        </button>
      </form>}

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}

      {hasVerifiedAdvocateAccess(user) && result && (
        <div className="bg-white border rounded-3xl p-6 shadow-md space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Comparative Synthesis</h2>
          <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-mono">
            {result.comparison}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. DOCUMENT UPLOADER (ISOLATED CLIENT BRIEFS)
// ==========================================
function DocumentsPage({ user, navigate }) {
  const [docs, setDocs] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [caseName, setCaseName] = useState("");
  const [citation, setCitation] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState("loading");
  const fileInput = useRef(null);

  useEffect(() => {
    apiService.getMyUploadedDocuments().then((items) => {
      setDocs(items);
    }).catch((err) => {
      setDocumentsError(err.message || "Could not load your uploaded documents.");
    }).finally(() => {
      setDocumentsLoading(false);
    });
  }, []);

  const handleUpload = async (file) => {
    if (!file || loading) return;
    setLoading(true);
    setStatusType("loading");
    setStatusMessage("Extracting text, chunking, and indexing into isolated Qdrant store...");

    try {
      const res = await apiService.uploadLawyerDocument(file, { caseName, citation });
      if (!res.document) {
        throw new Error("The server did not return the indexed document. Please refresh and check the list.");
      }
      setStatusMessage("Document successfully indexed into isolated legal vector store!");
      setStatusType("success");
      setDocs((prev) => [res.document, ...prev]);
    } catch (err) {
      setStatusType("error");
      setStatusMessage(err.message || "Document upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-tool-page documents-page max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b pb-4">
        <span className="text-[11px] font-bold text-amber-600 uppercase bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          Client Document Intelligence
        </span>
        <h1 className="text-2xl font-black text-slate-950 mt-1">Upload Case Briefs & Judgments</h1>
        <p className="text-xs text-slate-500 mt-1">
          Files are tagged with your Advocate ID (<span className="font-mono">{user?.id}</span>) and isolated from public searches.
        </p>
      </div>

      <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Case Name / Brief Title" value={caseName} onChange={setCaseName} placeholder="e.g. ABC Corp v. Union of India" />
          <Input label="Citation / Reference" value={citation} onChange={setCitation} placeholder="e.g. 2024 INSC 456" />
        </div>

        <input
          ref={fileInput}
          className="sr-only"
          type="file"
          accept=".pdf,application/pdf"
          disabled={loading}
          onChange={(e) => {
            handleUpload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => fileInput.current?.click()}
          className="w-full border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 p-8 rounded-2xl text-center cursor-pointer transition disabled:cursor-wait disabled:opacity-60"
        >
          <Upload className="mx-auto text-amber-500 mb-2" size={32} />
          <b className="text-sm text-slate-800">Click to Select Judgment PDF</b>
          <p className="text-xs text-slate-500 mt-1">Supported format: PDF documents</p>
        </button>
        {statusMessage && (
          <p
            className={`text-xs font-semibold ${statusType === "error" ? "text-rose-700" : "text-amber-700"}`}
            role={statusType === "error" ? "alert" : "status"}
          >
            {statusMessage}
          </p>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Your Indexed Client Documents ({docs.length})</h3>
        {documentsLoading && <p className="text-sm text-slate-600" role="status">Loading your documents...</p>}
        {documentsError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            {documentsError}
          </p>
        )}
        {!documentsLoading && !documentsError && docs.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No indexed documents yet. Select a PDF above to add your first document.
          </p>
        )}
        {docs.map((d, i) => (
          <div key={i} className="bg-white border rounded-2xl p-4 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <FileCheck className="text-emerald-500 w-5 h-5" />
              <div>
                <b className="text-slate-900 block">{d.caseName || d.fileName}</b>
                <span className="text-slate-500 text-[11px]">{d.court || "Court"} • {d.citation || "No citation"}</span>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
              {d.chunksIndexed || 1} chunks indexed
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 9. LAWS & JUDGMENTS BROWSERS
// ==========================================
function LawsPage({ navigate, savedLaws, toggleSave }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const categories = ["All", ...new Set(MOCK_LAWS.map((l) => l.category))];
  const filtered = MOCK_LAWS.filter((x) =>
    (cat === "All" || x.category === cat) &&
    `${x.title} ${x.description}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <ListPage title="Indian Laws & Acts" subtitle="Prototype sample content. Verify statutes against current official sources." search={q} setSearch={setQ} filter={cat} setFilter={setCat} filters={categories}>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
          No laws match your search and category filter.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((l) => (
            <div key={l.id} className="legal-record-card bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{l.category}</span>
                <button type="button" aria-label={`${savedLaws.includes(l.id) ? "Remove" : "Save"} ${l.title}`} onClick={() => toggleSave(l.id)}>
                  {savedLaws.includes(l.id) ? <BookmarkCheck className="text-amber-500" /> : <Bookmark className="text-slate-400" />}
                </button>
              </div>
              <h2 className="font-bold text-base text-slate-950 mt-3">{l.title}</h2>
              <p className="text-xs text-slate-500">{l.number} • {l.year}</p>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{l.description}</p>
              <button type="button" onClick={() => navigate("/laws/:id", l.id)} className="mt-3 text-xs font-bold text-amber-700 flex items-center gap-1">
                View Sections <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ListPage>
  );
}

function LawDetailPage({ id, navigate, savedLaws, toggleSave }) {
  const law = MOCK_LAWS.find((x) => x.id === id);
  if (!law) return <NotFoundPage navigate={navigate} />;

  return (
    <DetailShell title={law.title} meta={`${law.number} • ${law.year}`} back={() => navigate("/laws")}>
      <div className="flex justify-between items-center mt-2">
        <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">{law.category}</span>
        <button onClick={() => toggleSave(law.id)}>
          {savedLaws.includes(law.id) ? <BookmarkCheck className="text-amber-500" /> : <Bookmark className="text-slate-400" />}
        </button>
      </div>
      <p className="mt-4 text-sm text-slate-700">{law.description}</p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-5">
        <b className="text-xs uppercase text-amber-900 tracking-wider">Plain-Language Summary</b>
        <p className="text-xs text-slate-800 mt-1">{law.simpleExplanation}</p>
      </div>
      <h2 className="font-bold text-base mt-6 mb-3">Key Sections</h2>
      <div className="space-y-3">
        {law.keySections.map((s) => (
          <div className="border border-slate-200 rounded-xl p-3.5 text-xs bg-slate-50" key={s.number}>
            <b className="text-slate-900">{s.number} — {s.title}</b>
            <p className="text-slate-600 mt-1">{s.content}</p>
          </div>
        ))}
      </div>
    </DetailShell>
  );
}

function JudgmentsPage({ navigate, savedJudgments, toggleSave }) {
  const [q, setQ] = useState("");
  const [court, setCourt] = useState("All");
  const courts = ["All", ...new Set(MOCK_JUDGMENTS.map((j) => j.court))];
  const filtered = MOCK_JUDGMENTS.filter((x) =>
    (court === "All" || x.court === court) &&
    `${x.caseName} ${x.shortSummary}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <ListPage title="Indian Court Judgments" subtitle="Prototype sample content. Verify judgments and citations against official court records." search={q} setSearch={setQ} filter={court} setFilter={setCourt} filters={courts}>
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
          No judgments match your search and court filter.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((j) => (
            <div key={j.id} className="legal-record-card bg-white border rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">{j.court}</span>
                <button type="button" aria-label={`${savedJudgments.includes(j.id) ? "Remove" : "Save"} ${j.caseName}`} onClick={() => toggleSave(j.id)}>
                  {savedJudgments.includes(j.id) ? <BookmarkCheck className="text-amber-500" /> : <Bookmark className="text-slate-400" />}
                </button>
              </div>
              <h2 className="font-bold text-base text-slate-950">{j.caseName}</h2>
              <p className="text-xs text-slate-500">{j.year} • {j.caseNumber}</p>
              <p className="text-xs text-slate-700">{j.shortSummary}</p>
              <button type="button" onClick={() => navigate("/judgments/:id", j.id)} className="text-xs font-bold text-amber-700 flex items-center gap-1">
                Read Judgment <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ListPage>
  );
}

function JudgmentDetailPage({ id, navigate, savedJudgments, toggleSave }) {
  const j = MOCK_JUDGMENTS.find((x) => x.id === id);
  if (!j) return <NotFoundPage navigate={navigate} />;

  return (
    <DetailShell title={j.caseName} meta={`${j.court} • ${j.year} • ${j.caseNumber}`} back={() => navigate("/judgments")}>
      <div className="text-xs text-slate-500 mt-2">Bench: {j.judges.join(", ")}</div>
      <div className="bg-slate-950 text-white rounded-2xl p-5 mt-5">
        <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider">AI Ratio Decidendi</h3>
        <p className="text-xs text-slate-300 mt-2">{j.aiSummary}</p>
      </div>
      <div className="border rounded-2xl p-4 mt-5 text-xs text-slate-700 space-y-2">
        <b>Acts & Provisions Considered:</b>
        <div className="flex flex-wrap gap-2">
          {j.actsInvolved.map((a) => (
            <span key={a} className="bg-slate-100 px-2 py-1 rounded text-slate-800">{a}</span>
          ))}
        </div>
      </div>
    </DetailShell>
  );
}

function ListPage({ title, subtitle, search, setSearch, filter, setFilter, filters, children }) {
  return (
    <div className="catalog-page max-w-7xl mx-auto px-4 py-8">
      <SectionTitle title={title} desc={subtitle} />
      <div className="catalog-toolbar bg-white border rounded-2xl p-3 mt-6 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="catalog-search flex-1 flex items-center gap-2 border rounded-xl px-3 bg-slate-50">
          <Search size={16} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-transparent outline-none p-2 text-xs" />
        </div>
        <select aria-label="Filter results" value={filter} onChange={(e) => setFilter(e.target.value)} className="catalog-filter border rounded-xl p-2 text-xs bg-white">
          {filters.map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function DetailShell({ title, meta, back, children }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={back} className="text-xs font-bold text-amber-700 mb-4 hover:underline">← Back to catalogue</button>
      <div className="bg-white border rounded-3xl p-6 sm:p-8 shadow-md">
        <h1 className="text-2xl font-black text-slate-950">{title}</h1>
        <p className="text-xs text-slate-500 mt-1">{meta}</p>
        {children}
      </div>
    </div>
  );
}

function ProfilePage({ user }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white border rounded-3xl p-8 shadow-md space-y-4">
        <h1 className="text-xl font-black text-slate-950">User Profile</h1>
        <div className="space-y-2 text-xs">
          <div><span className="text-slate-500">Name:</span> <b className="text-slate-800">{user?.name}</b></div>
          <div><span className="text-slate-500">Email:</span> <b className="text-slate-800">{user?.email}</b></div>
          <div><span className="text-slate-500">Role:</span> <b className="text-amber-700 uppercase">{user?.role}</b></div>
          {user?.advocateDetails && (
            <div className="mt-4 pt-3 border-t space-y-1 bg-slate-50 p-3 rounded-xl">
              <div><span className="text-slate-500">Enrollment:</span> <b>{user.advocateDetails.enrollmentNumber}</b></div>
              <div><span className="text-slate-500">Bar Council:</span> <b>{user.advocateDetails.stateBarCouncil}</b></div>
              <div><span className="text-slate-500">Practice Area:</span> <b>{user.advocateDetails.primaryPracticeArea}</b></div>
              <div><span className="text-slate-500">Court:</span> <b>{user.advocateDetails.primaryCourt}</b></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white border rounded-3xl p-8 shadow-md text-xs text-slate-600">
        <h1 className="text-xl font-black text-slate-950 mb-3">Settings</h1>
        <p>PostgreSQL profile and language settings configured.</p>
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white border rounded-3xl p-8 shadow-md text-xs text-slate-700 space-y-3 leading-relaxed">
        <h1 className="text-2xl font-black text-slate-950">About Nyaya Path</h1>
        <p>Nyaya Path is an AI-powered Indian legal information platform connecting everyday citizens and advocates with source-grounded Supreme Court judgments.</p>
        <p>Built with Spring Boot, PostgreSQL, Python FastAPI, LangChain, and Qdrant.</p>
      </div>
    </div>
  );
}

function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white border rounded-3xl p-8 shadow-md text-xs text-slate-700 space-y-3 leading-relaxed">
        <h1 className="text-2xl font-black text-slate-950">Legal Disclaimer</h1>
        <p>Nyaya-Path is an informational and technological platform and does not provide formal legal representation. Always verify important matters with certified advocates.</p>
      </div>
    </div>
  );
}

function NotFoundPage({ navigate }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white border rounded-3xl p-8 shadow-md space-y-4">
        <span className="eyebrow">PAGE NOT FOUND</span>
        <h1 className="text-2xl font-black text-slate-950">We couldn’t find that page.</h1>
        <p className="text-sm text-slate-600">The link may be outdated or the item may no longer be available.</p>
        <button type="button" onClick={() => navigate("/")} className="auth-submit">
          Return to home <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <button className="footer-brand" onClick={() => navigate("/")}>Nyaya<span>Path</span></button>
          <p>Indian legal information and research platform</p>
        </div>
        <div className="footer-links">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/laws")}>Indian laws</button>
          <button onClick={() => navigate("/judgments")}>Court judgments</button>
          <button onClick={() => navigate("/help")}>Legal disclaimer</button>
        </div>
      </div>
    </footer>
  );
}
