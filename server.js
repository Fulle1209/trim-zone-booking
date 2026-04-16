require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const db = require('./db');
const {
  sendSMS
} = require('./sms');
const {
  initDatabase
} = require('./initDb');

initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OPENING_HOURS = {
  1: {
    start: '16:00',
    end: '23:00'
  }, // mandag
  2: {
    start: '16:00',
    end: '23:00'
  }, // tirsdag
  3: {
    start: '16:00',
    end: '23:00'
  }, // onsdag
  4: {
    start: '16:00',
    end: '23:00'
  }, // torsdag
  5: {
    start: '16:00',
    end: '23:00'
  }, // fredag
  6: {
    start: '16:00',
    end: '23:00'
  }, // lørdag
  0: {
    start: '16:00',
    end: '23:00'
  } // søndag
};

function generateTimeSlots(start, end, duration) {
  const slots = [];

  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  for (let minutes = startTotal; minutes + duration <= endTotal; minutes += 30) {
    const hour = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const minute = (minutes % 60).toString().padStart(2, '0');
    slots.push(`${hour}:${minute}`);
  }

  return slots;
}

function formatDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

app.get('/api/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services').all();
  res.json(services);
});

app.get('/api/available-slots', (req, res) => {
  const {
    date,
    serviceId
  } = req.query;

  if (!date || !serviceId) {
    return res.status(400).json({
      error: 'Dato og serviceId er påkrævet.'
    });
  }

  const service = db
    .prepare('SELECT * FROM services WHERE id = ?')
    .get(serviceId);

  if (!service) {
    return res.status(404).json({
      error: 'Behandling ikke fundet.'
    });
  }

  const day = new Date(date).getDay();
  const hours = OPENING_HOURS[day];

  const allSlots = generateTimeSlots(hours.start, hours.end, service.duration);

  const booked = db
    .prepare(
      `SELECT appointment_time FROM appointments
       WHERE appointment_date = ? AND service_id = ?`
    )
    .all(date, serviceId)
    .map((row) => row.appointment_time);

  const freeSlots = allSlots.filter((slot) => !booked.includes(slot));

  res.json(freeSlots);
});

app.post('/api/book', async (req, res) => {
  const {
    serviceId,
    customerName,
    customerPhone,
    appointmentDate,
    appointmentTime
  } = req.body;

  if (!serviceId || !customerName || !customerPhone || !appointmentDate || !appointmentTime) {
    return res.status(400).json({
      error: 'Alle felter skal udfyldes.'
    });
  }

  const service = db
    .prepare('SELECT * FROM services WHERE id = ?')
    .get(serviceId);

  if (!service) {
    return res.status(404).json({
      error: 'Behandling ikke fundet.'
    });
  }

  const existing = db.prepare(
    `SELECT * FROM appointments
     WHERE appointment_date = ? AND appointment_time = ?`
  ).get(appointmentDate, appointmentTime);

  if (existing) {
    return res.status(409).json({
      error: 'Denne tid er allerede booket.'
    });
  }

  db.prepare(
    `INSERT INTO appointments (service_id, customer_name, customer_phone, appointment_date, appointment_time)
     VALUES (?, ?, ?, ?, ?)`
  ).run(serviceId, customerName, customerPhone, appointmentDate, appointmentTime);

  const smsText = `Hej ${customerName}! Din booking hos Trim Zone er bekræftet: ${service.name} den ${appointmentDate} kl. ${appointmentTime}. Vi glæder os til at se dig.`;

  await sendSMS(customerPhone, smsText);

  res.json({
    success: true,
    message: 'Booking gennemført.'
  });
});

app.get('/api/admin/appointments', (req, res) => {
  const appointments = db.prepare(`
    SELECT appointments.*, services.name as service_name, services.price
    FROM appointments
    JOIN services ON appointments.service_id = services.id
    ORDER BY appointment_date ASC, appointment_time ASC
  `).all();

  res.json(appointments);
});

cron.schedule('*/5 * * * *', async () => {
  console.log('Checker reminders...');

  const appointments = db.prepare(`
    SELECT appointments.*, services.name as service_name
    FROM appointments
    JOIN services ON appointments.service_id = services.id
    WHERE reminder_sent = 0
  `).all();

  const now = new Date();

  for (const appointment of appointments) {
    const appointmentDateTime = formatDateTime(
      appointment.appointment_date,
      appointment.appointment_time
    );

    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours <= 24 && diffHours > 23.5) {
      const body = `Hej ${appointment.customer_name}! Påmindelse om din tid hos Trim Zone i morgen kl. ${appointment.appointment_time} til ${appointment.service_name}.`;

      await sendSMS(appointment.customer_phone, body);

      db.prepare(
        `UPDATE appointments SET reminder_sent = 1 WHERE id = ?`
      ).run(appointment.id);

      console.log('Reminder sendt til', appointment.customer_phone);
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server kører på http://localhost:${PORT}`);
});