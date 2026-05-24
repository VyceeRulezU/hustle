# Payment integration principles — mapped to code

## 1. Trust boundaries between client and server

**Principle:** The browser (client) is an untrusted environment. Any data the browser sends can be tampered with. Treat all client input as potentially malicious until verified server-side.

**In this codebase:**

- **Client boundary:** `components/TipForm.tsx` collects name, email, amount, message. It sends these to the server but nothing is trusted from the client alone.
- **Server boundary:** `app/api/tip/initiate/route.ts` validates the input (amount >= 100, required fields present), creates a pending DB record, and initiates payment with Flutterwave. The amount used for payment is the server-side value, not blindly trusted from the client.
- **Verify boundary:** `app/api/tip/verify/route.ts` calls Flutterwave directly. The `transaction_id` from the URL is used only as a lookup key — the real verification comes from Flutterwave's API response.

**Key code:** `app/api/tip/verify/route.ts:63-82` — the server verifies amount, currency, and status from Flutterwave's response, not from the client's URL parameters.

---

## 2. Server-side verification as the only source of truth

**Principle:** A payment is not confirmed until your server calls the payment provider's verification API and gets a positive response. URL parameters, client-side booleans, and localStorage flags are all forgeable.

**In this codebase:**

```
Client URL has:  ?status=successful&transaction_id=12345
                                        |
                                        v
Server ignores `status` from URL, uses `transaction_id` to call:
  GET https://api.flutterwave.com/v3/transactions/12345/verify
                                        |
                                        v
Only the Flutterwave API response determines if the payment was real.
```

**Key code:** `lib/flutterwave.ts:43-55` — `verifyTransaction()` makes a server-to-server call with the secret key. The secret key (`FLUTTERWAVE_SECRET_KEY`) is never in client code.

**Idempotency check:** `app/api/tip/verify/route.ts:30-39` — before saving, the server checks if `flutterwaveTransactionId` already exists. This prevents double-crediting if the success page is refreshed.

---

## 3. Idempotency for repeated webhook or callback hits

**Principle:** If the same transaction notification arrives twice (network retry, user refreshes the page, webhook fires multiple times), the system should produce the same result as if it arrived once. Never double-credit.

**In this codebase:**

Two layers of idempotency:

1. **By Flutterwave transaction ID** — `app/api/tip/verify/route.ts:30-39`:
   ```ts
   const existing = await prisma.tip.findUnique({
     where: { flutterwaveTransactionId: transactionId },
   })
   if (existing) return existing  // already saved
   ```

2. **By `txRef` uniqueness** — The `txRef` column in the database has a `@unique` constraint. If somehow the same `txRef` is used twice, the database rejects the duplicate.

**Why this matters:** If the user refreshes the success page, the verify endpoint runs again. Without the idempotency check, it would create a duplicate `VERIFIED` tip record. The check at line 30 catches this before any write happens.

**Edge case covered:** Line 38 checks the existing record and returns it immediately — no second write, no double credit.

---

## 4. Separation of test and production keys

**Principle:** Never use test API keys in production or production keys in test. The codebase should make it impossible to confuse the two.

**In this codebase:**

- **Test keys:** Start with `FLWSECK_TEST-` and `FLWPUBK_TEST-`. The Flutterwave test mode dashboard generates these.
- **Production keys:** Start with `FLWSECK-` and `FLWPUBK-` (no `_TEST`). Generated from the live mode dashboard.
- **Environment variable names:** `FLUTTERWAVE_SECRET_KEY` and `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` — the same variable names work for both test and production. You switch by changing the value in `.env.local` (local dev) or the hosting platform's environment dashboard (production).

**The code never references "test" or "production"** — it just reads the env var. The separation happens at the deployment/infrastructure level:
- Local dev = `.env.local` with test keys
- Production = Netlify/ Vercel env vars with production keys

**Key guard:** `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY` is prefixed with `NEXT_PUBLIC_` — Next.js exposes this to the browser. `FLUTTERWAVE_SECRET_KEY` has no prefix — it's server-only. If someone accidentally pastes a `NEXT_PUBLIC_` key name in a server-only context (or vice versa), Next.js won't bundle it, providing a safety net.

---

## 5. Never logging or exposing secret keys

**Principle:** Secret keys must never appear in logs, error messages, client bundle, or version control.

**In this codebase:**

- **No console.log of the secret key** — `lib/flutterwave.ts` uses the key only in the `Authorization` header. It is never logged.
- **No error message includes the key** — Error handling in `app/api/tip/initiate/route.ts:64-69` returns a generic `"Failed to initiate payment"` message. The actual error is logged server-side with `console.error`, but no secret key value is included.
- **No `.env.local` in git** — The `.gitignore` file has `.env*` patterns to prevent accidental commits.
- **No client bundle exposure** — `FLUTTERWAVE_SECRET_KEY` is not prefixed with `NEXT_PUBLIC_`, so Next.js refuses to bundle it in client code. If any component tries to reference `process.env.FLUTTERWAVE_SECRET_KEY` in a client component, Next.js replaces it with `undefined` at build time.

**Verification:** Run `grep -r "FLWSECK" app/` to confirm no secret key literal exists in any source file. The only occurrence should be in `.env.local` (which is gitignored).
