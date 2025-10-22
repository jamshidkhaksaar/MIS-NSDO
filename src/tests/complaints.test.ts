import { POST } from "@/app/api/complaints/route";
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";
import * as authServer from "@/lib/auth-server";

jest.mock("@/lib/dashboard-repository", () => ({
  insertComplaint: jest.fn(),
}));

jest.mock("@/lib/auth-server", () => ({
  requireUserSession: jest.fn(),
}));

describe("/api/complaints", () => {
  it("should return a 201 status code when a complaint is successfully recorded", async () => {
    (authServer.requireUserSession as jest.Mock).mockResolvedValueOnce({
      id: "test-user-id",
    });
    const requestBody = {
      fullName: "Test User",
      email: "test@example.com",
      message: "This is a test complaint.",
    };
    const request = new NextRequest("http://localhost/api/complaints", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
