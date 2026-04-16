const Database = require('better-sqlite3');

const db = new Database('booking.db');

module.exports = db;