import { Pool, type PoolClient, type PoolConfig } from "pg";

type ExecuteResult = {
  insertId: number;
  affectedRows: number;
};

class PostgresConnection {
  constructor(private readonly client: PoolClient) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<[T[]]> {
    const { text, values } = normalizeSql(sql, params);
    const result = await this.client.query(text, values);
    return [result.rows as T[]];
  }

  async execute(sql: string, params: unknown[] = []): Promise<[ExecuteResult]> {
    const { text, values } = normalizeSql(sql, params);
    const result = await this.client.query(text, values);
    const firstRow = (result.rows?.[0] ?? {}) as Record<string, unknown>;
    const insertIdRaw = firstRow.id ?? firstRow.insertId ?? null;
    const insertId = typeof insertIdRaw === "bigint" ? Number(insertIdRaw) : Number(insertIdRaw ?? 0);
    return [
      {
        insertId: Number.isNaN(insertId) ? 0 : insertId,
        affectedRows: result.rowCount ?? 0,
      },
    ];
  }

  async beginTransaction(): Promise<void> {
    await this.client.query("BEGIN");
  }

  async commit(): Promise<void> {
    await this.client.query("COMMIT");
  }

  async rollback(): Promise<void> {
    try {
      await this.client.query("ROLLBACK");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/no transaction/i.test(message)) {
        throw error;
      }
    }
  }
}

let pool: Pool | null = null;

const TLS_REQUIRED_SSLMODES = new Set(["require", "verify-ca", "verify-full"]);

function normalizeSslMode(value: string | null | undefined): string | null {
  return value ? value.trim().toLowerCase() : null;
}

function resolveConnectionString(): string {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.SUPABASE_DB_URL ??
    process.env.SUPABASE_CONNECTION_STRING ??
    process.env.SUPABASE_DB_URL_INTERNAL;

  if (!connectionString?.trim()) {
    throw new Error(
      "Database configuration is missing. Set DATABASE_URL (or SUPABASE_DB_URL) to a valid Postgres connection string."
    );
  }

  return connectionString.trim();
}

function shouldEnableSsl(connectionString: string): boolean {
  const override = normalizeSslMode(process.env.PGSSLMODE);
  if (override === "disable") {
    return false;
  }
  if (override && TLS_REQUIRED_SSLMODES.has(override)) {
    return true;
  }

  try {
    const url = new URL(connectionString);
    const sslMode = normalizeSslMode(url.searchParams.get("sslmode"));
    if (sslMode === "disable") {
      return false;
    }
    if (sslMode && TLS_REQUIRED_SSLMODES.has(sslMode)) {
      return true;
    }
    const host = url.hostname.toLowerCase();
    if (host.endsWith("supabase.co") || host.endsWith("supabase.net")) {
      return true;
    }
  } catch {
    // ignore malformed URL parsing errors
  }

  return false;
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = resolveConnectionString();
    const enableSsl = shouldEnableSsl(connectionString);
    const config: PoolConfig = {
      connectionString: enableSsl ? sanitizeConnectionString(connectionString) : connectionString,
      max: process.env.PGPOOL_MAX ? Number(process.env.PGPOOL_MAX) : undefined,
    };

    if (enableSsl) {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = new Pool(config);
  }

  return pool;
}

type NormalizedSql = { text: string; values: unknown[] };

function normalizeSql(sql: string, params: unknown[]): NormalizedSql {
  if (!params.length) {
    return { text: sql, values: [] };
  }

  let index = 0;
  const text = sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });

  if (index !== params.length) {
    throw new Error(
      `Mismatched SQL parameter count. Found ${index} placeholder(s) but received ${params.length} value(s).`
    );
  }

  return { text, values: params };
}

export async function withConnection<T>(callback: (connection: PostgresConnection) => Promise<T>): Promise<T> {
  const client = await getPool().connect();

  try {
    const connection = new PostgresConnection(client);
    return await callback(connection);
  } finally {
    client.release();
  }
}

function sanitizeConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.has("sslmode")) {
      url.searchParams.delete("sslmode");
    }
    if (!url.searchParams.toString()) {
      url.search = "";
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
