import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(ENV_PATH, override=True)

key = os.getenv("ML_SERVICE_API_KEY", "")

print("ENV EXISTS:", ENV_PATH.exists())
print("API KEY LOADED:", bool(key))
print("API KEY LENGTH:", len(key))
print("EXTRA SPACES:", key != key.strip())
