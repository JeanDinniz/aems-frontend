# AEMS Frontend - Testing Quick Reference

## Quick Start

```bash
# Run all tests
npm test -- --run

# Watch mode (recommended for development)
npm test

# Run with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

## Running Specific Tests

```bash
# Run single file
npm test -- src/services/api/__tests__/auth.service.test.ts

# Run all service tests
npm test -- src/services/api/__tests__/

# Run all hook tests
npm test -- src/hooks/__tests__/

# Run tests matching pattern
npm test -- --grep "login"
npm test -- --grep "service.*create"
```

## Test Structure

### Service Tests Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { yourService } from '../your.service';
import apiClient from '../client';

describe('yourService', () => {
    beforeEach(() => {
        // Set auth token for MSW
        apiClient.defaults.headers.common['Authorization'] = 'Bearer mock-token';
    });

    it('should perform operation successfully', async () => {
        // Arrange
        const testData = { /* ... */ };

        // Act
        const result = await yourService.operation(testData);

        // Assert
        expect(result).toBeDefined();
        expect(result.property).toBe(expectedValue);
    });
});
```

### Hook Tests Pattern

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useYourHook } from '../useYourHook';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('useYourHook', () => {
    it('should fetch data successfully', async () => {
        const { result } = renderHook(() => useYourHook(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toBeDefined();
    });
});
```

## MSW Handler Pattern

```typescript
// In src/__mocks__/handlers.ts
http.post(`${API_URL}/your-endpoint`, async ({ request }) => {
    const body = await request.json();

    // Validate
    if (!body.required_field) {
        return HttpResponse.json(
            { detail: 'Field required' },
            { status: 400 }
        );
    }

    // Success response
    return HttpResponse.json({
        id: 1,
        ...body,
        created_at: new Date().toISOString(),
    }, { status: 201 });
}),
```

## Common Testing Patterns

### 1. Testing Async Operations

```typescript
it('should handle async operation', async () => {
    const result = await service.asyncOperation();

    await waitFor(() => {
        expect(result.isComplete).toBe(true);
    }, { timeout: 5000 });
});
```

### 2. Testing Mutations

```typescript
it('should create resource', async () => {
    const { result } = renderHook(() => useCreateResource(), {
        wrapper: createWrapper(),
    });

    result.current.mutate(newResourceData);

    await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
});
```

### 3. Testing Error States

```typescript
it('should handle errors', async () => {
    // Remove auth to trigger 401
    delete apiClient.defaults.headers.common['Authorization'];

    const { result } = renderHook(() => useYourHook(), {
        wrapper: createWrapper(),
    });

    await waitFor(() => {
        expect(result.current.isError).toBe(true);
    });

    // Restore auth
    apiClient.defaults.headers.common['Authorization'] = 'Bearer mock-token';
});
```

### 4. Testing Filters

```typescript
it('should filter by criteria', async () => {
    const filters = {
        status: 'active',
        store_id: 1,
    };

    const response = await service.getAll(filters);

    expect(response.items).toBeDefined();
    response.items.forEach(item => {
        expect(item.status).toBe('active');
        expect(item.store_id).toBe(1);
    });
});
```

### 5. Testing Business Rules

```typescript
it('should validate business rule', async () => {
    const invalidData = {
        quantity: -1, // Should be positive
    };

    await expect(service.create(invalidData)).rejects.toThrow();
});
```

## Debugging Tests

### View MSW Handlers

```typescript
import { server } from '@/__mocks__/server';

// In your test
server.printHandlers();
```

### Log Query State

```typescript
import { queryClient } from './wrapper';

// Check cached data
console.log(queryClient.getQueryData(['your-key']));

// Check all queries
console.log(queryClient.getQueryCache().getAll());
```

### Wait for Conditions

```typescript
// Wait for specific condition
await waitFor(() => {
    expect(result.current.data).toBeDefined();
}, { timeout: 5000, interval: 100 });

// Wait for element
await waitFor(() => {
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Debug Hook State

```typescript
it('should update state', async () => {
    const { result, rerender } = renderHook(() => useYourHook());

    console.log('Initial:', result.current);

    act(() => {
        result.current.someAction();
    });

    console.log('After action:', result.current);
});
```

## Mock Data Reference

### Available Mock Users

```typescript
// Operator - store_id: 1
email: 'test@example.com'
password: 'password123'
role: 'operator'

// Supervisor - supervised_store_ids: [1, 2]
email: 'supervisor@example.com'
password: 'password123'
role: 'supervisor'

// Owner - all stores
email: 'owner@example.com'
password: 'password123'
role: 'owner'
```

### Mock Service Orders

- ID 1: Film department, waiting status, plate ABC1D23
- ID 2: Esthetics department, in_progress, plate XYZ9W87

### Mock Film Bobbins

- ID 1: Active, FUM35, 25.3m remaining, 92.5% yield
- ID 2: Low stock, FUM70, 5.2m remaining, 88.1% yield

### Mock Purchase Requests

- ID 1: Pending supervisor, film category, normal urgency
- ID 2: Approved supervisor, esthetics category, urgent

## Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# Open coverage in browser
# Report will be in coverage/index.html
```

## CI/CD Integration

```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --run
      - run: npm run test:coverage
```

## Best Practices

### DO ✅

1. **Isolate Tests**: Each test should be independent
2. **Use Descriptive Names**: `should create service order with valid data`
3. **Test Both Paths**: Success and error scenarios
4. **Clean Up**: Use beforeEach/afterEach for setup/teardown
5. **Wait for Async**: Always use waitFor for async operations
6. **Mock Realistically**: Use data that matches production
7. **Test Business Rules**: Validate domain logic
8. **Use TypeScript**: Type your test data

### DON'T ❌

1. **Don't Test Implementation**: Test behavior, not internals
2. **Don't Share State**: Avoid dependencies between tests
3. **Don't Skip Cleanup**: Always reset mocks and state
4. **Don't Hardcode Delays**: Use waitFor instead of setTimeout
5. **Don't Test Libraries**: Focus on your code, not React Query
6. **Don't Ignore Warnings**: Fix console warnings and errors
7. **Don't Mock What You Own**: Use real code when possible
8. **Don't Over-Mock**: Only mock external dependencies

## Troubleshooting

### Test Timeouts

```typescript
// Increase timeout for slow tests
it('slow operation', async () => {
    // ...
}, 10000); // 10 second timeout

// Or use waitFor with timeout
await waitFor(() => {
    expect(condition).toBe(true);
}, { timeout: 10000 });
```

### MSW Not Working

```typescript
// Verify in setup.ts
beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
    server.resetHandlers();
});

afterAll(() => {
    server.close();
});
```

### Type Errors

```typescript
// Cast mock data if needed
const mockData = {
    id: 1,
    name: 'Test',
} as YourType;

// Or use type assertion
const result = await service.get() as ExpectedType;
```

### Flaky Tests

```typescript
// Add retry logic
it('flaky test', async () => {
    // ...
}, { retry: 3 });

// Or increase timeout
await waitFor(() => {
    expect(condition).toBe(true);
}, { timeout: 5000, interval: 200 });
```

## Adding New Tests

### 1. Service Test

```bash
# Create test file
touch src/services/api/__tests__/your-service.test.ts
```

```typescript
// Template
import { describe, it, expect, beforeEach } from 'vitest';
import { yourService } from '../your-service';
import apiClient from '../client';

describe('yourService', () => {
    beforeEach(() => {
        apiClient.defaults.headers.common['Authorization'] = 'Bearer mock-token';
    });

    describe('operation', () => {
        it('should succeed with valid input', async () => {
            // Test implementation
        });

        it('should fail with invalid input', async () => {
            // Test implementation
        });
    });
});
```

### 2. Hook Test

```bash
# Create test file
touch src/hooks/__tests__/useYourHook.test.tsx
```

```typescript
// Template
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from './test-utils'; // Create this helper
import { useYourHook } from '../useYourHook';

describe('useYourHook', () => {
    it('should fetch data', async () => {
        const { result } = renderHook(() => useYourHook(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });
    });
});
```

### 3. MSW Handler

```typescript
// In src/__mocks__/handlers.ts
http.method(`${API_URL}/your-endpoint`, async ({ request, params }) => {
    // Extract data
    const body = await request.json();
    const { id } = params;

    // Validate
    if (/* validation */) {
        return HttpResponse.json(
            { detail: 'Error message' },
            { status: 400 }
        );
    }

    // Success
    return HttpResponse.json(responseData, { status: 200 });
}),
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)

---

**Last Updated:** 2026-02-11
**Maintained By:** Development Team
