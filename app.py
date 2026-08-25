import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

def main():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM farms;")
        farm_count = cur.fetchone()[0]

    conn.close()

    print(f"✅ AquaSentinel is connected.")
    print(f"🏭 Farms in database: {farm_count}")


if __name__ == "__main__":
    main()