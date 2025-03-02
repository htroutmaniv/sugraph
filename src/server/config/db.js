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

async function connectToDatabase() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

module.exports = { connectToDatabase };
