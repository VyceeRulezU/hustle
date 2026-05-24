# How the payment flows — ELI7

Imagine you run a small shop. Someone wants to give you money. You don't take cash — you point them to a machine that accepts cards. The machine prints a receipt. Later you count the drawer to make sure the receipt matches real money. This project does exactly that, but for creator tips.

---

## 1. How the payment is initiated

A fan visits `/tip/[creator-slug]` and fills a form: their name (optional), email, amount in Naira, and a message (optional). They click **Send Tip**.

Your browser sends a POST request to `/api/tip/initiate` with that data.

The server does three things:

1. **Looks up the creator** by their unique slug (e.g. `victor-dev`). If the slug doesn't exist, it returns 404.
2. **Creates a PENDING tip record** in the database. It generates a unique reference (`txRef`) like `tip-1719000000-a1b2c3`. This is our "parking spot" — we reserved it, but no money has arrived yet.
3. **Calls Flutterwave's API** with your secret key. It sends the amount, currency (`NGN`), the fan's email, and a `redirect_url` (where Flutterwave should send the browser after payment).

Flutterwave responds with a `checkoutUrl` — a link to their hosted payment page. The server sends this URL back to the browser. The browser redirects to Flutterwave's page where the fan enters their card details and pays.

**Why this matters:** The secret key never touches the browser. The fan never sees it. If an attacker inspects the network tab, they only see the checkout URL, not the key that authorizes payments.

---

## 2. Where the user gets redirected and why

After the fan completes payment on Flutterwave's site, Flutterwave redirects the browser to:

```
/tip/[slug]/success?transaction_id=1234567&status=successful&tx_ref=tip-1719000000-a1b2c3
```

The fan's browser lands on this URL automatically. They see a receipt page.

**Why redirect?** Flutterwave can't send data to your server directly from the browser (that's what webhooks are for). The redirect is the only way for the browser to carry the payment result back to your app. Think of it like: the fan paid at the checkout counter, and the cashier hands them a receipt and says "take this to the customer service desk."

**The critical point:** These query parameters (`status=successful`) are attached to the URL in the browser. They are public. Anyone can type this URL. That's why step 3 exists.

---

## 3. How the server verifies the transaction

The success page is a **server component** — it runs on your server, not in the browser. It calls an internal function that:

1. Takes the `transaction_id` from the URL.
2. Calls Flutterwave's verification API:  
   `GET https://api.flutterwave.com/v3/transactions/{id}/verify`  
   This request uses the **secret key** (never exposed to the client).
3. Flutterwave responds with the real transaction data: actual amount charged, currency, status, and the `tx_ref` that matches our pending record.
4. The server checks ALL of these before saving:
   - `status === "successful"` — Flutterwave confirmed the payment went through
   - `currency === "NGN"` — the payment was in the right currency
   - `amount >= expectedAmount` — the fan paid at least what we expected (could be more due to fees)
   - `tx_ref` matches a pending record in our database

5. Only if all checks pass, the tip record is updated from `PENDING` to `VERIFIED`, and the Flutterwave transaction ID is stored.

**Why this matters:** Even if someone fakes the URL, the verification call goes directly to Flutterwave's servers using your secret key. Flutterwave will tell you "this transaction ID doesn't exist" or "this payment failed."

---

## 4. Why client-side success messages must never be trusted alone

The URL `?status=successful&transaction_id=FAKE123` can be typed by anyone. If we checked `status === "successful"` in the browser and showed a receipt, an attacker could:

1. Visit any creator's success page with `?status=successful&transaction_id=FAKE`
2. The browser would show "Tip sent!" and a receipt
3. The creator would see $0 in their dashboard (because the verify endpoint would reject it)
4. But the attacker could screenshot the receipt and claim they paid

If the dashboard also trusted client-side data, the creator might think they received money they never got.

**The rule:** The browser is an untrusted environment. Any data from the URL bar, localStorage, or network responses can be forged. The only source of truth is a server-to-server call to Flutterwave's API using the secret key.

---

## Summary diagram

```
Fan fills form → POST /api/tip/initiate
                   ├─ Look up creator
                   ├─ Create PENDING tip in DB (txRef)
                   └─ POST to Flutterwave API (secret key)
                        → returns checkoutUrl

Browser redirects to Flutterwave checkout
  → Fan pays
  → Flutterwave redirects to /tip/[slug]/success?transaction_id=X&status=successful

Success page (server component)
  ├─ GET /api/tip/verify?transaction_id=X&slug=Y
  │     ├─ GET https://api.flutterwave.com/v3/transactions/X/verify (secret key)
  │     ├─ Check: status, currency, amount, tx_ref match
  │     └─ Update tip to VERIFIED in DB
  └─ Show receipt only if verified
```

Three things never happen in this project:
- The secret key never enters the browser bundle
- A tip is never marked VERIFIED without Flutterwave confirming it
- The dashboard never shows unverified tips in totals
