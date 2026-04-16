const db = require('./db');

function initDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        duration INTEGER NOT NULL
      )
    `);

    db.exec(`
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
    `);

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
          60
        ],
        [
          'Fade / Taper Fade',
          'En skarp fade eller taper fade med rene overgange og detaljer.',
          100,
          60
        ],
        [
          'Skægtrim',
          'Trimning og formning af skæg for et rent og velplejet look.',
          50,
          30
        ],
        [
          'Børneklip',
          'Valgfri klipning til dit barn.',
          125,
          65
        ]
      ];

      for (const service of services) {
        insert.run(...service);
      }

      console.log('Services indsat i databasen.');
    } else {
      console.log(`Services findes allerede: ${count.count}`);
    }

    console.log('Databasen er klar.');
  } catch (error) {
    console.error('Fejl ved init af database:', error);
  }
}

module.exports = {
  initDatabase
};