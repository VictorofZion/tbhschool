INSERT INTO users (full_name, email, password_hash, role)
VALUES (
    'School Administrator',
    'admin@tbhs.edu.ng',
    '$2a$10$7vN3lM8M1b1V.G14mYdYc.97oO5lS/tV0/Fz78R7FhJb2xYvP61Xm', -- Bcrypt hash for AdminPassword123
    'admin'
);