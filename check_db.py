import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

conn = psycopg.connect(os.getenv("DATABASE_URL"))

with conn.cursor() as cur:

    cur.execute("""
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS ml_anomaly BOOLEAN DEFAULT FALSE;
    """)

    cur.execute("""
        ALTER TABLE risk_assessments
        ADD COLUMN IF NOT EXISTS ml_anomaly_score NUMERIC;
    """)

conn.commit()

print("✅ Database updated successfully.")

with conn.cursor() as cur:
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'risk_assessments'
        ORDER BY ordinal_position;
    """)

    columns = cur.fetchall()

print()
print("RISK_ASSESSMENTS COLUMNS:")
for column in columns:
    print("-", column[0])

conn.close()