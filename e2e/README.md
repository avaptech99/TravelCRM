# E2E suite (Playwright)

Real browser + real `main-2` deployment + real database. No mocks.

## Run

```bash
npx playwright install chromium   # one-time
E2E_BASE_URL=https://travel-crm-ca.vercel.app \
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... \
E2E_AGENT_A_EMAIL=... E2E_AGENT_A_PASSWORD=... E2E_AGENT_A_NAME="Agent Name" \
E2E_AGENT_B_EMAIL=... E2E_AGENT_B_PASSWORD=... E2E_AGENT_B_NAME="Agent Name" \
E2E_MISSED_CALL_UNIQUE_CODE=TW8601 \
npm run e2e
```

Without these env vars the suite skips (doesn't fail) -- see the header
comment in `missed-calls.spec.ts`.

`E2E_MISSED_CALL_UNIQUE_CODE` must point at a real, currently-unassigned
missed-call lead you're OK mutating (its status/assignment/comments will
change). This suite can't create one itself -- missed-call leads only come
from the GDMS webhook, and this suite has no GDMS credentials.
