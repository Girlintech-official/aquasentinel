import os
import psycopg
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return psycopg.connect(
    os.environ["DATABASE_URL"]
)

def main():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM farms;")
        farm_count = cur.fetchone()[0]

    conn.close()

    print("AquaSentinel is connected.")
    print(f"Farms in database: {farm_count}")


if __name__ == "__main__":
    main()