#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const DEFAULT_PASSWORD = "Kabul@321$";
const SALT_ROUNDS = 10;
const TLS_REQUIRED_SSLMODES = new Set(["require", "verify-ca", "verify-full"]);

function printUsage() {
  console.log(`
Create or update an NSDO MIS administrator.

Defaults (override with flags as needed):
  --name "Administrator"
  --email it@nsdo.org.af
  --organization "NSDO IT Unit"
  --role "Administrator"
  --password "${DEFAULT_PASSWORD}"

Optional arguments:
  --name "<full name>"                    (default: "Administrator")
  --email "<email address>"               (default: it@nsdo.org.af)
  --organization "<organization label>"   (default: "NSDO IT Unit")
  --role "<Administrator|Editor|Viewer>"  (default: Administrator)
  --password "<password value>"           (default: ${DEFAULT_PASSWORD})

Example:
  node scripts/create-admin-user.js --name "Fatima Ahmadi" --email fatima.ahmadi@nsdo.org.af --organization "NSDO HQ"
`);
}

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return options;
}

function resolveConnectionString() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_CONNECTION_STRING ||
    process.env.SUPABASE_DB_URL_INTERNAL;

  if (!connectionString || !connectionString.trim()) {
    console.error(
      "Database configuration is missing. Set DATABASE_URL (or SUPABASE_DB_URL) to a Postgres connection string."
    );
    process.exit(1);
  }

  return connectionString.trim();
}

function shouldEnableSsl(connectionString) {
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
  } catch (error) {
    console.warn("Warning: unable to inspect database URL for SSL settings:", error.message);
  }

  return false;
}

function normalizeSslMode(value) {
  return value ? value.trim().toLowerCase() : null;
}

function sanitizeConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.has("sslmode")) {
      url.searchParams.delete("sslmode");
    }
    if (!url.searchParams.toString()) {
      url.search = "";
    }
    return url.toString();
  } catch (error) {
    console.warn("Warning: unable to sanitize database URL for SSL settings:", error.message);
    return connectionString;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    printUsage();
    process.exit(0);
  }

  const name =
    typeof args.name === "string" && args.name.trim().length ? args.name.trim() : "Administrator";
  const email =
    typeof args.email === "string" && args.email.trim().length
      ? args.email.trim().toLowerCase()
      : "it@nsdo.org.af";
  const organization =
    typeof args.organization === "string" && args.organization.trim().length
      ? args.organization.trim()
      : "NSDO IT Unit";
  const role =
    typeof args.role === "string" && args.role.trim().length ? args.role.trim() : "Administrator";
  const password =
    typeof args.password === "string" && args.password.trim().length
      ? args.password.trim()
      : DEFAULT_PASSWORD;

  if (!["Administrator", "Editor", "Viewer"].includes(role)) {
    console.error('Error: --role must be one of "Administrator", "Editor", or "Viewer".');
    process.exit(1);
  }

  const connectionString = resolveConnectionString();
  const enableSsl = shouldEnableSsl(connectionString);
  const poolConfig = {
    connectionString: enableSsl ? sanitizeConnectionString(connectionString) : connectionString,
  };

  if (enableSsl) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolConfig);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const existingResult = await client.query(
      "SELECT id, password_hash FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (existingResult.rows.length) {
      const existing = existingResult.rows[0];
      await client.query(
        "UPDATE users SET name = $1, role = $2, organization = $3, password_hash = $4, updated_at = NOW() WHERE id = $5",
        [name, role, organization, passwordHash, existing.id]
      );
    } else {
      await client.query(
        "INSERT INTO users (name, email, role, organization, password_hash) VALUES ($1, $2, $3, $4, $5)",
        [name, email, role, organization, passwordHash]
      );
    }

    await client.query("COMMIT");

    console.log(
      `User ${name} <${email}> stored successfully with role "${role}".${
        organization ? ` Organization: ${organization}.` : ""
      } Password has been set ${password === DEFAULT_PASSWORD ? "(default)" : ""}.`
    );
    console.log(
      "Reminder: Update the user's password via your identity policy if the default value is temporary."
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Failed to rollback transaction:", rollbackError);
    }
    console.error("Failed to store user record:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Unexpected error while creating admin user:", error);
  process.exit(1);
});
