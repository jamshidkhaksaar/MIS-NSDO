import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

type ExecuteResult = {
  insertId: number;
  affectedRows: number;
};

type Statement = {
  all: (...params: unknown[]) => unknown[];
  run: (...params: unknown[]) => { lastInsertRowid?: number | bigint; changes?: number };
};

type DatabaseInstance = {
  prepare: (sql: string) => Statement;
  exec: (sql: string) => void;
  pragma: (command: string) => void;
};

class SQLiteConnection {
  private db: DatabaseInstance;

  constructor(database: DatabaseInstance) {
    this.db = database;
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<[T[]]> {
    const statement = this.prepare(sql);
    const rows = statement.all(...params);
    return [rows as T[]];
  }

  async execute(sql: string, params: unknown[] = []): Promise<[ExecuteResult]> {
    const statement = this.prepare(sql);
    const result = statement.run(...params);
    return [
      {
        insertId: typeof result.lastInsertRowid === "bigint"
          ? Number(result.lastInsertRowid)
          : Number(result.lastInsertRowid ?? 0),
        affectedRows: result.changes ?? 0,
      },
    ];
  }

  async beginTransaction(): Promise<void> {
    this.db.exec("BEGIN");
  }

  async commit(): Promise<void> {
    this.db.exec("COMMIT");
  }

  async rollback(): Promise<void> {
    try {
      this.db.exec("ROLLBACK");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/no transaction/i.test(message)) {
        throw error;
      }
    }
  }

  private prepare(sql: string): Statement {
    try {
      return this.db.prepare(sql);
    } catch (error) {
      console.error("Failed to prepare SQL statement:", sql);
      throw error;
    }
  }
}

let database: DatabaseInstance | null = null;

function resolveDatabasePath(): string {
  const configuredPath = process.env.DB_SQLITE_PATH;
  if (!configuredPath?.trim()) {
    throw new Error("Database configuration is missing. Set DB_SQLITE_PATH to a writable SQLite file path.");
  }

  const resolvedPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);

  const directory = path.dirname(resolvedPath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  return resolvedPath;
}

function getDatabaseInstance(): DatabaseInstance {
  if (!database) {
    const filePath = resolveDatabasePath();
    const instance = new (Database as unknown as { new (path: string): DatabaseInstance })(filePath);
    instance.pragma("foreign_keys = ON");
    database = instance;
  }
  return database;
}

export async function withConnection<T>(callback: (connection: SQLiteConnection) => Promise<T>): Promise<T> {
  const dbInstance = getDatabaseInstance();
  const connection = new SQLiteConnection(dbInstance);
  return callback(connection);
}
