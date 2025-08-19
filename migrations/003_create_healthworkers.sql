-- Healthworkers table
CREATE TABLE healthworkers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  chw_name VARCHAR,
  nurse_name VARCHAR,
  type VARCHAR NOT NULL CHECK (type IN ('chw', 'nurse')),
  license_number VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);




