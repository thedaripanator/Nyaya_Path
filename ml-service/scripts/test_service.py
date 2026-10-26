import sys
import io
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app
import pymupdf  # fitz

client = TestClient(app)

print("=" * 60)
print("RUNNING NYAYA-PATH ML-SERVICE INTEGRATION TESTS")
print("=" * 60)

# 1. Test GET /
print("\n[1] Testing GET / ...")
res = client.get("/")
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
assert res.json().get("status") == "running", f"Unexpected response: {res.json()}"
print(f"PASS: {res.json()}")

# 2. Test GET /health
print("\n[2] Testing GET /health ...")
res = client.get("/health")
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
assert res.json().get("status") == "healthy", f"Unexpected response: {res.json()}"
print(f"PASS: {res.json()}")

# 3. Create a synthetic sample PDF for document upload test
print("\n[3] Generating sample legal judgment PDF for upload test...")
pdf_doc = pymupdf.open()
page = pdf_doc.new_page()
sample_legal_text = (
    "IN THE SUPREME COURT OF INDIA\n"
    "CRIMINAL APPELLATE JURISDICTION\n\n"
    "State of Maharashtra v. Milind and Others\n"
    "Citation: (2000) 1 SCC 123 : 2000 INSC 580\n"
    "Bench: B.N. Kirpal, K.G. Balakrishnan, JJ.\n"
    "Date: November 28, 2000\n\n"
    "JUDGMENT:\n"
    "The primary issue before this Court relates to the interpretation of Scheduled Tribes Order.\n"
    "The Constitution Bench held that it is not permissible to add or subtract anything in the\n"
    "Presidential Order. Circulars issued by State Governments cannot modify or expand the list of\n"
    "Scheduled Castes and Scheduled Tribes specified by the President under Articles 341 and 342.\n"
    "Consequently, the entries in the Presidential Order must be read strictly as they stand."
)
page.insert_text((50, 72), sample_legal_text, fontsize=11)
pdf_bytes = pdf_doc.write()
pdf_doc.close()

# 4. Test POST /api/documents/upload
print("\n[4] Testing POST /api/documents/upload ...")
files = {"file": ("State_v_Milind_2000.pdf", pdf_bytes, "application/pdf")}
data = {
    "case_name": "State of Maharashtra v. Milind",
    "court": "Supreme Court of India",
    "year": "2000",
    "citation": "(2000) 1 SCC 123",
    "owner_id": "lawyer_test_01",
}
res = client.post("/api/documents/upload", files=files, data=data)
assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
upload_data = res.json()
assert upload_data["success"] is True
assert upload_data["data"]["chunks_indexed"] >= 1
print(f"PASS: Uploaded and indexed {upload_data['data']['chunks_indexed']} chunk(s) for '{upload_data['data']['case_name']}'")

# 5. Test POST /api/lawyer/search-cases
print("\n[5] Testing POST /api/lawyer/search-cases ...")
search_payload = {
    "query": "Presidential order interpretation Scheduled Tribes Articles 341 and 342",
    "k": 5,
}
res = client.post("/api/lawyer/search-cases", json=search_payload)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
search_data = res.json()
assert search_data["success"] is True
assert len(search_data["data"]["cases"]) >= 1
top_case = search_data["data"]["cases"][0]
print(f"PASS: Retrieved {len(search_data['data']['cases'])} matching case(s).")
print(f"Top Result: {top_case['case_name']} ({top_case['year']}) - Score: {top_case['similarity_score']}")

# 6. Test POST /api/lawyer/ask
print("\n[6] Testing POST /api/lawyer/ask ...")
lawyer_payload = {
    "question": "Can State Government circulars modify the Presidential Order for Scheduled Tribes under Article 342?",
    "k": 3,
}
res = client.post("/api/lawyer/ask", json=lawyer_payload)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
lawyer_data = res.json()
assert lawyer_data["success"] is True
assert "answer" in lawyer_data["data"]
assert len(lawyer_data["data"]["sources"]) >= 1
print("PASS: Lawyer assistant responded successfully.")
print(f"Sources identified: {lawyer_data['data']['sources']}")
print(f"Answer Preview:\n{lawyer_data['data']['answer'][:300]}...\n")

# 7. Test POST /api/citizen/ask
print("\n[7] Testing POST /api/citizen/ask ...")
citizen_payload = {
    "question": "What is anticipatory bail in simple words?",
    "k": 3,
}
res = client.post("/api/citizen/ask", json=citizen_payload)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
citizen_data = res.json()
assert citizen_data["success"] is True
assert "answer" in citizen_data["data"]
print("PASS: Citizen assistant responded successfully.")
print(f"Answer Preview:\n{citizen_data['data']['answer'][:300]}...\n")

print("=" * 60)
print("ALL TESTS COMPLETED SUCCESSFULLY!")
print("=" * 60)
