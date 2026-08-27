from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from risk_engine import main as run_risk_engine
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app import get_connection

app = FastAPI(title="AquaSentinel API")
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WaterReadingCreate(BaseModel):
    sensor_id: int
    temperature: float
    ph: float
    dissolved_oxygen: float


@app.get("/dashboard")
def dashboard():
    return FileResponse("static/index.html")


@app.get("/")
def home():
    return {
        "message": "AquaSentinel API is running",
        "status": "connected"
    }


@app.get("/farms")
def get_farms():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, name, location
            FROM farms
            ORDER BY id;
        """)
        farms = cur.fetchall()

    conn.close()

    return [
        {
            "id": farm[0],
            "name": farm[1],
            "location": farm[2]
        }
        for farm in farms
    ]

@app.get("/water-readings")
def get_water_readings(pond_id: int | None = None):
    conn = get_connection()

    with conn.cursor() as cur:
        if pond_id is not None:
            cur.execute("""
                SELECT
                    wr.id,
                    wr.sensor_id,
                    wr.temperature,
                    wr.ph,
                    wr.dissolved_oxygen,
                    wr.recorded_at
                FROM water_readings wr
                JOIN sensors s
                    ON wr.sensor_id = s.id
                WHERE s.pond_id = %s
                ORDER BY wr.recorded_at DESC;
            """, (pond_id,))
        else:
            cur.execute("""
                SELECT
                    id,
                    sensor_id,
                    temperature,
                    ph,
                    dissolved_oxygen,
                    recorded_at
                FROM water_readings
                ORDER BY recorded_at DESC;
            """)

        readings = cur.fetchall()

    conn.close()

    return [
        {
            "id": row[0],
            "sensor_id": row[1],
            "temperature": float(row[2]),
            "ph": float(row[3]),
            "dissolved_oxygen": float(row[4]),
            "recorded_at": row[5],
        }
        for row in readings
    ]

@app.post("/water-readings")
def create_water_reading(reading: WaterReadingCreate):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO water_readings (
                    sensor_id,
                    temperature,
                    ph,
                    dissolved_oxygen
                )
                VALUES (%s, %s, %s, %s)
                RETURNING id, recorded_at;
                """,
                (
                    reading.sensor_id,
                    reading.temperature,
                    reading.ph,
                    reading.dissolved_oxygen,
                ),
            )

            result = cur.fetchone()
            conn.commit()

        return {
            "message": "Water reading saved successfully",
            "id": result[0],
            "recorded_at": result[1],
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        conn.close()

@app.get("/fish-observations")
def get_fish_observations():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                id,
                pond_id,
                activity_level,
                feeding_response,
                unusual_behaviour,
                fish_count,
                observed_at
            FROM fish_observations
            ORDER BY observed_at DESC;
        """)
        observations = cur.fetchall()

    conn.close()

    return [
        {
            "id": observation[0],
            "pond_id": observation[1],
            "activity_level": observation[2],
            "feeding_response": observation[3],
            "unusual_behaviour": observation[4],
            "fish_count": observation[5],
            "observed_at": observation[6]
        }
        for observation in observations
    ]

@app.get("/risk-assessments")
def get_risk_assessments():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                id,
                pond_id,
                risk_level,
                risk_score,
                contributing_factors,
                assessed_at
            FROM risk_assessments
            ORDER BY assessed_at DESC;
        """)
        assessments = cur.fetchall()

    conn.close()

    return [
        {
            "id": assessment[0],
            "pond_id": assessment[1],
            "risk_level": assessment[2],
            "risk_score": float(assessment[3]) if assessment[3] is not None else None,
            "contributing_factors": assessment[4],
            "assessed_at": assessment[5]
        }
        for assessment in assessments
    ]


@app.get("/alerts")
def get_alerts():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                id,
                pond_id,
                risk_assessment_id,
                alert_level,
                message,
                sent_at
            FROM alerts
            ORDER BY sent_at DESC;
        """)
        alerts = cur.fetchall()

    conn.close()

    return [
        {
            "id": alert[0],
            "pond_id": alert[1],
            "risk_assessment_id": alert[2],
            "alert_level": alert[3],
            "message": alert[4],
            "sent_at": alert[5]
        }
        for alert in alerts
    ]

@app.get("/history")
def get_history():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                w.recorded_at,
                w.temperature,
                w.ph,
                w.dissolved_oxygen
            FROM water_readings w
            ORDER BY w.recorded_at ASC;
        """)

        history = cur.fetchall()

    conn.close()

    return [
        {
            "recorded_at": row[0],
            "temperature": float(row[1]) if row[1] is not None else None,
            "ph": float(row[2]) if row[2] is not None else None,
            "dissolved_oxygen": float(row[3]) if row[3] is not None else None
        }
        for row in history
    ]

@app.get("/ponds")
def get_ponds():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                p.id,
                p.name,
                p.species,
                f.name AS farm_name
            FROM ponds p
            JOIN farms f ON p.farm_id = f.id
            ORDER BY p.id;
        """)

        ponds = cur.fetchall()

    conn.close()

    return [
        {
            "id": pond[0],
            "name": pond[1],
            "species": pond[2],
            "farm": pond[3]
        }
        for pond in ponds
    ]

@app.post("/run-risk-analysis")
def run_risk_analysis():
    run_risk_engine()

    return {
        "message": "Risk analysis completed successfully."
    }

@app.get("/db-test")
def db_test():
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("SELECT version();")
        result = cur.fetchone()

    conn.close()

    return {
        "database": result[0]
    }