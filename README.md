# Wasil Oman · واصل عُمان

Bulk WhatsApp marketing and auto-reply bots for businesses in Oman. It uses the **official WhatsApp Cloud API**, and the setup follows the same flow as WANotifier.

**What it does**

- **Connect with Facebook**: a one-click WhatsApp Embedded Signup. There is also a manual setup option for developers.
- **Contacts**: import from Excel/CSV and organise them with tags. Omani numbers like `91234567` are fixed automatically. Customers can reply STOP / إيقاف to unsubscribe.
- **Message Templates**: build a template with a live WhatsApp preview and submit it to Meta for approval. Supports image headers, variables and buttons.
- **Bulk Send**: a 4-step wizard (message → audience → personalise → send now or schedule). It shows live sent, delivered, read and failed counts, and you can export the results to CSV.
- **Inbox**: a live shared inbox. You can reply freely within WhatsApp's 24-hour window.
- **Auto-Reply Bots**: a drag-and-drop flow builder. It has keyword triggers, buttons and menus, questions that save answers, tags, and handover to staff. Ready-made starters are included.
- **Arabic and English** throughout, with full RTL support.

Stack: Next.js 15 (App Router) · Supabase (Auth + Postgres + Realtime) · Vercel.

---

## Setup (about 20 minutes, one time only)

### 1. Supabase
1. Open your Supabase project → **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
2. Go to **Authentication → URL Configuration** and set **Site URL** to your Vercel URL (e.g. `https://wasiloman.vercel.app`).
3. Go to **Project Settings → API** and copy the `service_role` key. You'll need it in step 3.

### 2. Meta (Facebook) app: needed for “Connect with Facebook”
1. Go to [developers.facebook.com](https://developers.facebook.com) → **Create app** → type **Business** → add the **WhatsApp** product.
2. Go to **App settings → Basic** and copy the **App ID** and **App Secret**. Add your Vercel domain to **App domains**.
3. Go to **Facebook Login for Business → Configurations → Create configuration**, choose **WhatsApp Embedded Signup**, and copy the **Configuration ID**.
4. Go to **Facebook Login for Business → Settings** and add your Vercel URL to *Allowed domains for the JavaScript SDK*.
5. Go to **WhatsApp → Configuration → Webhook** and enter:
   - Callback URL: `https://YOUR-DOMAIN/api/webhook`
   - Verify token: the same text you put in `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the **messages** field
6. To let other businesses (your customers) connect their own numbers, complete **Business verification** and **App review** for `whatsapp_business_management` + `whatsapp_business_messaging`. You must also become a Meta **Tech Provider**. Until then, only admins and testers of the app can connect.

### 3. Vercel environment variables
Add these in Vercel → Project → **Settings → Environment Variables**, then redeploy:

| Name | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role, keep secret) |
| `NEXT_PUBLIC_META_APP_ID` | Meta app → Basic |
| `META_APP_SECRET` | Meta app → Basic |
| `NEXT_PUBLIC_META_CONFIG_ID` | Embedded Signup configuration |
| `META_GRAPH_VERSION` | e.g. `v23.0` |
| `WHATSAPP_VERIFY_TOKEN` | any text you choose |
| `CRON_SECRET` | any long random text |

### 4. Scheduled broadcasts (optional but recommended)
The Vercel Hobby plan only allows a daily cron. For scheduled messages to go out on time, run this once in the Supabase SQL editor. It calls the sender every minute:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('wasil-broadcasts', '* * * * *', $$
  select net.http_get(
    url := 'https://YOUR-DOMAIN/api/cron/broadcasts',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
$$);
```

---

## Local development
```bash
cp .env.example .env.local   # fill in values
npm install
npm run dev
```

## How it works (for developers)
- `app/api/whatsapp/connect`: exchanges the Embedded Signup code for a token, subscribes the app to the WABA, and registers the number.
- `app/api/webhook`: receives messages and delivery receipts, handles STOP/START, and runs bots (`lib/flow-engine.ts`).
- `lib/broadcast.ts`: sends template messages in batches and keeps going via `/resume` and the cron.
- Every table uses Row Level Security, so each user only sees their own data. Access tokens are never sent to the browser.
