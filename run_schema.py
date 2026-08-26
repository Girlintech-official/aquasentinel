import os
import psycopg

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise ValueError("DATABASE_URL is not set")

with open("schema.sql", "r") as file:
    schema = file.read()

with psycopg.connect(database_url) as conn:
    with conn.cursor() as cur:
        cur.execute(schema)

print("Schema created successfully!")