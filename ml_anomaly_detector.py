import os
import psycopg
import numpy as np

from dotenv import load_dotenv
from sklearn.ensemble import IsolationForest

load_dotenv()


def get_connection():
    return psycopg.connect(os.getenv("DATABASE_URL"))


# ============================================================
# LOAD POND HISTORY
# ============================================================

def load_pond_history(pond_id):

    conn = get_connection()

    try:
        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    w.temperature,
                    w.ph,
                    w.dissolved_oxygen,
                    w.recorded_at
                FROM water_readings w
                JOIN sensors s
                    ON w.sensor_id = s.id
                WHERE s.pond_id = %s
                ORDER BY w.recorded_at ASC;
            """, (pond_id,))

            return cur.fetchall()

    finally:
        conn.close()


# ============================================================
# IDENTIFY HEALTHY READINGS
# ============================================================

def is_healthy_reading(row):

    temperature = float(row[0])
    ph = float(row[1])
    oxygen = float(row[2])

    return (
        24 <= temperature <= 30
        and 6.8 <= ph <= 8.0
        and 5.0 <= oxygen <= 8.0
    )


# ============================================================
# BUILD HEALTHY TRAINING DATA
# ============================================================

def build_healthy_training_data(rows):

    healthy_rows = [
        row
        for row in rows
        if is_healthy_reading(row)
    ]

    X = np.array([
        [
            float(row[0]),
            float(row[1]),
            float(row[2])
        ]
        for row in healthy_rows
    ])

    return healthy_rows, X


# ============================================================
# TRAIN MODEL
# ============================================================

def train_model(X):

    model = IsolationForest(
        n_estimators=300,
        contamination=0.05,
        random_state=42
    )

    model.fit(X)

    return model


# ============================================================
# DETECT ANOMALY
# ============================================================

def detect_anomaly(
    temperature,
    ph,
    dissolved_oxygen,
    model
):

    X = np.array([[
        float(temperature),
        float(ph),
        float(dissolved_oxygen)
    ]])

    prediction = model.predict(X)[0]

    score = model.decision_function(X)[0]

    return {
        "is_anomaly": bool(prediction == -1),
        "anomaly_score": round(float(score), 4)
    }


# ============================================================
# TEST SCENARIOS
# ============================================================

def test_scenario(
    name,
    temperature,
    ph,
    oxygen,
    model
):

    result = detect_anomaly(
        temperature,
        ph,
        oxygen,
        model
    )

    print()
    print("--------------------------------------")
    print(f"{name.upper()} TEST")
    print("--------------------------------------")

    print(
        f"Temperature: {temperature:.2f}°C"
    )

    print(
        f"pH: {ph:.2f}"
    )

    print(
        f"Dissolved oxygen: {oxygen:.2f} mg/L"
    )

    print(
        f"Anomaly detected: "
        f"{result['is_anomaly']}"
    )

    print(
        f"Anomaly score: "
        f"{result['anomaly_score']}"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("======================================")
    print("AquaSentinel ML Anomaly Detector")
    print("======================================")

    pond_id = 1

    rows = load_pond_history(pond_id)

    print(
        f"Total Pond {pond_id} readings: "
        f"{len(rows)}"
    )

    # --------------------------------------------------------
    # Build healthy baseline
    # --------------------------------------------------------

    healthy_rows, X = build_healthy_training_data(rows)

    print(
        f"Healthy training readings: "
        f"{len(healthy_rows)}"
    )

    if len(healthy_rows) < 20:

        print(
            "❌ Not enough healthy readings "
            "to train the model."
        )

        return

    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    print()
    print(
        "Training Isolation Forest "
        "on healthy baseline..."
    )

    model = train_model(X)

    print(
        "✅ Healthy baseline model trained."
    )

    # --------------------------------------------------------
    # Controlled tests
    # --------------------------------------------------------

    test_scenario(
        "Normal",
        28.0,
        7.4,
        7.5,
        model
    )

    test_scenario(
        "Moderate",
        31.0,
        6.3,
        4.3,
        model
    )

    test_scenario(
        "High Risk",
        35.49,
        5.31,
        2.74,
        model
    )

    print()
    print(
        "======================================"
    )

    print(
        "✅ ML baseline testing completed."
    )


if __name__ == "__main__":
    main()