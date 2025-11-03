import { test, expect } from "@playwright/test";

test("should clear personal information fields when anonymous checkbox is checked", async ({ page }) => {
  await page.route("/api/dashboard/state", (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({}),
    });
  });
  await page.goto("http://localhost:3000/complaint-form");

  // Fill in the form fields
  await page.getByLabel("Full Name").fill("John Doe");
  await page.getByRole("textbox", { name: "Email" }).fill("john.doe@example.com");
  await page.getByLabel("Phone (optional)").fill("1234567890");
  await page.getByLabel("Village").fill("Test Village");
  await page.getByLabel("Gender").selectOption({ label: "Male" });
  await page.getByLabel("Source of Complaint").selectOption({ label: "Community member" });
  await page.getByLabel("How it was Reported").selectOption({ label: "By phone" });

  // Check the "Report Anonymously" checkbox
  await page.getByLabel("Report Anonymously").check();

  // Assert that the fields are cleared
  await expect(page.getByLabel("Full Name")).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue("");
  await expect(page.getByLabel("Phone (optional)")).toHaveValue("");
  await expect(page.getByLabel("Village")).toHaveValue("");
  await expect(page.getByLabel("Gender")).toHaveValue("");
  await expect(page.getByLabel("Source of Complaint")).toHaveValue("");
  await expect(page.getByLabel("How it was Reported")).toHaveValue("");
});
