import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export type DbConnectionOptions = {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
};

function createPool(): mysql.Pool {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
  } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error("Database configuration is missing. Ensure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME are set.");
  }

  return mysql.createPool({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD ?? undefined,
    database: DB_NAME,
    connectionLimit: 10,
    namedPlaceholders: true,
    supportBigNumbers: true,
  });
}

export function getDbPool(): mysql.Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function withConnection<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}
