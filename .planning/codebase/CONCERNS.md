# Concerns

## Technical Debt & Risks

### Security
- **CORS Configuration**: The backend currently allows all origins in production (`callback(null, true)`), which is a security risk.
- **Token Storage**: JWT tokens are stored in `localStorage`, making them vulnerable to XSS attacks.
- **Public Lead Endpoint**: The `/api/external/lead` endpoint is public; while protected by an API key, it lacks rate limiting and could be a target for spam or DoS.

### Testing & Quality
- **Zero Automated Tests**: There are no unit, integration, or E2E tests. This makes the codebase fragile to regressions during refactoring.
- **Error Handling**: While centralized, some controllers may still lack robust error catching, potentially leading to worker crashes.

### Performance
- **SSE Overhead**: While efficient, maintaining many open SSE connections requires careful server resource management, especially when using the `cluster` module.
- **Cache Warming**: The server warms caches on startup. If the database grows significantly, this could lead to slow startup times and potential timeouts on deployment platforms with strict health check limits.

### Architecture
- **Monorepo Structure**: The monorepo is managed with simple npm scripts and `concurrently`. As it grows, it might benefit from a more robust tool like `Turborepo` or `Nx`.
- **Database Schema**: The "segments" based schema is powerful but complex; ensuring data integrity across all parts of the app requires strict validation (currently handled by Zod).

## Outstanding Issues
- **Legacy Code**: Presence of multiple "WordPress integration" versions and migration scripts suggests a history of rapid evolution that might have left redundant code.
- **API Key Management**: API keys seem to be handled via environment variables, but a rotation or multi-key strategy is missing.
