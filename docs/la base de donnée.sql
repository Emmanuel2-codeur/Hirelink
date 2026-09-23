-- ============================================================
-- HIRELINK
-- Plateforme Intelligente de Recrutement et de Gestion des Stages
-- Base de données PostgreSQL
-- ============================================================


-- ============================================================
-- 1. EXTENSION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. TYPES ENUM
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'candidate',
    'recruiter',
    'admin'
);

CREATE TYPE account_status AS ENUM (
    'pending',
    'active',
    'suspended',
    'rejected'
);

CREATE TYPE job_type AS ENUM (
    'stage',
    'emploi',
    'alternance',
    'freelance'
);

CREATE TYPE application_status AS ENUM (
    'submitted',
    'reviewing',
    'shortlisted',
    'interview',
    'accepted',
    'rejected',
    'withdrawn'
);

CREATE TYPE interview_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled',
    'rescheduled'
);

CREATE TYPE notification_type AS ENUM (
    'application',
    'interview',
    'job',
    'system',
    'matching'
);


-- ============================================================
-- 3. UTILISATEURS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role user_role NOT NULL DEFAULT 'candidate',

    status account_status NOT NULL DEFAULT 'pending',

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    phone VARCHAR(30),

    avatar_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. PROFILS CANDIDATS
-- ============================================================

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    bio TEXT,

    location VARCHAR(150),

    education_level VARCHAR(150),

    school VARCHAR(255),

    field_of_study VARCHAR(255),

    graduation_year INT,

    years_experience NUMERIC(4,1) DEFAULT 0,

    linkedin_url TEXT,

    github_url TEXT,

    portfolio_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_candidate_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 5. ENTREPRISES
-- ============================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,

    description TEXT,

    industry VARCHAR(150),

    website TEXT,

    logo_url TEXT,

    location VARCHAR(150),

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. RECRUTEURS
-- ============================================================

CREATE TABLE recruiters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    company_id UUID NOT NULL,

    job_title VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_recruiter_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recruiter_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 7. COMPÉTENCES
-- ============================================================

CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL UNIQUE,

    category VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. COMPÉTENCES DES CANDIDATS
-- ============================================================

CREATE TABLE candidate_skills (
    candidate_id UUID NOT NULL,

    skill_id UUID NOT NULL,

    level VARCHAR(50),

    years_experience NUMERIC(4,1),

    PRIMARY KEY (candidate_id, skill_id),

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 9. CV
-- ============================================================

CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    candidate_id UUID NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    file_url TEXT NOT NULL,

    file_type VARCHAR(100) DEFAULT 'application/pdf',

    file_size BIGINT,

    extracted_text TEXT,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 10. COMPÉTENCES EXTRAITES DES CV PAR L'IA
-- ============================================================

CREATE TABLE resume_skills (
    resume_id UUID NOT NULL,

    skill_id UUID NOT NULL,

    confidence_score NUMERIC(5,2),

    source VARCHAR(50) DEFAULT 'ai',

    PRIMARY KEY (resume_id, skill_id),

    FOREIGN KEY (resume_id)
        REFERENCES resumes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 11. OFFRES D'EMPLOI / STAGE
-- ============================================================

CREATE TABLE job_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    created_by UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    job_type job_type NOT NULL,

    location VARCHAR(150),

    remote_allowed BOOLEAN NOT NULL DEFAULT FALSE,

    salary_min NUMERIC(12,2),

    salary_max NUMERIC(12,2),

    required_education VARCHAR(150),

    experience_required NUMERIC(4,1) DEFAULT 0,

    application_deadline DATE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 12. COMPÉTENCES REQUISES PAR LES OFFRES
-- ============================================================

CREATE TABLE job_skills (
    job_id UUID NOT NULL,

    skill_id UUID NOT NULL,

    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    weight NUMERIC(5,2) DEFAULT 1.0,

    PRIMARY KEY (job_id, skill_id),

    FOREIGN KEY (job_id)
        REFERENCES job_offers(id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 13. CANDIDATURES
-- ============================================================

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    candidate_id UUID NOT NULL,

    job_id UUID NOT NULL,

    resume_id UUID,

    cover_letter TEXT,

    status application_status NOT NULL DEFAULT 'submitted',

    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(candidate_id, job_id),

    FOREIGN KEY (candidate_id)
        REFERENCES candidates(id)
        ON DELETE CASCADE,

    FOREIGN KEY (job_id)
        REFERENCES job_offers(id)
        ON DELETE CASCADE,

    FOREIGN KEY (resume_id)
        REFERENCES resumes(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 14. RÉSULTATS DU MATCHING IA
-- ============================================================

CREATE TABLE ai_matching_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL UNIQUE,

    global_score NUMERIC(5,2) NOT NULL,

    skills_score NUMERIC(5,2),

    experience_score NUMERIC(5,2),

    education_score NUMERIC(5,2),

    matched_skills JSONB DEFAULT '[]',

    missing_skills JSONB DEFAULT '[]',

    explanation TEXT,

    ai_provider VARCHAR(50),

    model_name VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    CHECK(global_score >= 0 AND global_score <= 100),

    CHECK(skills_score >= 0 AND skills_score <= 100),

    CHECK(experience_score >= 0 AND experience_score <= 100),

    CHECK(education_score >= 0 AND education_score <= 100)
);


-- ============================================================
-- 15. ENTRETIENS
-- ============================================================

CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id UUID NOT NULL,

    scheduled_by UUID NOT NULL,

    scheduled_at TIMESTAMPTZ NOT NULL,

    duration_minutes INT DEFAULT 30,

    location TEXT,

    meeting_url TEXT,

    notes TEXT,

    status interview_status NOT NULL DEFAULT 'scheduled',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (application_id)
        REFERENCES applications(id)
        ON DELETE CASCADE,

    FOREIGN KEY (scheduled_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 16. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    type notification_type NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    data JSONB DEFAULT '{}',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 17. JOURNAL D'AUDIT ADMINISTRATEUR
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_id UUID,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id UUID,

    old_data JSONB,

    new_data JSONB,

    ip_address INET,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (actor_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 18. INDEX
-- ============================================================

CREATE INDEX idx_users_role
ON users(role);

CREATE INDEX idx_users_status
ON users(status);

CREATE INDEX idx_candidates_user
ON candidates(user_id);

CREATE INDEX idx_recruiters_company
ON recruiters(company_id);

CREATE INDEX idx_job_company
ON job_offers(company_id);

CREATE INDEX idx_job_type
ON job_offers(job_type);

CREATE INDEX idx_job_active
ON job_offers(is_active);

CREATE INDEX idx_job_deadline
ON job_offers(application_deadline);

CREATE INDEX idx_app_candidate
ON applications(candidate_id);

CREATE INDEX idx_app_job
ON applications(job_id);

CREATE INDEX idx_app_status
ON applications(status);

CREATE INDEX idx_matching_score
ON ai_matching_results(global_score);

CREATE INDEX idx_interview_date
ON interviews(scheduled_at);

CREATE INDEX idx_notifications_user
ON notifications(user_id);

CREATE INDEX idx_notifications_read
ON notifications(is_read);

CREATE INDEX idx_audit_actor
ON audit_logs(actor_id);

CREATE INDEX idx_audit_created
ON audit_logs(created_at);


-- ============================================================
-- 19. FONCTION POUR updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 20. TRIGGERS
-- ============================================================

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE TRIGGER candidates_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE TRIGGER companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE TRIGGER resumes_updated_at
BEFORE UPDATE ON resumes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE TRIGGER job_offers_updated_at
BEFORE UPDATE ON job_offers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE TRIGGER applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE TRIGGER interviews_updated_at
BEFORE UPDATE ON interviews
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


-- ============================================================
-- FIN DE LA STRUCTURE HIRELINK
-- ============================================================