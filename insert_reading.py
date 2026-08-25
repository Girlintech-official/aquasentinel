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
    cur.execute(
        """
        INSERT INTO sensor_readings
        (temperature, ph, dissolved_oxygen)
        VALUES (%s, %s, %s)
        """,
        (27.4, 7.2, 5.8)
    )

conn.commit()
conn.close()

print("✅ Sensor reading successfully saved!")