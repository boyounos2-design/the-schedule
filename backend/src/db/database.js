const knex = require('knex');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/schedu.db');

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = knex({
      client: 'sqlite3',
      connection: { filename: DB_PATH },
      useNullAsDefault: true,
    });
  }
  return db;
}

async function initDb() {
  const db = getDb();

  // Create tables
  await db.schema.hasTable('users').then(async (exists) => {
    if (!exists) {
      await db.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('name').notNullable();
        t.string('username').unique().notNullable();
        t.string('password_hash').notNullable();
        t.string('role').notNullable().defaultTo('doctor');
        t.string('specialty').nullable();
        t.timestamp('created_at').defaultTo(db.fn.now());
      });
    }
  });

  await db.schema.hasTable('quotas').then(async (exists) => {
    if (!exists) {
      await db.schema.createTable('quotas', (t) => {
        t.increments('id').primary();
        t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.string('month').notNullable(); // YYYY-MM
        t.integer('morning_er').defaultTo(0);
        t.integer('evening_er').defaultTo(0);
        t.integer('morning_dept').defaultTo(0);
        t.integer('surgeries').defaultTo(0);
        t.integer('clinics').defaultTo(0);
        t.integer('evening_dept').defaultTo(0);
        t.unique(['user_id', 'month']);
      });
    }
  });

  await db.schema.hasTable('schedules').then(async (exists) => {
    if (!exists) {
      await db.schema.createTable('schedules', (t) => {
        t.increments('id').primary();
        t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.string('date').notNullable(); // YYYY-MM-DD
        t.string('shift_type').notNullable();
        t.string('status').notNullable().defaultTo('draft');
        t.timestamp('created_at').defaultTo(db.fn.now());
        t.unique(['user_id', 'date', 'shift_type']);
      });
    }
  });

  // Seed data
  const adminExists = await db('users').where({ username: 'admin' }).first();
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    await db('users').insert({
      name: 'Hospital Admin',
      username: 'admin',
      password_hash: adminHash,
      role: 'admin',
    });

    const doctors = [
      { name: 'Dr. Ahmed Al-Rashid', username: 'dr.ahmed', specialty: 'Emergency Medicine' },
      { name: 'Dr. Sarah Johnson', username: 'dr.sarah', specialty: 'General Surgery' },
      { name: 'Dr. Mohamed Hassan', username: 'dr.mohamed', specialty: 'Internal Medicine' },
      { name: 'Dr. Fatima Al-Zahra', username: 'dr.fatima', specialty: 'Cardiology' },
    ];

    const hash = bcrypt.hashSync('doctor123', 10);
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextMonth = now.getMonth() === 11
      ? `${now.getFullYear() + 1}-01`
      : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;

    for (const doc of doctors) {
      const [uid] = await db('users').insert({
        name: doc.name,
        username: doc.username,
        password_hash: hash,
        role: 'doctor',
        specialty: doc.specialty,
      });
      await db('quotas').insert({ user_id: uid, month: thisMonth, morning_er: 4, evening_er: 2, morning_dept: 3, surgeries: 4, clinics: 5, evening_dept: 2 });
      await db('quotas').insert({ user_id: uid, month: nextMonth, morning_er: 4, evening_er: 2, morning_dept: 3, surgeries: 4, clinics: 5, evening_dept: 2 });
    }

    console.log('   Admin:  admin / admin123');
    console.log('   Doctor: dr.ahmed / doctor123');
  }

  const hasEveningDept = await db.schema.hasColumn('quotas', 'evening_dept');
  if (!hasEveningDept) {
    await db.schema.alterTable('quotas', t => {
      t.integer('evening_dept').defaultTo(0);
    });
  }

  return db;
}

module.exports = { getDb, initDb };
