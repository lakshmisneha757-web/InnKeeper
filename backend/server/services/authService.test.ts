import { describe, expect, it } from "vitest";
import { buildPublicUser, isStrongPassword, normalizeRole } from "./authService";

describe("authService", () => {
  it("normalizes supported roles", () => {
    expect(normalizeRole("Manager")).toBe("manager");
    expect(normalizeRole("housekeeping")).toBe("housekeeping");
  });

  it("exposes a public-safe user payload", () => {
    const user = buildPublicUser({
      id: "user-1",
      email: "frontdesk@example.com",
      name: "Ava",
      role: "receptionist",
      passwordHash: "secret",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    expect(user).toMatchObject({
      id: "user-1",
      email: "frontdesk@example.com",
      role: "receptionist",
    });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("accepts strong passwords and rejects weak ones", () => {
    expect(isStrongPassword("P@ssw0rd123")).toBe(true);
    expect(isStrongPassword("weakpass")).toBe(false);
    expect(isStrongPassword("12345678")).toBe(false);
  });
});
