import os
import psycopg
import numpy as np

from dotenv import load_dotenv
from sklearn.ensemble import IsolationForest
from ml_anomaly_detector import (
    train_model,
    detect_anomaly
)
load_dotenv()


# ============================================================
# DATABASE
# ============================================================

def get_connection():
    return psycopg.connect(os.getenv("DATABASE_URL"))


# ============================================================
# RULE-BASED RISK ASSESSMENT
# ============================================================

def assess_risk(
    temperature,
    ph,
    dissolved_oxygen,
    activity_level
):
    score = 0
    factors = []

    # -------------------------
    # Temperature
    # -------------------------

    if temperature < 20 or temperature > 34:
        score += 30
        factors.append(
            "Severely abnormal water temperature"
        )

    elif temperature < 22 or temperature > 32:
        score += 20
        factors.append(
            "Moderately abnormal water temperature"
        )

    elif temperature < 24 or temperature > 30:
        score += 10
        factors.append(
            "Slightly abnormal water temperature"
        )

    # -------------------------
    # pH
    # -------------------------

    if ph < 5.5 or ph > 9.5:
        score += 30
        factors.append(
            "Severely abnormal pH"
        )

    elif ph < 6.0 or ph > 9.0:
        score += 20
        factors.append(
            "Moderately abnormal pH"
        )

    elif ph < 6.5 or ph > 8.5:
        score += 10
        factors.append(
            "Slightly abnormal pH"
        )

    # -------------------------
    # Dissolved Oxygen
    # -------------------------

    if dissolved_oxygen < 3:
        score += 35
        factors.append(
            "Critically low dissolved oxygen"
        )

    elif dissolved_oxygen < 4:
        score += 25
        factors.append(
            "Low dissolved oxygen"
        )

    elif dissolved_oxygen < 5:
        score += 15
        factors.append(
            "Reduced dissolved oxygen"
        )

    # -------------------------
    # Fish Behaviour
    # -------------------------

    activity = (
        activity_level.lower().strip()
        if activity_level
        else "unknown"
    )

    if activity in ["very low", "unusual"]:
        score += 25
        factors.append(
            "Severely reduced or unusual fish activity"
        )

    elif activity == "low":
        score += 15
        factors.append(
            "Reduced fish activity"
        )

    return score, factors


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def calculate_features(readings):

    if not readings:
        return None

    latest = readings[0]

    temperature = float(latest[0])
    ph = float(latest[1])
    oxygen = float(latest[2])

    features = {
        "temperature": temperature,
        "ph": ph,
        "dissolved_oxygen": oxygen,
    }

    temperatures = [
        float(row[0])
        for row in readings
    ]

    ph_values = [
        float(row[1])
        for row in readings
    ]

    oxygen_values = [
        float(row[2])
        for row in readings
    ]

    features["temperature_average"] = (
        sum(temperatures) / len(temperatures)
    )

    features["ph_average"] = (
        sum(ph_values) / len(ph_values)
    )

    features["oxygen_average"] = (
        sum(oxygen_values) / len(oxygen_values)
    )

    # -------------------------
    # Changes
    # -------------------------

    if len(readings) >= 2:

        previous = readings[1]

        features["temperature_change"] = (
            temperature - float(previous[0])
        )

        features["ph_change"] = (
            ph - float(previous[1])
        )

        features["oxygen_change"] = (
            oxygen - float(previous[2])
        )

    else:

        features["temperature_change"] = 0
        features["ph_change"] = 0
        features["oxygen_change"] = 0

    # -------------------------
    # Trend direction
    # -------------------------

    if features["oxygen_change"] < -0.2:
        features["oxygen_trend"] = "falling"

    elif features["oxygen_change"] > 0.2:
        features["oxygen_trend"] = "rising"

    else:
        features["oxygen_trend"] = "stable"

    if features["temperature_change"] > 0.5:
        features["temperature_trend"] = "rising"

    elif features["temperature_change"] < -0.5:
        features["temperature_trend"] = "falling"

    else:
        features["temperature_trend"] = "stable"

    return features


# ============================================================
# TREND INTELLIGENCE
# ============================================================

def assess_trends(features):

    score = 0
    factors = []

    # Oxygen falling
    if features["oxygen_trend"] == "falling":

        score += 10

        factors.append(
            "Dissolved oxygen is declining"
        )

    # Oxygen below recent average
    if (
        features["dissolved_oxygen"]
        < features["oxygen_average"] - 0.5
    ):

        score += 10

        factors.append(
            "Dissolved oxygen is below its recent average"
        )

    # Temperature increasing
    if features["temperature_trend"] == "rising":

        score += 5

        factors.append(
            "Water temperature is increasing"
        )

    return score, factors


# ============================================================
# ML HEALTHY BASELINE
# ============================================================

def load_healthy_training_data(pond_id):

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    w.temperature,
                    w.ph,
                    w.dissolved_oxygen
                FROM water_readings w
                JOIN sensors s
                    ON w.sensor_id = s.id
                WHERE s.pond_id = %s
                  AND w.temperature BETWEEN 24 AND 30
                  AND w.ph BETWEEN 6.8 AND 8.0
                  AND w.dissolved_oxygen BETWEEN 5.0 AND 8.0
                ORDER BY w.recorded_at ASC;
            """, (pond_id,))

            return cur.fetchall()

    finally:
        conn.close()


def train_ml_model(pond_id):

    rows = load_healthy_training_data(pond_id)

    if len(rows) < 20:

        return None, len(rows)

    X = np.array([
        [
            float(row[0]),
            float(row[1]),
            float(row[2])
        ]
        for row in rows
    ])

    model = IsolationForest(
        n_estimators=300,
        contamination=0.05,
        random_state=42
    )

    model.fit(X)

    return model, len(rows)


# ============================================================
# ML ANOMALY DETECTION
# ============================================================

def detect_ml_anomaly(
    temperature,
    ph,
    dissolved_oxygen,
    model
):

    if model is None:

        return False, None

    X = np.array([[
        float(temperature),
        float(ph),
        float(dissolved_oxygen)
    ]])

    prediction = model.predict(X)[0]

    score = model.decision_function(X)[0]

    return (
        prediction == -1,
        round(float(score), 4)
    )


# ============================================================
# MAIN INTELLIGENCE ENGINE
# ============================================================

def main():

    conn = get_connection()

    try:

        with conn.cursor() as cur:

            # ------------------------------------------------
            # Find monitored ponds
            # ------------------------------------------------

            cur.execute("""
                SELECT DISTINCT
                    s.pond_id
                FROM sensors s
                JOIN water_readings w
                    ON w.sensor_id = s.id
                ORDER BY s.pond_id;
            """)

            ponds = cur.fetchall()

            if not ponds:

                print(
                    "No pond monitoring data found."
                )

                return

            # =================================================
            # Analyse each pond
            # =================================================

            for pond_row in ponds:

                pond_id = pond_row[0]

                # ---------------------------------------------
                # Recent readings
                # ---------------------------------------------

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
                    ORDER BY w.recorded_at DESC
                    LIMIT 20;
                """, (pond_id,))

                readings = cur.fetchall()

                if not readings:

                    continue

                # ---------------------------------------------
                # Feature engineering
                # ---------------------------------------------

                features = calculate_features(
                    readings
                )

                # ---------------------------------------------
                # ML anomaly detection
                # ---------------------------------------------

                X = np.array([
                    [
                        float(row[0]),
                        float(row[1]),
                        float(row[2])
                    ]
                    for row in readings
                ], dtype=float)

                ml_model = train_model(X)

                ml_result = detect_anomaly(
                    features["temperature"],
                    features["ph"],
                    features["dissolved_oxygen"],
                    ml_model
                )

                ml_anomaly = bool(ml_result["is_anomaly"])
                ml_anomaly_score = ml_result["anomaly_score"]
                
                print("DEBUG ML VALUES:")
                print("ml_anomaly =", ml_anomaly)
                print("ml_anomaly_score =", ml_anomaly_score)

                # ---------------------------------------------
                # Fish behaviour
                # ---------------------------------------------

                cur.execute("""
                    SELECT
                        activity_level
                    FROM fish_observations
                    WHERE pond_id = %s
                    ORDER BY observed_at DESC
                    LIMIT 1;
                """, (pond_id,))

                fish = cur.fetchone()

                activity_level = (
                    fish[0]
                    if fish
                    else "unknown"
                )

                # ---------------------------------------------
                # Rule-based risk
                # ---------------------------------------------

                rule_score, factors = assess_risk(
                    features["temperature"],
                    features["ph"],
                    features["dissolved_oxygen"],
                    activity_level
                )

                # ---------------------------------------------
                # Trend intelligence
                # ---------------------------------------------

                trend_score, trend_factors = (
                    assess_trends(features)
                )

                score = (
                    rule_score +
                    trend_score
                )

                factors.extend(
                    trend_factors
                )

                # ---------------------------------------------
                # ML intelligence
                # ---------------------------------------------

                ml_model, training_count = (
                    train_ml_model(pond_id)
                )

                ml_anomaly, ml_score = (
                    detect_ml_anomaly(
                        features["temperature"],
                        features["ph"],
                        features["dissolved_oxygen"],
                        ml_model
                    )
                )

                if ml_anomaly:

                    score += 10

                    factors.append(
                        "ML detected an unusual "
                        "water-quality pattern"
                    )

                # ---------------------------------------------
                # Cap score
                # ---------------------------------------------

                score = min(score, 100)

                # ---------------------------------------------
                # Final classification
                # ---------------------------------------------

                if score >= 50:

                    risk_level = "High"

                elif score >= 10:

                    risk_level = "Moderate"

                else:

                    risk_level = "Low"

                # ---------------------------------------------
                # Factors
                # ---------------------------------------------

                if factors:

                    contributing_factors = (
                        ", ".join(factors)
                    )

                else:

                    contributing_factors = (
                        "Water parameters and fish "
                        "behaviour appear normal"
                    )

                print()
                print("DEBUG BEFORE INSERT")
                print(f"ml_anomaly = {ml_anomaly!r}")
                print(f"ml_anomaly_score = {ml_score!r}")
                print(f"score = {score!r}")
                print(f"risk_level = {risk_level!r}")

                # ---------------------------------------------
                # Store assessment
                # ---------------------------------------------
                cur.execute("""
                    INSERT INTO risk_assessments
                    (
                        pond_id,
                        risk_level,
                        risk_score,
                        contributing_factors,
                        ml_anomaly,
                        ml_anomaly_score
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id;
                """, (
                    pond_id,
                    risk_level,
                    score,
                    contributing_factors,
                    ml_anomaly,
                    ml_score
                ))

                assessment_id = cur.fetchone()[0]

                # ---------------------------------------------
                # High-risk alert
                # ---------------------------------------------

                if risk_level == "High":

                    alert_message = (
                        f"High stress risk detected "
                        f"in pond {pond_id}. "
                        f"Factors: "
                        f"{contributing_factors}"
                    )

                    cur.execute("""
                        INSERT INTO alerts
                        (
                            pond_id,
                            risk_assessment_id,
                            alert_level,
                            message
                        )
                        VALUES (%s, %s, %s, %s);
                    """, (
                        pond_id,
                        assessment_id,
                        "High",
                        alert_message
                    ))

                # ---------------------------------------------
                # Console output
                # ---------------------------------------------

                print()
                print(
                    f"========== POND {pond_id} =========="
                )

                print(
                    f"Temperature: "
                    f"{features['temperature']:.2f}°C"
                )

                print(
                    f"pH: "
                    f"{features['ph']:.2f}"
                )

                print(
                    f"Oxygen: "
                    f"{features['dissolved_oxygen']:.2f} mg/L"
                )

                print(
                    f"ML anomaly: {ml_anomaly}"
                )

                print(
                    f"Oxygen trend: "
                    f"{features['oxygen_trend']}"
                )

                print(
                    f"Temperature trend: "
                    f"{features['temperature_trend']}"
                )

                print(
                    f"ML anomaly score: "
                    f"{ml_score}"
                )

                print(
                    f"ML training readings: "
                    f"{training_count}"
                )

                print(
                    f"Risk: {risk_level}"
                )

                print(
                    f"Score: {score}"
                )

                print(
                    f"Factors: "
                    f"{contributing_factors}"
                )

            conn.commit()

            print()
            print(
                "✅ AquaSentinel intelligence "
                "analysis completed."
            )

    except Exception:

        conn.rollback()

        raise

    finally:

        conn.close()


if __name__ == "__main__":
    main()