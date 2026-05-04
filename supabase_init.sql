-- MASTER RESET SCRIPT (Run this in Supabase SQL Editor)

-- 1. CLEAN EVERYTHING (To avoid "already exists" errors)
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS quotas;
DROP TABLE IF EXISTS users;

-- 2. CREATE TABLES
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'doctor',
  specialty VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quotas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  morning_er INTEGER DEFAULT 0,
  evening_er INTEGER DEFAULT 0,
  morning_dept INTEGER DEFAULT 0,
  surgeries INTEGER DEFAULT 0,
  clinics INTEGER DEFAULT 0,
  evening_dept INTEGER DEFAULT 0,
  UNIQUE(user_id, month)
);

CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL, -- YYYY-MM-DD
  shift_type VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date, shift_type)
);

-- 3. INSERT ADMIN (Password: admin123)
-- Using verified hash: $2a$10$TjQJYPut17HxVoXc3lpWVOfEomNWxwqwKyKU4SHm8030YucEjtRbq
INSERT INTO users (name, username, password_hash, role) 
VALUES ('Hospital Admin', 'admin', '$2a$10$TjQJYPut17HxVoXc3lpWVOfEomNWxwqwKyKU4SHm8030YucEjtRbq', 'admin');

-- 4. INSERT 17 DOCTORS (Password: egy123)
-- Using verified hash: $2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW
INSERT INTO users (name, username, password_hash, role, specialty) VALUES
('د يوسف عدنان', 'yousefthegreatest', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', 'Orthopedic'),
('د السيد فوزى سعد الدين', 'sayedthestatue', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', 'Orthopedic'),
('د أيمن فؤاد', 'ayman', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', 'Orthopedic'),
('د حسام عبدالناصر', 'z3ama', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د عثمان عزالدين', 'theaveator', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د أحمد يونس', 'younis', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د على عمر', 'alimyson', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د سيد أحمد', 'sayedthebig', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د حسين سعد', 'housseinqism', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د مينا مجدى', 'mina', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د نسيم', 'nassem', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د عصام', 'essam', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د أسعد', 'assad', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د محمود أبوبكر', 'bkrthebiggest', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د محمد ممدوح', 'mamdoh', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د اسلام سعيد', 'eslamqena', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL),
('د أحمد النجار', 'ahmedqena', '$2a$10$z65I44eMUM0ovRL2tEt6f.T5g5FQHQjq6QWD.bL8a4e9E0qUQhqfW', 'doctor', NULL);
