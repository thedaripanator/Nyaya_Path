CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE advocate_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    enrollment_number VARCHAR(100) NOT NULL UNIQUE,
    state_bar_council VARCHAR(255),
    primary_practice_area VARCHAR(255),
    primary_court VARCHAR(255),
    enrollment_status VARCHAR(20) NOT NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ
);

CREATE TABLE chat_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_role VARCHAR(20),
    query TEXT,
    answer TEXT,
    sources JSONB,
    created_at TIMESTAMPTZ
);
CREATE INDEX chat_logs_user_created_idx ON chat_logs(user_id, created_at DESC);

CREATE TABLE saved_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20),
    item_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    category VARCHAR(255),
    saved_at TIMESTAMPTZ,
    CONSTRAINT user_item_idx UNIQUE(user_id, item_id)
);

CREATE TABLE uploaded_documents (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    case_name VARCHAR(255),
    court VARCHAR(255),
    year VARCHAR(255),
    citation VARCHAR(255),
    chunks_indexed INTEGER NOT NULL DEFAULT 0,
    indexing_status VARCHAR(20) NOT NULL DEFAULT 'INDEXED',
    uploaded_at TIMESTAMPTZ
);
CREATE INDEX uploaded_documents_owner_uploaded_idx ON uploaded_documents(owner_id, uploaded_at DESC);
