#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DEFAULT_PASSWORD = "Kabul@321$";
const SALT_ROUNDS = 10;

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

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error(
      "Database connection details are missing. Ensure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME environment variables are set."
    );
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD ?? undefined,
    database: DB_NAME,
  });

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await connection.execute(
      "INSERT INTO users (name, email, role, organization, password_hash) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), organization = VALUES(organization), password_hash = VALUES(password_hash)",
      [name, email, role, organization, passwordHash]
    );

    console.log(
      `User ${name} <${email}> stored successfully with role "${role}".${
        organization ? ` Organization: ${organization}.` : ""
      } Password has been set ${password === DEFAULT_PASSWORD ? "(default)" : ""}.`
    );
    console.log(
      "Reminder: Update the user's password via your identity policy if the default value is temporary."
    );
  } catch (error) {
    console.error("Failed to store user record:", error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Unexpected error while creating admin user:", error);
  process.exit(1);
});
