import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER || 'demoappgas.ddns.net',
  database: process.env.DB_NAME || 'dbGAS',
  user: process.env.DB_USER || 'demo',
  password: process.env.DB_PASSWORD || 'demo',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: false, // Use true if using Azure
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }

  try {
    pool = await sql.connect(config);
    console.log('Database connection established');
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

