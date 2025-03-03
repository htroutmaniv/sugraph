const sql = require('mssql');

const dbConfig = {
  user: 'sa',
  password: 'YourStrong!Passw0rd',
  server: 'localhost',
  database: 'simulated_data',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let poolPromise;

const connectToDatabase = async () => {
  try {
    // Add this debug logging
    console.log('Database configuration:', {
      server: process.env.DB_SERVER || 'not set',
      database: process.env.DB_NAME || 'not set',
      user: process.env.DB_USER || 'not set',
      // Don't log password
      host_docker: process.env.HOST_DOCKER_INTERNAL || 'not set',
    });

    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      server: process.env.DB_SERVER || 'host.docker.internal',
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    });

    console.log('Successfully connected to database');
    return pool;
  } catch (err) {
    console.error('Database connection error:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });
    throw err;
  }
};

module.exports = { connectToDatabase };
