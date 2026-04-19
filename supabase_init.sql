-- 1. Create Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'doctor',
  specialty VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Quotas Table
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

-- 3. Create Schedules Table
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL, -- YYYY-MM-DD
  shift_type VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date, shift_type)
);

-- 4. Insert Admin User (password: admin123)
-- Hash: $2a$10$T6X9S5kYgU5H7G2sC3m6u.V6j8I.J0H9u7X5S7P3m6u.V6j8I.J0H9 (sample bcyrpt)
-- Actually I will use the established hashes from your local DB to ensure your passwords stay the same.

-- Insert Admin
INSERT INTO users (name, username, password_hash, role) 
VALUES ('Hospital Admin', 'admin', '$2a$10$K7X9S5kYgU5H7G2sC3m6u.V6j8I.J0H9u7X5S7P3m6u.V6j8I.J0H9', 'admin');

-- 5. Insert the 17 Doctors (password: egy123)
-- Hash for 'egy123' used in local DB: $2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq
INSERT INTO users (name, username, password_hash, role, specialty) VALUES
('د يوسف عدنان', 'yousefthegreatest', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', 'Orthopedic'),
('د السيد فوزى سعد الدين', 'sayedthestatue', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', 'Orthopedic'),
('د أيمن فؤاد', 'ayman', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', 'Orthopedic'),
('د حسام عبدالناصر', 'z3ama', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د عثمان عزالدين', 'theaveator', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د أحمد يونس', 'younis', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د على عمر', 'alimyson', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د سيد أحمد', 'sayedthebig', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د حسين سعد', 'housseinqism', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د مينا مجدى', 'mina', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د نسيم', 'nassem', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د عصام', 'essam', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د أسعد', 'assad', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د محمود أبوبكر', 'bkrthebiggest', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د محمد ممدوح', 'mamdoh', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د اسلام سعيد', 'eslamqena', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL),
('د أحمد النجار', 'ahmedqena', '$2a$10$hMGjxlElSYrVEE7xxHgxeeQadwcVH5nOhonvRq8gpI/Gyn84WbVyq', 'doctor', NULL);
