const db = require('./db');

// Behandlinger
const createServicesTable = `
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL
  )
`;

// Bookinger
const createAppointmentsTable = `
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    reminder_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(service_id) REFERENCES services(id)
  )
`;

db.exec(createServicesTable);
db.exec(createAppointmentsTable);

const count = db.prepare('SELECT COUNT(*) as count FROM services').get();

if (count.count === 0) {
  const insert = db.prepare(`
    INSERT INTO services (name, description, price, duration)
    VALUES (?, ?, ?, ?)
  `);

  const services = [
    [
      'Herreklip',
      'En klassisk herreklipning med fokus på rene linjer og en skarp finish.',
      100,
      45
    ],
    [
      'Fade / Taper Fade',
      'En skarp fade eller taper fade med rene overgange og detaljer.',
      100,
      50
    ],
    [
      'Skægtrim',
      'Trimning og formning af skæg for et rent og velplejet look.',
      50,
      25
    ],
    [
      'Hår + skæg',
      'Kombination af klipning og skægtrim i én booking.',
      125,
      65
    ]
  ];

  for (const service of services) {
    insert.run(...service);
  }

  console.log('Services indsat i databasen.');
}

console.log('Databasen er klar.');