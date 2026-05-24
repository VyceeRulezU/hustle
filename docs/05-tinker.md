# Tinker test: Bypass server-side verification

## Setup

On your local copy, deliberately remove the server-side verification step in the success route. This is a test — do not commit this change.

---

## Step 1 — Remove verification

In `app/tip/[slug]/success/page.tsx`, modify `getReceipt()` to skip the Flutterwave verify call and always return success:

```ts
async function getReceipt(txId: string) {
  const creator = await prisma.user.findUnique({
    where: { slug },
    select: { displayName: true },
  })
  if (!creator) notFound()

  // ⚠️ REMOVED: Flutterwave verification call
  // Directly save as VERIFIED without checking with Flutterwave

  const tip = await prisma.tip.create({
    data: {
      creatorId: creator.id,
      tipperName: "Fake Tipper",
      tipperEmail: "fake@example.com",
      amount: 1000000,
      txRef: `fake-${Date.now()}`,
      flutterwaveTransactionId: txId,
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  })

  return { creator: creator.displayName, tip, error: null }
}
```

---

## Step 2 — Exploit

1. Visit: `http://localhost:3000/tip/victor-dev/success?transaction_id=INVENTED&status=successful`
2. The page shows: **"Tip sent!"** — a receipt for ₦1,000,000 from "Fake Tipper"
3. No payment was made. No Flutterwave API was called. `transaction_id=INVENTED` is a made-up string.

---

## Step 3 — Impact on dashboard

Visit `/dashboard` (as the creator). The page now shows:

- **Total earned:** ₦1,000,000
- **Tips received:** 1
- **Recent tips:** Fake Tipper — ₦1,000,000
- **Message wall:** empty

The creator believes they received ₦1,000,000. In reality, they received nothing.

---

## What an attacker could do with this

Without server-side verification:

1. **Inflate earnings:** An attacker (or a dishonest creator) could call the success URL with any transaction ID to create fake tips. The dashboard would show inflated earnings.

2. **Social engineering:** A fake tipper could send a creator a link to their "receipt" screenshot, claiming they paid. The creator checks their dashboard and sees the fake entry. Without verification, there's no way to distinguish real from fake.

3. **Unlimited fake tips:** An attacker could script thousands of calls with different `transaction_id` values, creating millions in fake tips. The dashboard becomes useless — the creator can't tell which tips are real.

---

## Step 4 — Restore verification

Put the verification code back. The critical lines in `app/tip/[slug]/success/page.tsx` are:

```ts
const flwData = await verifyTransaction(txId)

// Validate ALL of these before saving:
flwData.status === "successful"
flwData.currency === "NGN"
flwData.amount >= pendingTip.amount
flwData.tx_ref === pendingTip.txRef
```

With verification restored:
- Fake transaction IDs fail: Flutterwave says "transaction not found"
- The success page shows an error
- No VERIFIED tip is created
- The dashboard stays accurate

---

## Key takeaway

This test demonstrates why the `FLUTTERWAVE_SECRET_KEY` must never be exposed to the client and why every single tip must be verified server-to-server with Flutterwave's API. The browser (and anything that runs in it) cannot be trusted. The only difference between a real receipt and a fake one is a single API call that only your server can make.

**The most important line in the codebase:**

```ts
// lib/flutterwave.ts
const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
  headers: { Authorization: `Bearer ${FLW_SECRET}` },
})
```

Without this line (or with it bypassed), the entire payment system is a lie.
