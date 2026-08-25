import psycopg

conn = psycopg.connect(
    host="localhost",
    port=5432,
    dbname="aquasentinel_db",
    user="postgres",
    password="Techdiva@23!"
)

print("✅ Successfully connected to PostgreSQL!")

conn.close()
