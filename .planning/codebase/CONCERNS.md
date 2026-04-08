# Project Concerns & Technical Debt

This document highlights known issues, architectural concerns, and areas for improvement in the Travel CRM codebase.

## 🧪 Testing Gaps
- **No Automated Tests**: The lack of Jest/Vitest/Playwright tests increases the risk of regression during refactoring.
- **Manual Verification**: High reliance on manual testing slows down the development cycle and reduces confidence in complex logic (e.g., AI extraction).

## 🗄️ Database & Environment
- **Schema Evolution**: As more travel data points are extracted (e.g., airline, hotel name), the current Booking model may need restructuring to avoid over-nesting or repetitive data.
- **Connection Logic**: Verify that all database and service connections use `.env` consistently to prevent hardcoded secrets.

## 🌐 WordPress & Third-Party Scripts
- **Security Check**: The PHP integration scripts (`wordpress_integration_*.php`) should be audited for potential security vulnerabilities (SQL injection, XSS) and proper CSRF protection.
- **Sync Reliability**: Ensure error handling is robust when syncing data between WordPress and the CRM to prevent data loss or drift.

## 🤖 AI Extraction Logic
- **Complexity**: The current heuristic and regex-based approach in `extractTravelInfo.ts` may become difficult to maintain as more travel scenarios are added.
- **Accuracy**: NLP extraction is probabilistic; there should be a clear "manual verification" UI for users to confirm extracted data.

## 🎨 UI & UX
- **Performance**: Monitor dashboard table performance as the booking volume grows (large datasets in TanStack Table).
- **Mobile Experience**: While Tailwind is used, ensuring a fully responsive experience across all complex forms (like "Finalize Booking") is critical.
