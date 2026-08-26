CREATE TABLE farms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255)
);

CREATE TABLE ponds (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER NOT NULL REFERENCES farms(id),
    name VARCHAR(255) NOT NULL,
    species VARCHAR(255)
);

CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id),
    name VARCHAR(255),
    sensor_type VARCHAR(100)
);

CREATE TABLE water_readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id),
    temperature NUMERIC,
    ph NUMERIC,
    dissolved_oxygen NUMERIC,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fish_observations (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id),
    activity_level VARCHAR(100),
    feeding_response VARCHAR(100),
    unusual_behaviour VARCHAR(255),
    fish_count INTEGER,
    observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE risk_assessments (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id),
    risk_level VARCHAR(50),
    risk_score NUMERIC,
    contributing_factors TEXT,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id),
    risk_assessment_id INTEGER REFERENCES risk_assessments(id),
    alert_level VARCHAR(50),
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);