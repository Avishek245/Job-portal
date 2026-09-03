INSERT INTO users (name, email, password_hash, role)
VALUES
('Demo Employer', 'employer@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employer'),
('Demo Job Seeker', 'jobseeker@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'job_seeker')
ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (name, description, location, website)
VALUES
('CloudNova Technologies', 'Cloud and platform engineering company.', 'Bengaluru', 'https://example.com'),
('PixelForge Labs', 'Product engineering and software services company.', 'Hyderabad', 'https://example.com')
ON CONFLICT DO NOTHING;

INSERT INTO jobs (company_id, title, description, location, employment_type, salary_min, salary_max)
SELECT c.id, v.title, v.description, v.location, v.employment_type, v.salary_min, v.salary_max
FROM companies c
JOIN (VALUES
    ('CloudNova Technologies', 'DevOps Engineer', 'Build and maintain cloud infrastructure and deployment pipelines.', 'Bengaluru', 'full-time', 700000, 1400000),
    ('CloudNova Technologies', 'Backend Developer', 'Develop REST APIs and backend services.', 'Remote', 'full-time', 600000, 1200000),
    ('PixelForge Labs', 'Frontend Developer', 'Build responsive React applications and reusable UI components.', 'Hyderabad', 'full-time', 550000, 1100000),
    ('PixelForge Labs', 'QA Automation Engineer', 'Create automated tests for web applications and APIs.', 'Remote', 'full-time', 500000, 1000000)
) AS v(company_name, title, description, location, employment_type, salary_min, salary_max)
ON c.name = v.company_name
WHERE NOT EXISTS (
    SELECT 1 FROM jobs j WHERE j.title = v.title AND j.company_id = c.id
);
