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
        UPDATE sensor_readings
        SET dissolved_oxygen = %s
        WHERE id = %s
        """,
        (6.1, 1)
    )

conn.commit()
conn.close()

print("✅ Sensor reading updated successfully!")