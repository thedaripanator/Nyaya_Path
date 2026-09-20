import React, { useEffect, useRef, useState } from "react";
import {
  Scale, BookOpen, FileText, Search, MessageSquare, Upload, User, Settings,
  HelpCircle, LogOut, ChevronRight, Mic, Send, Globe, Bookmark, BookmarkCheck,
  Sparkles, ShieldAlert, FileCheck, Menu, X, ArrowRight
} from "lucide-react";
import { MOCK_LAWS, MOCK_JUDGMENTS, MOCK_DOCUMENTS } from "./data/mockData";
import { apiService } from "./services/apiService";

const navItems = [
  ["/", "Home"], ["/ask", "Ask AI"], ["/laws", "Laws"],
  ["/judgments", "Judgments"], ["/documents", "Documents"], ["/about", "About"]
];

export default function App() {
  const [route, setRoute] = useState("/");
  const [param, setParam] = useState(null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nyaya_user")) || null; } catch { return null; }
  });
  const [savedLaws, setSavedLaws] = useState(["law-1"]);
  const [savedJudgments, setSavedJudgments] = useState(["judg-1"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileOpen(false);
  }, [route, param]);

  const navigate = (nextRoute, id = null) => {
    setRoute(nextRoute);
    setParam(id);
  };

  const logout = () => {
    localStorage.removeItem("nyaya_user");
    setUser(null);
    navigate("/");
  };

  const toggle = (setter, id) => {
    setter((items) => {
      if (items.includes(id)) {
        return items.filter((item) => item !== id);
      }

      return [...items, id];
    });
  };

  let content;

  if (route === "/") {
    content = <LandingPage navigate={navigate} />;
  } else if (route === "/about") {
    content = <AboutPage navigate={navigate} />;
  } else if (route === "/login") {
    content = <LoginPage navigate={navigate} setUser={setUser} />;
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
    content = <AskAIPage />;
  } else if (route === "/laws") {
    content = (
      <LawsPage
        navigate={navigate}
        savedLaws={savedLaws}
        toggleSave={(id) => toggle(setSavedLaws, id)}
      />
    );
  } else if (route === "/laws/:id") {
    content = (
      <LawDetailPage
        id={param}
        navigate={navigate}
        savedLaws={savedLaws}
        toggleSave={(id) => toggle(setSavedLaws, id)}
      />
    );
  } else if (route === "/judgments") {
    content = (
      <JudgmentsPage
        navigate={navigate}
        savedJudgments={savedJudgments}
        toggleSave={(id) => toggle(setSavedJudgments, id)}
      />
    );
  } else if (route === "/judgments/:id") {
    content = (
      <JudgmentDetailPage
        id={param}
        navigate={navigate}
        savedJudgments={savedJudgments}
        toggleSave={(id) => toggle(setSavedJudgments, id)}
      />
    );
  } else if (route === "/documents") {
    content = <DocumentsPage />;
  } else if (route === "/profile") {
    content = <ProfilePage user={user} setUser={setUser} />;
  } else if (route === "/settings") {
    content = <SettingsPage />;
  } else {
    content = <HelpPage navigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-left">
            <span className="p-2 bg-amber-500 text-slate-950 rounded-lg"><Scale className="w-5 h-5" /></span>
            <span><b className="text-xl">Nyaya <span className="text-amber-400">Path</span></b><small className="block text-[9px] uppercase tracking-wider text-slate-400">AI Legal Platform</small></span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(([path, label]) => <NavButton key={path} active={route === path} onClick={() => navigate(path)} label={label} />)}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {user ? <>
              <button onClick={() => navigate("/dashboard")} className="px-3 py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"><User className="inline w-4 h-4 mr-1" />Dashboard</button>
              <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-400"><LogOut className="w-4 h-4" /></button>
            </> : <>
              <button onClick={() => navigate("/login")} className="px-3 py-2 text-sm">Login</button>
              <button onClick={() => navigate("/register")} className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold">Get Started</button>
            </>}
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
        </div>
        {mobileOpen && <div className="md:hidden px-4 pb-4 space-y-1">
          {navItems.map(([path, label]) => <MobileNavButton key={path} active={route === path} onClick={() => navigate(path)} label={label} />)}
          {user ? <><MobileNavButton onClick={() => navigate("/dashboard")} label="Dashboard" /><MobileNavButton onClick={logout} label="Logout" /></> :
            <><MobileNavButton onClick={() => navigate("/login")} label="Login" /><MobileNavButton onClick={() => navigate("/register")} label="Register" /></>}
        </div>}
      </header>

      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-center text-slate-700 flex justify-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        <span><b>Educational & informational platform:</b> Nyaya Path does not replace professional legal advice. Verify important information with authoritative sources.</span>
      </div>

      <main className="flex-1">{content}</main>
      <Footer navigate={navigate} />
    </div>
  );
}

function NavButton({ active, onClick, label }) {
  const buttonClass = active
    ? "bg-slate-800 text-amber-400"
    : "text-slate-300 hover:bg-slate-800";

  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-medium ${buttonClass}`}
    >
      {label}
    </button>
  );
}

function MobileNavButton({ active, onClick, label }) {
  const buttonClass = active
    ? "bg-slate-800 text-amber-400"
    : "text-slate-300";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${buttonClass}`}
    >
      {label}
    </button>
  );
}

function LandingPage({ navigate }) {
  const [q, setQ] = useState("");
  return <div>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7 space-y-6">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold"><Sparkles className="w-4 h-4" /> AI-Powered Legal Accessibility</span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950">Making Indian Law <span className="text-amber-600">Easier to Understand</span></h1>
        <p className="text-lg text-slate-600 max-w-2xl">Discover, search and understand Indian legal information through a future-ready NLP and RAG-powered platform.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate("/ask"); }} className="bg-white border rounded-2xl p-2 shadow-lg max-w-2xl flex">
          <Search className="m-3 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Describe your legal question..." className="flex-1 outline-none text-sm" />
          <button className="px-5 bg-slate-950 text-amber-400 rounded-xl font-bold text-sm">Ask AI</button>
        </form>
        <div className="flex flex-wrap gap-3">
          <CTA onClick={() => navigate("/ask")} icon={<MessageSquare />} text="Ask a Legal Question" primary />
          <CTA onClick={() => navigate("/laws")} icon={<BookOpen />} text="Explore Indian Laws" />
        </div>
      </div>
      <div className="lg:col-span-5 bg-slate-950 rounded-3xl p-6 text-white shadow-2xl">
        <div className="text-xs text-amber-400 font-bold mb-4">NYAYA PATH PIPELINE</div>
        <Pipeline title="User legal question" text="My employer has not paid my salary." />
        <Pipeline title="NLP layer" text="Intent • Entities • Legal topic" />
        <Pipeline title="RAG retrieval" text="Acts • Sections • Judgments" />
        <Pipeline title="Citizen-friendly output" text="Plain-language explanation + sources" />
      </div>
    </section>

    <section className="bg-white border-y py-16">
      <SectionTitle title="Key Features" desc="Designed as a modular frontend for future backend and NLP integration." />
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
        {[
          ["Ask Nyaya AI", "Natural-language legal question interface.", "/ask", Sparkles],
          ["Simplify Legal Language", "Citizen-friendly explanation UI.", "/ask", FileText],
          ["Explore Judgments", "Search and inspect court judgments.", "/judgments", Scale],
          ["Find Laws & Acts", "Search legal provisions by category.", "/laws", BookOpen],
          ["Document Analysis", "Upload documents and view NLP extraction.", "/documents", Upload],
          ["Multilingual Access", "Language-ready AI assistant interface.", "/ask", Globe]
        ].map(([title, desc, path, Icon]) => <FeatureCard key={title} title={title} desc={desc} Icon={Icon} onClick={() => navigate(path)} />)}
      </div>
    </section>

    <section className="max-w-7xl mx-auto px-4 py-16">
      <SectionTitle title="How Nyaya Path Works" desc="Frontend representation of the future NLP + RAG architecture." />
      <div className="grid md:grid-cols-4 gap-5 mt-10">
        {["Ask or Upload", "AI Understands", "Retrieve Legal Sources", "Explain Simply"].map((x, i) => <div key={x} className="bg-white border rounded-2xl p-6 text-center"><div className="mx-auto mb-4 w-9 h-9 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-bold">{i + 1}</div><b>{x}</b><p className="text-xs text-slate-500 mt-2">Reusable UI stage ready for future API integration.</p></div>)}
      </div>
    </section>
  </div>;
}

function Pipeline({ title, text }) {
  return (
    <div className="border border-slate-800 rounded-xl p-4 mb-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <div className="text-sm mt-1">{text}</div>
    </div>
  );
}

function CTA({ onClick, icon, text, primary }) {
  const buttonClass = primary
    ? "bg-amber-500 text-slate-950"
    : "bg-white border border-slate-300";

  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-xl flex items-center gap-2 font-bold text-sm ${buttonClass}`}
    >
      {React.cloneElement(icon, { size: 17 })}
      {text}
    </button>
  );
}

function SectionTitle({ title, desc }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <h2 className="text-3xl font-black text-slate-950">{title}</h2>
      <p className="text-slate-500 text-sm mt-2">{desc}</p>
    </div>
  );
}

function FeatureCard({ title, desc, Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-6 bg-slate-50 border rounded-2xl hover:shadow-lg hover:border-amber-400 transition"
    >
      <div className="p-3 bg-white border rounded-xl w-fit mb-4">
        <Icon className="text-amber-500" />
      </div>

      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-slate-500 mt-2">{desc}</p>
    </button>
  );
}

function LoginPage({ navigate, setUser }) {
  const [email, setEmail] = useState("demo@nyayapath.app");
  const [password, setPassword] = useState("password");
  const submit = async (e) => {
    e.preventDefault();

    const result = await apiService.login(email, password);

    localStorage.setItem("nyaya_user", JSON.stringify(result.user));
    setUser(result.user);
    navigate("/dashboard");
  };
  return <AuthShell title="Welcome back" subtitle="Sign in to your Nyaya Path workspace."><form onSubmit={submit} className="space-y-4"><Input label="Email" value={email} onChange={setEmail} /><Input label="Password" type="password" value={password} onChange={setPassword} /><button className="w-full py-3 bg-slate-950 text-amber-400 rounded-xl font-bold">Login</button><button type="button" onClick={() => navigate("/register")} className="w-full text-sm text-amber-700">Create an account</button></form></AuthShell>;
}
function RegisterPage({ navigate, setUser }) {
  const [data, setData] = useState({ name: "", email: "", password: "", role: "Citizen" });
  const submit = async (e) => {
    e.preventDefault();

    const result = await apiService.register(data);

    localStorage.setItem("nyaya_user", JSON.stringify(result.user));
    setUser(result.user);
    navigate("/dashboard");
  };
  return <AuthShell title="Create your account" subtitle="Choose how you plan to use Nyaya Path."><form onSubmit={submit} className="space-y-4"><Input label="Full Name" value={data.name} onChange={(v) => setData({ ...data, name: v })} /><Input label="Email" value={data.email} onChange={(v) => setData({ ...data, email: v })} /><Input label="Password" type="password" value={data.password} onChange={(v) => setData({ ...data, password: v })} /><label className="block text-sm font-semibold">User Type<select value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })} className="mt-1 w-full border rounded-xl p-3"><option>Citizen</option><option>Lawyer</option><option>Student</option></select></label><button className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl font-bold">Create Account</button></form></AuthShell>;
}
function AuthShell({ title, subtitle, children }) {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border rounded-3xl p-8 shadow-sm">
        <div className="text-center mb-7">
          <Scale className="mx-auto text-amber-500" size={32} />
          <h1 className="text-2xl font-black mt-3">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block text-sm font-semibold">
      {label}

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-400"
        required
      />
    </label>
  );
}

function DashboardPage({ user, navigate, savedLaws, savedJudgments }) {
  const [q, setQ] = useState("");
  return <div className="max-w-7xl mx-auto px-4 py-8 space-y-7">
    <div className="bg-slate-950 text-white rounded-3xl p-7 flex flex-col md:flex-row md:justify-between gap-5"><div><span className="text-xs text-amber-400 font-bold uppercase">Role: {user?.role || "Citizen"}</span><h1 className="text-3xl font-black mt-2">Welcome back, {user?.name || "Citizen"}</h1><p className="text-slate-400 text-sm mt-2">Your legal research and AI workspace.</p></div><div className="flex gap-2"><CTA onClick={() => navigate("/ask")} icon={<Sparkles/>} text="New AI Query" primary/><CTA onClick={() => navigate("/documents")} icon={<Upload/>} text="Upload Document"/></div></div>
    <div className="bg-white border rounded-2xl p-6"><h2 className="font-bold text-lg flex gap-2 items-center"><Sparkles className="text-amber-500"/> Ask Nyaya AI</h2><textarea value={q} onChange={(e) => setQ(e.target.value)} className="w-full border rounded-xl p-4 mt-4" rows="3" placeholder="Describe your legal question in your own words..." /><button onClick={() => navigate("/ask")} className="mt-3 px-5 py-2 bg-slate-950 text-amber-400 rounded-xl font-bold text-sm">Ask Nyaya AI <Send className="inline w-4"/></button></div>
    <div className="grid md:grid-cols-4 gap-4">{[["Ask AI","/ask",MessageSquare],["Search Laws","/laws",BookOpen],["Judgments","/judgments",Scale],["Documents","/documents",FileText]].map(([t,p,I]) => <button key={t} onClick={() => navigate(p)} className="bg-white border p-5 rounded-2xl flex items-center gap-3 font-bold"><I className="text-amber-500"/>{t}</button>)}</div>
    <div className="grid lg:grid-cols-2 gap-6"><Saved title={`Saved Laws (${savedLaws.length})`} items={savedLaws.map(id => MOCK_LAWS.find(x => x.id === id)).filter(Boolean)} onClick={(id) => navigate("/laws/:id", id)} /><Saved title={`Saved Judgments (${savedJudgments.length})`} items={savedJudgments.map(id => MOCK_JUDGMENTS.find(x => x.id === id)).filter(Boolean)} onClick={(id) => navigate("/judgments/:id", id)} /></div>
  </div>;
}
function Saved({ title, items, onClick }) { return <div className="bg-white border rounded-2xl p-6"><h3 className="font-bold border-b pb-3">{title}</h3><div className="space-y-3 mt-4">{items.map(x => <button key={x.id} onClick={() => onClick(x.id)} className="w-full text-left bg-slate-50 p-3 rounded-xl flex justify-between"><span className="text-sm font-semibold">{x.title || x.caseName}</span><ChevronRight size={16}/></button>)}</div></div>; }

function AskAIPage() {
  const [messages, setMessages] = useState([{ sender: "ai", text: "Namaste! Describe your legal concern in simple words. This demo uses mock NLP responses." }]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("English");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const end = useRef(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [messages, loading]);
  const send = async () => {
    if (!input.trim() || loading) {
      return;
    }

    const question = input;

    setInput("");
    setMessages((messages) => [
      ...messages,
      { sender: "user", text: question }
    ]);
    setLoading(true);

    const result = await apiService.askNyayaAI(question, lang);

    setMessages((messages) => [
      ...messages,
      {
        sender: "ai",
        text: result.reply,
        nlp: result
      }
    ]);

    setLoading(false);
  };

  const voice = () => {
    setListening(true);

    setTimeout(() => {
      setInput("My landlord has not returned my security deposit.");
      setListening(false);
    }, 1800);
  };
  return <div className="max-w-6xl mx-auto px-4 py-7 flex flex-col min-h-[calc(100vh-9rem)]">
    <div className="flex flex-wrap justify-between gap-3 border-b pb-4"><div><h1 className="text-2xl font-black flex items-center gap-2"><Sparkles className="text-amber-500"/> Nyaya AI Legal Assistant</h1><p className="text-sm text-slate-500">Future-ready chat interface for NLP + RAG.</p></div><label className="text-xs font-bold flex items-center gap-2"><Globe size={16}/><select value={lang} onChange={e => setLang(e.target.value)} className="border rounded-lg p-2"><option>English</option><option>Hindi</option><option>Kannada</option><option>Bengali</option><option>Tamil</option><option>Telugu</option><option>Marathi</option></select></label></div>
    <div className="flex-1 overflow-y-auto py-6 space-y-5">{messages.map((m,i) => <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-3xl rounded-2xl p-4 ${m.sender === "user" ? "bg-slate-950 text-white" : "bg-white border"}`}><div className="text-[10px] uppercase font-bold opacity-60 mb-2">{m.sender === "user" ? "Citizen" : "Nyaya Path AI"}</div><p className="text-sm whitespace-pre-line">{m.text}</p>{m.nlp && <NLPPanel data={m.nlp}/>}</div></div>)}{loading && <div className="text-sm text-slate-500">Nyaya AI is processing...</div>}<div ref={end}/></div>
    <div className="bg-white border rounded-2xl p-3 shadow-sm"><textarea value={input} onChange={e => setInput(e.target.value)} rows="3" className="w-full resize-none outline-none p-2" placeholder="Describe your legal issue..."/><div className="flex justify-between"><button onClick={voice} className={`px-3 py-2 rounded-lg text-xs ${listening ? "bg-rose-100 text-rose-700" : "bg-slate-100"}`}><Mic className="inline w-4 mr-1"/>{listening ? "Listening..." : "Voice Input"}</button><button onClick={send} className="px-5 py-2 bg-slate-950 text-amber-400 rounded-lg text-xs font-bold"><Send className="inline w-4 mr-1"/>Send</button></div></div>
  </div>;
}
function NLPPanel({ data }) {
  return (
    <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs">
      <div className="border rounded-xl p-3">
        <b>Detected Intent</b>
        <div className="mt-1">
          {data.intent} · {(data.confidence * 100).toFixed(0)}%
        </div>
      </div>

      <div className="border rounded-xl p-3">
        <b>Topic</b>
        <div className="mt-1">{data.topic}</div>
      </div>

      <div className="border rounded-xl p-3 sm:col-span-2">
        <b>Entities</b>

        <div className="flex flex-wrap gap-2 mt-2">
          {data.entities.map((entity, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-amber-50 rounded-lg"
            >
              {entity.type}: {entity.value}
            </span>
          ))}
        </div>
      </div>

      <div className="border rounded-xl p-3 sm:col-span-2">
        <b>Sources</b>

        <div className="mt-2 space-y-1">
          {data.sources.map((source, index) => (
            <div key={index}>
              {source.title} — {source.section}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LawsPage({ navigate, savedLaws, toggleSave }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const categories = [
    "All",
    ...new Set(MOCK_LAWS.map((law) => law.category))
  ];
  const filtered = MOCK_LAWS.filter(x => (cat === "All" || x.category === cat) && `${x.title} ${x.description}`.toLowerCase().includes(q.toLowerCase()));
  return <ListPage title="Explore Indian Laws" subtitle="Search the mock legal catalogue; connect it to your verified dataset later." search={q} setSearch={setQ} filter={cat} setFilter={setCat} filters={categories}><div className="grid md:grid-cols-2 gap-5">{filtered.map(l => <div key={l.id} className="bg-white border rounded-2xl p-5"><div className="flex justify-between gap-3"><span className="text-xs bg-slate-100 px-2 py-1 rounded">{l.category}</span><button onClick={() => toggleSave(l.id)}>{savedLaws.includes(l.id) ? <BookmarkCheck className="text-amber-500"/> : <Bookmark/>}</button></div><h2 className="font-bold text-lg mt-3">{l.title}</h2><p className="text-xs text-slate-500 mt-1">{l.number} · {l.year}</p><p className="text-sm text-slate-600 mt-3">{l.description}</p><button onClick={() => navigate("/laws/:id", l.id)} className="mt-4 text-sm font-bold text-amber-700">View Details <ArrowRight className="inline w-4"/></button></div>)}</div></ListPage>;
}
function ListPage({ title, subtitle, search, setSearch, filter, setFilter, filters, children }) { return <div className="max-w-7xl mx-auto px-4 py-10"><SectionTitle title={title} desc={subtitle}/><div className="bg-white border rounded-2xl p-3 mt-8 flex flex-col md:flex-row gap-3"><div className="flex-1 flex items-center gap-2 border rounded-xl px-3"><Search size={18} className="text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full outline-none p-2 text-sm"/></div><select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-xl p-2 text-sm">{filters.map(x => <option key={x}>{x}</option>)}</select></div><div className="mt-6">{children}</div></div>; }

function LawDetailPage({ id, navigate, savedLaws, toggleSave }) {
  const law = MOCK_LAWS.find(x => x.id === id) || MOCK_LAWS[0];
  return <DetailShell title={law.title} meta={`${law.number} · ${law.year}`} back={() => navigate("/laws")}><div className="flex justify-between"><span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold">{law.category}</span><button onClick={() => toggleSave(law.id)}>{savedLaws.includes(law.id) ? <BookmarkCheck className="text-amber-500"/> : <Bookmark/>}</button></div><p className="mt-5 text-slate-600">{law.description}</p><div className="bg-slate-50 border rounded-2xl p-5 mt-6"><b>Simple explanation</b><p className="text-sm mt-2">{law.simpleExplanation}</p></div><h2 className="font-bold text-xl mt-8">Key Sections</h2><div className="space-y-3 mt-4">{law.keySections.map(s => <div className="border rounded-xl p-4" key={s.number}><b>{s.number} — {s.title}</b><p className="text-sm text-slate-600 mt-2">{s.content}</p></div>)}</div></DetailShell>;
}

function JudgmentsPage({ navigate, savedJudgments, toggleSave }) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState("All");
  const years = [
    "All",
    ...new Set(MOCK_JUDGMENTS.map((judgment) => String(judgment.year)))
  ];
  const filtered = MOCK_JUDGMENTS.filter(x => (year === "All" || String(x.year) === year) && `${x.caseName} ${x.shortSummary}`.toLowerCase().includes(q.toLowerCase()));
  return <ListPage title="Court Judgments" subtitle="Demo judgment catalogue ready to connect to a verified judgment dataset." search={q} setSearch={setQ} filter={year} setFilter={setYear} filters={years}><div className="space-y-4">{filtered.map(j => <div key={j.id} className="bg-white border rounded-2xl p-5"><div className="flex justify-between"><span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">{j.court}</span><button onClick={() => toggleSave(j.id)}>{savedJudgments.includes(j.id) ? <BookmarkCheck className="text-amber-500"/> : <Bookmark/>}</button></div><h2 className="font-bold text-lg mt-3">{j.caseName}</h2><p className="text-xs text-slate-500">{j.year} · {j.caseNumber}</p><p className="text-sm text-slate-600 mt-3">{j.shortSummary}</p><button onClick={() => navigate("/judgments/:id", j.id)} className="mt-4 text-sm font-bold text-amber-700">View Judgment <ArrowRight className="inline w-4"/></button></div>)}</div></ListPage>;
}

function JudgmentDetailPage({ id, navigate, savedJudgments, toggleSave }) {
  const j = MOCK_JUDGMENTS.find(x => x.id === id) || MOCK_JUDGMENTS[0];
  return <DetailShell title={j.caseName} meta={`${j.court} · ${j.year} · ${j.caseNumber}`} back={() => navigate("/judgments")}><div className="flex justify-between"><div className="text-sm text-slate-500">Judges: {j.judges.join(", ")}</div><button onClick={() => toggleSave(j.id)}>{savedJudgments.includes(j.id) ? <BookmarkCheck className="text-amber-500"/> : <Bookmark/>}</button></div><div className="grid lg:grid-cols-2 gap-5 mt-7"><div className="border rounded-2xl p-5"><h3 className="font-bold">Overview</h3><p className="text-sm text-slate-600 mt-2">{j.shortSummary}</p><h3 className="font-bold mt-5">Acts / Provisions</h3><ul className="text-sm text-slate-600 mt-2 list-disc pl-5">{j.actsInvolved.map(a => <li key={a}>{a}</li>)}</ul></div><div className="bg-slate-950 text-white rounded-2xl p-5"><h3 className="font-bold text-amber-400">AI Summary — Demo</h3><p className="text-sm text-slate-300 mt-2">{j.aiSummary}</p></div></div><div className="mt-6 border rounded-2xl p-5"><h3 className="font-bold">Entities</h3><div className="grid md:grid-cols-3 gap-3 mt-4">{Object.entries(j.entities).map(([k,v]) => <div key={k} className="bg-slate-50 p-3 rounded-xl"><b className="capitalize text-xs">{k}</b><div className="text-sm mt-2">{v.join(", ")}</div></div>)}</div></div><div className="mt-6 border rounded-2xl p-5"><h3 className="font-bold">Judgment Text — Demo</h3><p className="text-sm text-slate-600 mt-2">{j.fullText}</p></div></DetailShell>;
}

function DetailShell({ title, meta, back, children }) { return <div className="max-w-5xl mx-auto px-4 py-10"><button onClick={back} className="text-sm font-bold text-amber-700 mb-5">← Back</button><div className="bg-white border rounded-3xl p-6 sm:p-8"><h1 className="text-3xl font-black">{title}</h1><p className="text-sm text-slate-500 mt-2">{meta}</p>{children}</div></div>; }

function DocumentsPage() {
  const [docs, setDocs] = useState(MOCK_DOCUMENTS);
  const [loading, setLoading] = useState(false);
  const input = useRef(null);
  const upload = async (file) => {
    if (!file) {
      return;
    }

    setLoading(true);

    const result = await apiService.uploadAndAnalyzeDoc(file);

    setDocs((documents) => [result, ...documents]);
    setLoading(false);
  };
  return <div className="max-w-7xl mx-auto px-4 py-10"><SectionTitle title="Document Analysis" desc="Upload a legal document to preview the future NLP/document-processing workflow."/><div onClick={() => input.current?.click()} className="mt-8 border-2 border-dashed border-slate-300 bg-white rounded-3xl p-12 text-center cursor-pointer hover:border-amber-400"><input ref={input} type="file" hidden accept=".pdf,.doc,.docx,.txt" onChange={e => upload(e.target.files?.[0])}/><Upload className="mx-auto text-amber-500" size={36}/><h2 className="font-bold mt-4">Upload your legal document</h2><p className="text-sm text-slate-500 mt-1">PDF, DOCX or TXT</p>{loading && <p className="mt-4 text-sm font-bold text-amber-700">Processing document...</p>}</div><div className="grid lg:grid-cols-2 gap-5 mt-7">{docs.map(d => <div key={d.id} className="bg-white border rounded-2xl p-5"><div className="flex gap-3"><FileCheck className="text-emerald-500"/><div><b>{d.fileName}</b><p className="text-xs text-slate-500">{d.fileSize} · {d.uploadDate}</p></div></div><p className="text-sm text-slate-600 mt-4">{d.summary}</p><h3 className="font-bold mt-5">Extracted Clauses</h3><div className="space-y-2 mt-2">{d.clauses.map(c => <div key={c.title} className="bg-slate-50 p-3 rounded-xl text-sm"><b>{c.title}</b><p className="text-xs text-slate-500 mt-1">{c.snippet}</p></div>)}</div><h3 className="font-bold mt-5">Entities / NER</h3><div className="flex flex-wrap gap-2 mt-2">{d.entities.map((e,i)=><span key={i} className="text-xs bg-amber-50 px-2 py-1 rounded-lg">{e.label}: {e.value}</span>)}</div></div>)}</div></div>;
}

function AboutPage() {
  return (
    <InfoPage title="About Nyaya Path">
      <p>
        Nyaya Path is a frontend prototype for an AI-powered legal
        accessibility platform. The interface is intentionally modular so
        authentication, legal datasets, NLP, RAG, document processing and
        multilingual services can be connected later.
      </p>
    </InfoPage>
  );
}

function ProfilePage({ user }) {
  return (
    <InfoPage title="Profile">
      <p className="text-sm">
        Name: <b>{user?.name || "Demo User"}</b>
      </p>

      <p className="text-sm mt-2">
        Email: <b>{user?.email || "demo@nyayapath.app"}</b>
      </p>

      <p className="text-sm mt-2">
        Role: <b>{user?.role || "Citizen"}</b>
      </p>
    </InfoPage>
  );
}

function SettingsPage() {
  return (
    <InfoPage title="Settings">
      <div className="border rounded-xl p-4">
        Language preferences, notifications and privacy controls can be
        connected here later.
      </div>
    </InfoPage>
  );
}

function HelpPage() {
  return (
    <InfoPage title="Help & Disclaimer">
      <p>
        Nyaya Path is for education and information. AI responses in this
        prototype are simulated and must not be treated as professional legal
        advice.
      </p>
    </InfoPage>
  );
}

function InfoPage({ title, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="bg-white border rounded-3xl p-8">
        <h1 className="text-3xl font-black">{title}</h1>
        <div className="text-slate-600 mt-5 leading-7">
          {children}
        </div>
      </div>
    </div>
  );
}

function Footer({ navigate }) { return <footer className="bg-slate-950 text-slate-400 mt-12"><div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8"><div><b className="text-white text-lg">Nyaya <span className="text-amber-400">Path</span></b><p className="text-xs mt-3">AI-powered legal accessibility frontend prototype.</p></div><div><b className="text-white text-xs uppercase">Explore</b><div className="space-y-2 mt-3 text-xs"><button onClick={() => navigate("/ask")} className="block hover:text-amber-400">Ask AI</button><button onClick={() => navigate("/laws")} className="block hover:text-amber-400">Laws</button><button onClick={() => navigate("/judgments")} className="block hover:text-amber-400">Judgments</button></div></div><div><b className="text-white text-xs uppercase">Platform</b><div className="space-y-2 mt-3 text-xs"><button onClick={() => navigate("/documents")} className="block hover:text-amber-400">Document Analysis</button><button onClick={() => navigate("/about")} className="block hover:text-amber-400">About</button><button onClick={() => navigate("/help")} className="block hover:text-amber-400">Disclaimer</button></div></div><div><b className="text-white text-xs uppercase">Languages</b><p className="text-xs mt-3">English · Hindi · Kannada · Bengali · Tamil · Telugu · Marathi</p></div></div><div className="border-t border-slate-800 text-center text-xs py-5">© 2026 Nyaya Path · Frontend prototype ready for backend/NLP/RAG integration</div></footer>; }