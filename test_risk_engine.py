from risk_engine import assess_risk


def run_test(name, temperature, ph, dissolved_oxygen, activity_level):
    risk_level, score, factors = assess_risk(
        temperature,
        ph,
        dissolved_oxygen,
        activity_level
    )

    print(f"\n{name}")
    print("-" * 40)
    print(f"Temperature: {temperature}°C")
    print(f"pH: {ph}")
    print(f"Dissolved Oxygen: {dissolved_oxygen} mg/L")
    print(f"Fish Activity: {activity_level}")
    print(f"\nRisk Level: {risk_level}")
    print(f"Risk Score: {score}")
    print(f"Factors: {', '.join(factors) if factors else 'None'}")


# Test 1: Healthy pond
run_test(
    "TEST 1 — HEALTHY POND",
    27,
    7.2,
    6.5,
    "Normal"
)

# Test 2: Moderate risk
run_test(
    "TEST 2 — MODERATE RISK",
    31.5,
    7.2,
    6.5,
    "Normal"
)

# Test 3: High risk
run_test(
    "TEST 3 — HIGH RISK",
    31.5,
    7.2,
    3.2,
    "Low"
)
# Test 4: Temperature exactly at lower boundary
run_test(
    "TEST 4 — TEMPERATURE LOWER BOUNDARY",
    24,
    7.2,
    6.5,
    "Normal"
)

# Test 5: Temperature exactly at upper boundary
run_test(
    "TEST 5 — TEMPERATURE UPPER BOUNDARY",
    30,
    7.2,
    6.5,
    "Normal"
)

# Test 6: pH exactly at lower boundary
run_test(
    "TEST 6 — PH LOWER BOUNDARY",
    27,
    6.5,
    6.5,
    "Normal"
)

# Test 7: pH exactly at upper boundary
run_test(
    "TEST 7 — PH UPPER BOUNDARY",
    27,
    8.5,
    6.5,
    "Normal"
)

# Test 8: Dissolved oxygen exactly at boundary
run_test(
    "TEST 8 — OXYGEN BOUNDARY",
    27,
    7.2,
    5,
    "Normal"
)

# Test 9: Slight temperature abnormality
run_test(
    "TEST 9 — SLIGHT TEMPERATURE ABNORMALITY",
    31,
    7.2,
    6.5,
    "Normal"
)

# Test 10: Moderate temperature abnormality
run_test(
    "TEST 10 — MODERATE TEMPERATURE ABNORMALITY",
    33,
    7.2,
    6.5,
    "Normal"
)

# Test 11: Severe temperature abnormality
run_test(
    "TEST 11 — SEVERE TEMPERATURE ABNORMALITY",
    35,
    7.2,
    6.5,
    "Normal"
)

# Test 12: Reduced dissolved oxygen
run_test(
    "TEST 12 — REDUCED OXYGEN",
    27,
    7.2,
    4.8,
    "Normal"
)

# Test 13: Low dissolved oxygen
run_test(
    "TEST 13 — LOW OXYGEN",
    27,
    7.2,
    3.5,
    "Normal"
)

# Test 14: Critically low dissolved oxygen
run_test(
    "TEST 14 — CRITICALLY LOW OXYGEN",
    27,
    7.2,
    2.5,
    "Normal"
)

# Test 15: Slight pH abnormality
run_test(
    "TEST 15 — SLIGHT PH ABNORMALITY",
    27,
    6.3,
    6.5,
    "Normal"
)

# Test 16: Moderate pH abnormality
run_test(
    "TEST 16 — MODERATE PH ABNORMALITY",
    27,
    5.8,
    6.5,
    "Normal"
)

# Test 17: Severe pH abnormality
run_test(
    "TEST 17 — SEVERE PH ABNORMALITY",
    27,
    5.2,
    6.5,
    "Normal"
)