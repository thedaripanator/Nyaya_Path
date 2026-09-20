export const MOCK_LAWS = [
  {
    id: "law-1",
    title: "Consumer Protection Act, 2019",
    number: "Act No. 35 of 2019",
    category: "Consumer Law",
    year: 2019,
    description: "Provides a framework for protection of consumer interests and settlement of consumer disputes.",
    sectionsCount: 107,
    keySections: [
      { number: "Section 2(7)", title: "Definition of Consumer", content: "Defines who is treated as a consumer under the Act." },
      { number: "Section 35", title: "Consumer Complaint", content: "Provides the manner in which a consumer complaint may be filed." },
      { number: "Section 82", title: "Product Liability", content: "Provides a framework for product liability actions." }
    ],
    simpleExplanation: "A law intended to help consumers address issues involving goods, services and unfair trade practices."
  },
  {
    id: "law-2",
    title: "Bharatiya Nagarik Suraksha Sanhita, 2023",
    number: "Act No. 46 of 2023",
    category: "Criminal Law",
    year: 2023,
    description: "Provides the procedural framework for criminal investigation, arrest, bail and trial in India.",
    sectionsCount: 531,
    keySections: [
      { number: "Section 35", title: "Arrest without warrant", content: "Contains provisions concerning circumstances in which arrest may be made without a warrant." },
      { number: "Section 173", title: "Information in cognizable cases", content: "Contains provisions concerning information relating to cognizable offences." },
      { number: "Section 478", title: "Bail", content: "Contains provisions concerning bail in specified circumstances." }
    ],
    simpleExplanation: "A procedural criminal law framework covering investigation, arrest, bail and trial."
  },
  {
    id: "law-3",
    title: "Industrial Disputes Act, 1947",
    number: "Act No. 14 of 1947",
    category: "Labour Law",
    year: 1947,
    description: "Provides for investigation and settlement of industrial disputes and related worker protections.",
    sectionsCount: 40,
    keySections: [
      { number: "Section 25F", title: "Retrenchment conditions", content: "Contains conditions relating to retrenchment of workmen." },
      { number: "Section 33C", title: "Recovery of money", content: "Provides a mechanism concerning money due to a workman from an employer." }
    ],
    simpleExplanation: "A framework concerning industrial disputes, worker rights and certain employment-related remedies."
  },
  {
    id: "law-4",
    title: "Real Estate (Regulation and Development) Act, 2016",
    number: "Act No. 16 of 2016",
    category: "Property Law",
    year: 2016,
    description: "Establishes a regulatory framework for the real estate sector and promotes transparency in real estate projects.",
    sectionsCount: 92,
    keySections: [
      { number: "Section 18", title: "Return of amount and compensation", content: "Contains provisions concerning refund and compensation where possession obligations are not met." }
    ],
    simpleExplanation: "A regulatory framework intended to improve transparency and protect interests in real estate transactions."
  },
  {
    id: "law-5",
    title: "Information Technology Act, 2000",
    number: "Act No. 21 of 2000",
    category: "Cyber Law",
    year: 2000,
    description: "Provides legal recognition for electronic transactions and addresses specified computer-related offences.",
    sectionsCount: 94,
    keySections: [
      { number: "Section 66D", title: "Cheating by personation using computer resource", content: "Contains provisions concerning cheating by personation using a computer resource." }
    ],
    simpleExplanation: "A key Indian statute covering electronic transactions and specified cyber offences."
  }
];

export const MOCK_JUDGMENTS = [
  {
    id: "judg-1",
    caseName: "Shreya Singhal v. Union of India",
    court: "Supreme Court of India",
    year: 2015,
    caseNumber: "Writ Petition (Criminal) No. 167 of 2012",
    judges: ["Justice J. Chelameswar", "Justice Rohinton Fali Nariman"],
    actsInvolved: ["Information Technology Act, 2000 - Section 66A"],
    shortSummary: "A landmark decision concerning online free speech and Section 66A of the IT Act.",
    fullText: "The Supreme Court considered the constitutional validity of Section 66A of the Information Technology Act, 2000.",
    aiSummary: "The judgment is commonly studied in the context of freedom of speech and online expression.",
    entities: {
      persons: ["Shreya Singhal", "J. Chelameswar", "R.F. Nariman"],
      acts: ["IT Act Section 66A", "Constitution Article 19(1)(a)"],
      orgs: ["Union of India", "Supreme Court of India"]
    }
  },
  {
    id: "judg-2",
    caseName: "K.S. Puttaswamy v. Union of India",
    court: "Supreme Court of India",
    year: 2017,
    caseNumber: "Writ Petition (Civil) No. 494 of 2012",
    judges: ["9-Judge Constitutional Bench"],
    actsInvolved: ["Constitution of India - Article 21"],
    shortSummary: "A constitutional decision concerning the right to privacy.",
    fullText: "A nine-judge bench considered privacy as part of the constitutional framework concerning life and personal liberty.",
    aiSummary: "The judgment is a major reference point for studying privacy as a constitutional right.",
    entities: {
      persons: ["K.S. Puttaswamy"],
      acts: ["Constitution Article 21"],
      orgs: ["Union of India", "UIDAI"]
    }
  },
  {
    id: "judg-3",
    caseName: "M.C. Mehta v. Union of India (Oleum Gas Leak Case)",
    court: "Supreme Court of India",
    year: 1987,
    caseNumber: "1987 SCR (1) 819",
    judges: ["Justice P.N. Bhagwati"],
    actsInvolved: ["Factories Act", "Environmental law"],
    shortSummary: "A landmark environmental-law decision concerning hazardous industries.",
    fullText: "The Court considered liability arising from hazardous and inherently dangerous activities.",
    aiSummary: "The judgment is widely studied in relation to liability for hazardous industrial activities.",
    entities: {
      persons: ["M.C. Mehta", "P.N. Bhagwati"],
      acts: ["Factories Act"],
      orgs: ["Supreme Court of India"]
    }
  }
];

export const MOCK_DOCUMENTS = [
  {
    id: "doc-101",
    fileName: "Residential_Rental_Agreement_Draft.pdf",
    uploadDate: "2026-02-10",
    fileSize: "1.4 MB",
    summary: "Sample residential lease agreement for a Bengaluru property.",
    clauses: [
      { title: "Lock-in Period", snippet: "Sample clause concerning a lock-in period." },
      { title: "Maintenance Charges", snippet: "Sample clause concerning maintenance obligations." },
      { title: "Deductions on Exit", snippet: "Sample clause concerning deductions at exit." }
    ],
    entities: [
      { type: "person", label: "Landlord", value: "Ramesh Kumar" },
      { type: "person", label: "Tenant", value: "Ananya Sharma" },
      { type: "location", label: "Property", value: "Indiranagar, Bengaluru" },
      { type: "date", label: "Execution Date", value: "1 March 2026" }
    ]
  }
];