from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import Header
import secrets

import os

from risk_engine import main as run_risk_engine
from app import get_connection


# =========================
# Authentication settings
# =========================

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


# =========================
# FastAPI application
# =========================

app = FastAPI(title="AquaSentinel API")


app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "https://aquasentinel-5wue.vercel.app",
    "http://localhost:3000"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Pydantic models
# =========================

class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str


class FarmCreate(BaseModel):
    name: str
    location: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class WaterReadingCreate(BaseModel):
    sensor_id: int
    temperature: float
    ph: float
    dissolved_oxygen: float


# =========================
# Authentication helpers
# =========================

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def verify_sensor_key(
    authorization: str = Header(...)
):

    if not authorization.startswith("Sensor "):
        raise HTTPException(
            status_code=401,
            detail="Invalid sensor authentication"
        )

    key = authorization.replace(
        "Sensor ",
        ""
    )


    if key != os.getenv("SENSOR_API_KEY"):
        raise HTTPException(
            status_code=401,
            detail="Invalid sensor key"
        )

    return True

def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    print("TOKEN RECEIVED:", token[:50])
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        email = payload.get("sub")

        if email is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, full_name, email
                FROM users
                WHERE email = %s;
                """,
                (email,),
            )

            user = cur.fetchone()

        if user is None:
            raise credentials_exception

        return {
            "id": user[0],
            "full_name": user[1],
            "email": user[2],
        }

    finally:
        conn.close()


# =========================
# Authentication routes
# =========================

@app.post("/register")
def register_user(user: UserRegister):
    conn = get_connection()

    try:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT id
                FROM users
                WHERE email = %s;
                """,
                (user.email,),
            )

            existing_user = cur.fetchone()

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered",
                )

            password_hash = pwd_context.hash(
                user.password
            )

            cur.execute(
                """
                INSERT INTO users (
                    full_name,
                    email,
                    password_hash
                )
                VALUES (%s, %s, %s)
                RETURNING id, full_name, email, created_at;
                """,
                (
                    user.full_name,
                    user.email,
                    password_hash,
                ),
            )

            new_user = cur.fetchone()

            conn.commit()

        return {
            "message": "User registered successfully",
            "user": {
                "id": new_user[0],
                "full_name": new_user[1],
                "email": new_user[2],
                "created_at": new_user[3],
            },
        }

    except HTTPException:
        raise

    except Exception as e:
        conn.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        conn.close()


@app.post("/login", response_model=Token)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, full_name, email, password_hash
                FROM users
                WHERE email = %s;
                """,
                (form_data.username,),
            )

            user = cur.fetchone()

        if user is None or not pwd_context.verify(
            form_data.password,
            user[3],
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(
            data={
                "sub": user[2],
            }
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    finally:
        conn.close()


@app.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user),
):
    return current_user


# =========================
# Farms
# =========================

@app.post("/farms")
def create_farm(
    farm: FarmCreate,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO farms (name, location, user_id)
                VALUES (%s, %s, %s)
                RETURNING id, name, location, user_id
                """,
                (
                    farm.name,
                    farm.location,
                    current_user["id"]
                )
            )

            new_farm = cur.fetchone()
            conn.commit()

            return {
                "message": "Farm created successfully",
                "farm": {
                    "id": new_farm[0],
                    "name": new_farm[1],
                    "location": new_farm[2],
                    "user_id": new_farm[3]
                }
            }

    finally:
        conn.close()


@app.get("/farms")
def get_my_farms(
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, location, user_id
                FROM farms
                WHERE user_id = %s
                ORDER BY id DESC
                """,
                (current_user["id"],)
            )

            farms = cur.fetchall()

            return [
                {
                    "id": farm[0],
                    "name": farm[1],
                    "location": farm[2],
                    "user_id": farm[3]
                }
                for farm in farms
            ]

    finally:
        conn.close()


# =========================
# Dashboard
# =========================

@app.get("/dashboard")
def dashboard():
    return FileResponse("static/index.html")


# =========================
# Home
# =========================

@app.get("/")
def home():
    return {
        "message": "AquaSentinel API is running",
        "status": "connected"
    }


# =========================
# Water readings
# =========================

@app.get("/water-readings")
def get_water_readings(
    pond_id: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    with conn.cursor() as cur:

        if pond_id is not None:
            cur.execute(
                """
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
                """,
                (pond_id,),
            )

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
def create_water_reading(
    reading: WaterReadingCreate,
    current_user: dict = Depends(get_current_user)
):
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

        # Run AquaSentinel risk analysis automatically
        run_risk_engine()

        return {
            "message": (
                "Water reading saved and "
                "risk analysis completed"
            ),
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

@app.post("/sensor-readings")
def create_sensor_reading(
    reading: WaterReadingCreate,
    sensor: bool = Depends(verify_sensor_key)
):

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
                VALUES (%s,%s,%s,%s)
                RETURNING id, recorded_at;
                """,
                (
                    reading.sensor_id,
                    reading.temperature,
                    reading.ph,
                    reading.dissolved_oxygen
                )
            )

            result = cur.fetchone()

            conn.commit()


        run_risk_engine()


        return {
            "message": "Sensor reading accepted",
            "id": result[0],
            "recorded_at": result[1]
        }


    finally:
        conn.close()

# =========================
# Fish observations
# =========================

@app.get("/fish-observations")
def get_fish_observations(
    current_user: dict = Depends(get_current_user)
):
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


# =========================
# Risk assessments
# =========================

@app.get("/risk-assessments")
def get_risk_assessments(
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                id,
                pond_id,
                risk_level,
                risk_score,
                contributing_factors,
                ml_anomaly,
                ml_anomaly_score,
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
            "risk_score": (
                float(assessment[3])
                if assessment[3] is not None
                else None
            ),
            "contributing_factors": assessment[4],
            "ml_anomaly": assessment[5],
            "ml_anomaly_score": (
                float(assessment[6])
                if assessment[6] is not None
                else None
            ),
            "assessed_at": assessment[7]
        }
        for assessment in assessments
    ]

# =========================
# Alerts
# =========================

@app.get("/alerts")
def get_alerts(
    current_user: dict = Depends(get_current_user)
):
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


# =========================
# History
# =========================

@app.get("/history")
def get_history(
    current_user: dict = Depends(get_current_user)
):
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
            "temperature": (
                float(row[1])
                if row[1] is not None
                else None
            ),
            "ph": (
                float(row[2])
                if row[2] is not None
                else None
            ),
            "dissolved_oxygen": (
                float(row[3])
                if row[3] is not None
                else None
            )
        }
        for row in history
    ]


# =========================
# Ponds
# =========================

@app.get("/ponds")
def get_ponds(
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                p.id,
                p.name,
                p.species,
                f.name AS farm_name
            FROM ponds p
            JOIN farms f
                ON p.farm_id = f.id
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


# =========================
# Run risk analysis manually
# =========================

@app.post("/run-risk-analysis")
def run_risk_analysis():
    run_risk_engine()

    return {
        "message": (
            "Risk analysis completed successfully."
        )
    }


# =========================
# Database test
# =========================

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