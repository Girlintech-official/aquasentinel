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


def assess_risk(temperature, ph, dissolved_oxygen, activity_level):
    score = 0
    factors = []

    # Temperature assessment
    if temperature < 20 or temperature > 34:
        score += 30
        factors.append("Severely abnormal water temperature")

    elif temperature < 22 or temperature > 32:
        score += 20
        factors.append("Moderately abnormal water temperature")

    elif temperature < 24 or temperature > 30:
        score += 10
        factors.append("Slightly abnormal water temperature")

    # pH assessment
    if ph < 5.5 or ph > 9.5:
        score += 30
        factors.append("Severely abnormal pH")

    elif ph < 6.0 or ph > 9.0:
        score += 20
        factors.append("Moderately abnormal pH")

    elif ph < 6.5 or ph > 8.5:
        score += 10
        factors.append("Slightly abnormal pH")

    # Dissolved oxygen assessment
    if dissolved_oxygen < 3:
        score += 35
        factors.append("Critically low dissolved oxygen")

    elif dissolved_oxygen < 4:
        score += 25
        factors.append("Low dissolved oxygen")

    elif dissolved_oxygen < 5:
        score += 15
        factors.append("Reduced dissolved oxygen")

    # Fish behaviour assessment
    activity = activity_level.lower().strip()

    if activity in ["very low", "unusual"]:
        score += 25
        factors.append("Severely reduced or unusual fish activity")

    elif activity == "low":
        score += 15
        factors.append("Reduced fish activity")

    # Final risk classification
    if score >= 50:
     risk_level = "High"
    elif score >= 10:
     risk_level = "Moderate"
    else:
     risk_level = "Low"

    return risk_level, score, factors


def main():
    conn = get_connection()

    with conn.cursor() as cur:

        cur.execute("""
    SELECT
        s.pond_id,
        w.temperature,
        w.ph,
        w.dissolved_oxygen,
        f.activity_level
    FROM water_readings w
    JOIN sensors s
        ON w.sensor_id = s.id
    JOIN fish_observations f
        ON s.pond_id = f.pond_id
    ORDER BY w.recorded_at DESC
    LIMIT 1;
""")

        data = cur.fetchone()

        if not data:
            print("No monitoring data found.")
            conn.close()
            return

        pond_id, temperature, ph, dissolved_oxygen, activity_level = data

        risk_level, score, factors = assess_risk(
            float(temperature),
            float(ph),
            float(dissolved_oxygen),
            activity_level
        )

        contributing_factors = (
            ", ".join(factors)
            if factors
            else "Water parameters and fish behaviour appear normal"
        )

        cur.execute("""
            INSERT INTO risk_assessments
            (pond_id, risk_level, risk_score, contributing_factors)
            VALUES (%s, %s, %s, %s)
        """, (
            pond_id,
            risk_level,
            score,
            contributing_factors
        ))

        if risk_level == "High":
            alert_message = (
                f"High stress risk detected in pond {pond_id}. "
                f"Factors: {contributing_factors}"
            )

            cur.execute("""
                INSERT INTO alerts
                (pond_id, risk_assessment_id, alert_level, message)
                VALUES (
                    %s,
                    (SELECT MAX(id) FROM risk_assessments WHERE pond_id = %s),
                    %s,
                    %s
                )
            """, (
                pond_id,
                pond_id,
                "High",
                alert_message
            ))

        conn.commit()
    

    print("✅ Risk assessment completed.")
    print(f"Risk level: {risk_level}")
    print(f"Risk score: {score}")
    print(f"Factors: {contributing_factors}")


if __name__ == "__main__":
    main()