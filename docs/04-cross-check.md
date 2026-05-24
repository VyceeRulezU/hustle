# Cross-check for AI models

> Take this code to a different AI model and ask: **"How could an attacker complete a tip on the dashboard without actually paying?"**

Below are the attack surfaces we identified. If the model you ask finds something not on this list, it's a genuine finding that needs fixing.

---

## Attack surface 1: Fake success URL

**Vector:** Call `/tip/[slug]/success?transaction_id=FAKE&status=successful`

**Why it fails:** The success page is a server component (`app/tip/[slug]/success/page.tsx`). It calls Flutterwave's verify API with the transaction ID. Flutterwave responds with "transaction not found" for fake IDs. The page shows an error. No VERIFIED tip is created.

**Escalation:** What if the attacker finds a real `transaction_id` from another creator's payment? They could guess or scrape it.
- **Defense:** The verify endpoint checks that the `tx_ref` from Flutterwave's response matches a pending tip belonging to the requesting creator's slug. If the transaction ID belongs to a different creator's tip, the `tx_ref` lookup fails and verification is rejected.

---

## Attack surface 2: Modify the initiate request

**Vector:** Intercept `POST /api/tip/initiate` and change `creatorSlug` to redirect payment to the attacker's own tip page.

**Why partially works:** The attacker could change `creatorSlug` to their own slug. The payment would be initiated, Flutterwave would charge the fan, and the verify step would credit the attacker's account.

**Defense:** The fan is paying through Flutterwave's hosted checkout. Flutterwave shows the payment recipient's name (`customizations.title: "Tip [CreatorName]"`). A vigilant fan would notice the name doesn't match.

**Limitation:** This is a social defense, not a technical one. The real fix would be to sign the initiate request or use Flutterwave's subaccount feature to lock payouts.

---

## Attack surface 3: Replay a real transaction ID

**Vector:** After a legitimate tip is paid, the attacker notes the `transaction_id` from the success URL. They try to call the success page again with the same ID (page refresh).

**Why it fails (idempotency):** `app/api/tip/verify/route.ts:30-39` checks if `flutterwaveTransactionId` already exists in the database. On the second call, it returns the existing record without creating a new one.

**Escalation:** What if the attacker calls verify with the same `transaction_id` but a different `slug`?
- The check first looks up the creator by `slug`. If the slug doesn't match the original creator, the `tx_ref` from Flutterwave's response won't match any pending tip for that creator, so verification fails.
- The `flutterwaveTransactionId` uniqueness check happens early, but the creator lookup prevents cross-creator replay.

---

## Attack surface 4: Tamper with the PENDING tip amount

**Vector:** After `POST /api/tip/initiate` creates a PENDING tip with amount ₦5000, the attacker modifies the database (if they have access) to change the PENDING tip's amount to ₦50 before verification runs.

**Why partially works:** The verify step (`app/api/tip/verify/route.ts:63-82`) checks `flwData.amount >= pendingTip.amount`. If the attacker lowered `pendingTip.amount` to 50, and Flutterwave actually charged ₦5000, then `5000 >= 50` is true.

**Defense:** This requires database access, which means the attacker already has a severe breach. If they have DB access, they can mark tips as VERIFIED directly without going through the verify endpoint.

**Mitigation:** The `txRef` field is `@unique` and includes a random suffix. An attacker with read-only DB access (e.g., SQL injection) could guess or enumerate txRefs, but this is a compromised-database scenario beyond this app's threat model.

---

## Attack surface 5: Man-in-the-middle on Flutterwave redirect

**Vector:** An attacker intercepts the redirect from Flutterwave back to your app and captures the `transaction_id`. They could try to use it before the legitimate verification completes.

**Why it fails (idempotency + ordering):** The check `flutterwaveTransactionId` in step 1 prevents the same transaction from being saved twice. The first call (attacker or legitimate) completes verification. The second call returns the cached result.

**Race condition risk:** If both calls arrive simultaneously, both pass the `findUnique` check before either writes. The second write would fail due to the `@unique` constraint on `flutterwaveTransactionId` in the database, throwing an error. One succeeds, one fails. No double-credit.

---

## Attack surface 6: Modify the Flutterwave verify API response

**Vector:** Attacker performs a man-in-the-middle attack between your server and `api.flutterwave.com`.

**Why it fails (HTTPS):** The API call uses HTTPS with TLS encryption. The `Authorization: Bearer` header and response body are encrypted. A MITM would need a valid certificate for `api.flutterwave.com`, which is practically impossible without compromising a certificate authority.

**If HTTPS is somehow bypassed:** The server would receive a forged response. Flutterwave's verify response includes `status`, `amount`, `currency`, `tx_ref`. The attacker would need to forge ALL of these to match a real PENDING tip. The `tx_ref` includes a random component that is unpredictable.

---

## Summary for the AI model

If the model finds:
1. A way to mark a tip as VERIFIED without a real Flutterwave charge
2. A way to double-credit from a single payment
3. A way to access the secret key from the client bundle
4. A way to bypass amount validation server-side

These are critical findings. Everything else is defense-in-depth.
