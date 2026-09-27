CREATE TABLE IF NOT EXISTS user_presence (
    id SERIAL PRIMARY KEY,

    user_id VARCHAR(100) NOT NULL,
    username VARCHAR(100),

    channel VARCHAR(100),

    status VARCHAR(20) DEFAULT 'online',

    ip_address VARCHAR(100),
    device_info TEXT,

    last_seen TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW()
);
