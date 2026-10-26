"""One-time migration of Nyaya Path MongoDB collections into PostgreSQL.

Run after starting the Spring backend once so Flyway creates the schema:
  pip install pymongo 'psycopg[binary]'
  set MONGODB_URI=...
  set POSTGRES_DSN=postgresql://user:password@host:5432/nyaya_path
  python migration/migrate_mongo_to_postgres.py
"""

import os
from datetime import datetime, timezone

import psycopg
from pymongo import MongoClient


def stamp(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def source_rows(db, name):
    return db[name].find({})


def migrate():
    mongo_uri = os.environ["MONGODB_URI"]
    postgres_dsn = os.environ["POSTGRES_DSN"]
    mongo_db_name = os.getenv("MONGODB_DATABASE", "nyaya_path")
    with MongoClient(mongo_uri) as mongo, psycopg.connect(postgres_dsn) as pg:
        db = mongo[mongo_db_name]
        with pg.cursor() as cur:
            for row in source_rows(db, "users"):
                cur.execute("""INSERT INTO users(id,name,email,password,role,created_at,updated_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(id) DO NOTHING""",
                    (str(row["_id"]), row.get("name", ""), row["email"], row["password"],
                     str(row.get("role", "Citizen")), stamp(row.get("createdAt")) or datetime.now(timezone.utc),
                     stamp(row.get("updatedAt")) or datetime.now(timezone.utc)))

            for row in source_rows(db, "advocate_profiles"):
                cur.execute("""INSERT INTO advocate_profiles(id,user_id,enrollment_number,state_bar_council,
                    primary_practice_area,primary_court,enrollment_status,experience_years,created_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(id) DO NOTHING""",
                    (str(row["_id"]), str(row["userId"]), row.get("enrollmentNumber", ""),
                     row.get("stateBarCouncil"), row.get("primaryPracticeArea"), row.get("primaryCourt"),
                     "PENDING", row.get("experienceYears", 0), stamp(row.get("createdAt"))))

            for row in source_rows(db, "chat_logs"):
                cur.execute("""INSERT INTO chat_logs(id,user_id,user_role,query,answer,sources,created_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(id) DO NOTHING""",
                    (str(row["_id"]), str(row["userId"]), row.get("userRole"), row.get("query"), row.get("answer"),
                     psycopg.types.json.Jsonb(row.get("sources") or []), stamp(row.get("createdAt"))))

            for row in source_rows(db, "saved_items"):
                cur.execute("""INSERT INTO saved_items(id,user_id,item_type,item_id,title,subtitle,category,saved_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(user_id,item_id) DO NOTHING""",
                    (str(row["_id"]), str(row["userId"]), row.get("itemType"), row["itemId"], row.get("title"),
                     row.get("subtitle"), row.get("category"), stamp(row.get("savedAt"))))

            for row in source_rows(db, "uploaded_documents"):
                cur.execute("""INSERT INTO uploaded_documents(id,owner_id,file_name,case_name,court,year,citation,
                    chunks_indexed,indexing_status,uploaded_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT(id) DO NOTHING""",
                    (str(row["_id"]), str(row["ownerId"]), row.get("fileName"), row.get("caseName"), row.get("court"),
                     row.get("year"), row.get("citation"), row.get("chunksIndexed", 0), "UNKNOWN",
                     stamp(row.get("uploadedAt"))))
        pg.commit()
    print("MongoDB records copied. Verify row counts and representative records before retiring MongoDB.")


if __name__ == "__main__":
    migrate()
