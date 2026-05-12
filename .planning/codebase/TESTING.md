# Testing

## Current Status
Automated testing coverage is currently **minimal to non-existent**. The project relies heavily on manual verification and data-driven scripts.

## Testing Methodologies

### Manual Verification
- Testing is performed by running the application locally (`npm run dev`) and verifying UI/API behavior.
- Frontend testing involves checking responsive designs and form submissions.

### Data Validation
- **Migration Scripts**: The `migration script/` directory contains `verifyMigration.js`, which serves as a post-migration audit tool.
- **Seeding**: `src/seed.ts` is used to populate the database with known states for development and testing.

### API Testing
- No Postman/Insomnia collections found in the repository.
- No automated integration tests for Express routes.

## Recommended Improvements
1. **Unit Testing**: Implement `Vitest` for the frontend and `Jest` for the backend.
2. **E2E Testing**: Add `Playwright` or `Cypress` for critical user flows (e.g., Lead creation, Login).
3. **API Documentation**: Integrate `Swagger/OpenAPI` to document and test endpoints.
4. **CI/CD Integration**: Run linting and (future) tests on every pull request.
