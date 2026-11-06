CREATE TABLE IF NOT EXISTS legal_translation_cache (
    cache_key VARCHAR(64) PRIMARY KEY,
    source_hash VARCHAR(64) NOT NULL,
    target_language VARCHAR(2) NOT NULL,
    model_version VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(100) NOT NULL,
    translated_content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_legal_translation_cache_lookup
    ON legal_translation_cache (source_hash, target_language, model_version, prompt_version);
