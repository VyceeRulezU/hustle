# Security audit

## Q1: What if an attacker calls your success route directly with a fake transaction ID?

**Attack:** The attacker visits `/tip/victor-dev/success?transaction_id=FAKE999&status=successful`.

**What happens:**

1. The success page (`app/tip/[slug]/success/page.tsx`) is a server component. It receives the fake `transaction_id` and calls `getReceipt("FAKE999")` (line 67).
2. Inside `getReceipt`, it first checks if a tip with `flutterwaveTransactionId: "FAKE999"` exists (line 33-34). It doesn't, so it proceeds to verification.
3. It calls `verifyTransaction("FAKE999")` which makes a server-to-server GET to `https://api.flutterwave.com/v3/transactions/FAKE999/verify` (with the secret key).
4. Flutterwave's API returns `{ status: "error", message: "No transaction found" }` because `FAKE999` is not a real transaction.
5. The catch block in `getReceipt` (line 62-64) returns `{ error: "Verification failed" }`.
6. The page renders: "Verification failed — Transaction not found" (line 70-77).

**Result:** The attacker sees a failure screen. No tip is saved to the database. The dashboard is unaffected.

**Why this works:** The server never trusts the `transaction_id` from the URL — it only uses it to ask Flutterwave "is this real?" Flutterwave's API is the single source of truth.

---

## Q2: What if Flutterwave's callback fires twice (double-credit risk)?

**Scenario:** The user refreshes the success page, or Flutterwave's redirect fires twice, or a webhook is added later and fires concurrently with the redirect-based verification.

**Defense — idempotency check:** `app/api/tip/verify/route.ts:30-39`

```ts
const existing = await prisma.tip.findUnique({
  where: { flutterwaveTransactionId: transactionId },
})
if (existing) {
  // Already verified — return cached result, don't write again
  return { verified: true, tip: { ...existing } }
}
```

**Flow for a repeated call:**
1. First call: transaction ID not found in DB → calls Flutterwave verify API → checks pass → creates `VERIFIED` tip record.
2. Second call (refresh or duplicate callback): transaction ID IS found in DB → returns the existing record immediately → no DB write occurs.

**Additional defense — `@unique` constraint:** The `flutterwaveTransactionId` field in the Prisma schema has `@unique`. Even if the code somehow tried to insert a duplicate, the database would reject it with a constraint violation error.

**Result:** No double-credit, even under concurrent requests.

---

## Q3: Is the secret key ever exposed to the client bundle?

**No.** Two safeguards:

1. **Environment variable naming:** `FLUTTERWAVE_SECRET_KEY` has no `NEXT_PUBLIC_` prefix. Next.js enforces that only `NEXT_PUBLIC_*` variables are inlined into client code. Any reference to `process.env.FLUTTERWAVE_SECRET_KEY` in a client component evaluates to `undefined` at build time.

2. **Server-only usage:** The secret key is only used in:
   - `lib/flutterwave.ts` — called only from server API routes (`/api/tip/initiate`, `/api/tip/verify`) and server components (`/tip/[slug]/success`)
   - `app/api/tip/initiate/route.ts` — POST handler, server-only
   - `app/api/tip/verify/route.ts` — GET handler, server-only

**Verification:** Search the built client bundle for `FLWSECK`. It will not be present. The only place the key exists is in `.env.local` (gitignored) and the deployment environment variables dashboard.

---

## Q4: What if the verify API call fails?

**Scenario:** The Flutterwave verify endpoint is down, the server has a network error, or the request times out.

**What happens:** `app/tip/[slug]/success/page.tsx` wraps the verify call in a try-catch (line 62-64):

```ts
try {
  const flwData = await verifyTransaction(txId)
  // ... verification logic ...
} catch {
  return { creator: null, tip: null, error: "Verification failed" }
}
```

The catch block returns an error result. The success page renders:

> **Verification failed** — Verification failed

**The PENDING tip remains in the database** with status `PENDING`. It does not become `VERIFIED` and does not appear in dashboard totals (which filter by `status: "VERIFIED"`).

**Recovery:** The PENDING record can be retried. A future enhancement would add a webhook endpoint that catches these: when Flutterwave's webhook fires with a successful status, the server verifies and updates the tip even if the redirect-based verification failed.

**Current state:** No money is lost. The creator doesn't see unverified tips in their totals. The fan sees an error page but their payment went through on Flutterwave's side. The tip is stuck in PENDING until the creator manually reconciles or a webhook is added.

---

## Q5: Are amounts validated server-side or only on the client?

**Server-side validation is the only validation that matters.** The client-side validation is convenience, not security.

**Client-side (`components/TipForm.tsx`):**
- `<input type="number" min={100}>` — HTML attribute, trivially bypassed by removing the attribute or sending a direct API request.

**Server-side (`app/api/tip/initiate/route.ts:17-21`):**
```ts
if (amount < 100) {
  return NextResponse.json(
    { error: "Minimum tip is ₦100" },
    { status: 400 }
  )
}
```

**Verification (`app/api/tip/verify/route.ts:63-82`):**
```ts
if (flwData.amount < pendingTip.amount) {
  return { verified: false, error: "Amount mismatch" }
}
```

Even if an attacker bypasses the client form and sends `amount: 1` directly to `/api/tip/initiate`, the server rejects it. And even if they somehow initiate a pending tip with amount 1, the verification step checks that the amount Flutterwave actually charged (`flwData.amount`) is at least the expected amount (`pendingTip.amount`).

**Attack scenario:** Attacker intercepts the POST to `/api/tip/initiate` and changes `amount: 5000` to `amount: 50`.
- Server validates `50 < 100` → returns 400 error.
- Payment is never initiated.

**Attack scenario 2:** Attacker changes `amount: 5000` to `amount: 5000` (leaves it alone) but expects to pay less.
- Payment is initiated for ₦5000.
- Flutterwave charges ₦5000.
- Verify step checks `flwData.amount >= 5000` → passes.
- Attacker paid ₦5000.

**Result:** Amount manipulation is not possible. The server validates every input, and Flutterwave's API response is the final check.
