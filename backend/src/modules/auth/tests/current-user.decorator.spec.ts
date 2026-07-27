import { ExecutionContext } from "@nestjs/common";
import { CURRENT_USER_FACTORY } from "../decorators/current-user.decorator";

describe("CurrentUser Decorator", () => {
  it("should return null if user is not present on request object", () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    const result = CURRENT_USER_FACTORY(undefined, mockExecutionContext);
    expect(result).toBeNull();
  });

  it("should return full user object if no property key specified", () => {
    const mockUser = {
      id: "user-123",
      email: "alex@example.com",
      role: "USER",
    };
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as ExecutionContext;

    const result = CURRENT_USER_FACTORY(undefined, mockExecutionContext);
    expect(result).toEqual(mockUser);
  });

  it("should return specific user property if key is passed", () => {
    const mockUser = {
      id: "user-123",
      email: "alex@example.com",
      role: "USER",
    };
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as ExecutionContext;

    const result = CURRENT_USER_FACTORY("email", mockExecutionContext);
    expect(result).toBe("alex@example.com");
  });
});
