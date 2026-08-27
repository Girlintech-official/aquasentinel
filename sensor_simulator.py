import random
import time
import requests


AAPI_URL = "https://aquasentinel-api-q232.onrender.com/sensor-readings"
SENSOR_KEY = "AS_SENSOR_a83f5d91c7e248b9b1f0e72d6c4a"


HEADERS = {
    "Authorization": f"Sensor {SENSOR_KEY}"
}

SENSOR_ID = 1

def generate_normal_reading():
    return {
        "sensor_id": SENSOR_ID,
        "temperature": round(random.uniform(26.0, 30.0), 2),
        "ph": round(random.uniform(6.8, 8.0), 2),
        "dissolved_oxygen": round(random.uniform(5.0, 8.0), 2),
    }


def generate_moderate_reading():
    return {
        "sensor_id": SENSOR_ID,
        "temperature": round(random.uniform(30.5, 32.0), 2),
        "ph": round(random.uniform(6.0, 6.4), 2),
        "dissolved_oxygen": round(random.uniform(4.0, 4.9), 2),
    }


def generate_high_risk_reading():
    return {
        "sensor_id": SENSOR_ID,
        "temperature": round(random.uniform(34.5, 37.0), 2),
        "ph": round(random.uniform(5.0, 5.4), 2),
        "dissolved_oxygen": round(random.uniform(2.0, 2.9), 2),
    }


def generate_reading():
    scenario = random.choice([
        "normal",
        "normal",
        "normal",
        "moderate",
        "high",
    ])

    if scenario == "normal":
        reading = generate_normal_reading()
    elif scenario == "moderate":
        reading = generate_moderate_reading()
    else:
        reading = generate_high_risk_reading()

    return scenario, reading


def send_reading(scenario, reading):
    try:
        response = requests.post(
            API_URL,
            json=reading,
            timeout=30,
            headers=HEADERS
        )

        response.raise_for_status()

        print(f"\nScenario: {scenario.upper()}")
        print("Reading sent successfully:")
        print(reading)
        print("Server response:")
        print(response.json())

    except requests.RequestException as error:
        print("\nError sending reading:")
        print(error)


def main():
    print("AquaSentinel Sensor Simulator started.")
    print(f"Sending readings to: {API_URL}")
    print("Press Ctrl+C to stop.\n")

    while True:
        scenario, reading = generate_reading()
        send_reading(scenario, reading)

        time.sleep(10)


if __name__ == "__main__":
    main()

    