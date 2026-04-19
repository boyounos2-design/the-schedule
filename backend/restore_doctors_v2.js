const bcrypt = require('bcryptjs');
const { getDb } = require('./src/db/database');

async function run() {
  const db = getDb();
  const password = 'egy123';
  const hash = bcrypt.hashSync(password, 10);

  const doctors = [
    { name: 'د يوسف عدنان', username: 'yousefthegreatest', specialty: 'Orthopedic' },
    { name: 'د السيد فوزى سعد الدين', username: 'sayedthestatue', specialty: 'Orthopedic' },
    { name: 'د أيمن فؤاد', username: 'ayman', specialty: 'Orthopedic' },
    { name: 'د حسام عبدالناصر', username: 'z3ama', specialty: null },
    { name: 'د عثمان عزالدين', username: 'theaveator', specialty: null },
    { name: 'د أحمد يونس', username: 'younis', specialty: null },
    { name: 'د على عمر', username: 'alimyson', specialty: null },
    { name: 'د سيد أحمد', username: 'sayedthebig', specialty: null },
    { name: 'د حسين سعد', username: 'housseinqism', specialty: null },
    { name: 'د مينا مجدى', username: 'mina', specialty: null },
    { name: 'د نسيم', username: 'nassem', specialty: null },
    { name: 'د عصام', username: 'essam', specialty: null },
    { name: 'د أسعد', username: 'assad', specialty: null },
    { name: 'د محمود أبوبكر', username: 'bkrthebiggest', specialty: null },
    { name: 'د محمد ممدوح', username: 'mamdoh', specialty: null },
    { name: 'د اسلام سعيد', username: 'eslamqena', specialty: null },
    { name: 'د أحمد النجار', username: 'ahmedqena', specialty: null }
  ];

  console.log('Cleaning up existing doctors...');
  await db('users').where({ role: 'doctor' }).delete();

  console.log(`Inserting ${doctors.length} doctors with password: ${password}`);
  
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const nextMonth = now.getMonth() === 11
    ? `${now.getFullYear() + 1}-01`
    : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;

  for (const doc of doctors) {
    const [uid] = await db('users').insert({
      name: doc.name,
      username: doc.username.toLowerCase().trim(),
      password_hash: hash,
      role: 'doctor',
      specialty: doc.specialty,
      created_at: db.fn.now()
    });

    // Add default quotas
    await db('quotas').insert({ user_id: uid, month: thisMonth, morning_er: 4, evening_er: 2, morning_dept: 3, surgeries: 4, clinics: 5, evening_dept: 2 });
    await db('quotas').insert({ user_id: uid, month: nextMonth, morning_er: 4, evening_er: 2, morning_dept: 3, surgeries: 4, clinics: 5, evening_dept: 2 });
  }

  console.log('Done!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
