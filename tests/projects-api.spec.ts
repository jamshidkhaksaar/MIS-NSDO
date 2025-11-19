
import { test, expect } from "@playwright/test";
import * as db from "@/lib/dashboard-repository";

test.beforeEach(async ({ request }) => {
    await request.post("/api/test-auth");
});

test("should reject project creation with invalid array data", async ({ request }) => {
  const response = await request.post("/api/projects", {
    data: {
      code: "TEST",
      name: "Test Project",
      provinces: ["one", 2, "three"],
    },
  });

  expect(response.status()).toBe(500);
  const json = await response.json();
  expect(json.message).toBe("Invalid array entry: all entries must be strings.");
});

test("should accept project creation with valid array data", async ({ request }) => {

    // @ts-ignore
    db.createProjectRecord = () => Promise.resolve({ id: "123" });

    const response = await request.post("/api/projects", {
      data: {
        code: "TEST",
        name: "Test Project",
        provinces: ["one", "two", "three"],
      },
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    expect(json.id).toBeDefined();
  });
