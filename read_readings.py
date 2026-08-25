import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

conn = psycopg.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)

with conn.cursor() as cur:
    cur.execute("""
        SELECT id, temperature, ph, dissolved_oxygen, recorded_at
        FROM sensor_readings
    """)

    readings = cur.fetchall()

    for reading in readings:
        print(reading)

conn.close()