const mysql = require('mysql2/promise');
require('dotenv').config();

let connection = null;

const initDB = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return connection;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const getConnection = () => {
  if (!connection) {
    throw new Error('Database not initialized. Call initDB() first');
  }
  return connection;
};

module.exports = { initDB, getConnection };