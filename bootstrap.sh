#!/bin/bash
# bootstrap.sh - Psycle課金バックエンド最小構成（Next.js App Router + Stripe + Supabase）

set -euo pipefail

PROJECT_NAME="psycle-billing"

echo "▶︎ Next.jsプロジェクト作成: $PROJECT_NAME"
npx create-next-app@latest "$PROJECT_NAME" \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-git \
  --yes

cd "$PROJECT_NAME"

echo "▶︎ 依存パッケージインストール"
npm install stripe @supabase/supabase-js

echo "▶︎ ディレクトリ作成"
mkdir -p app/api/create-checkout-session
mkdir -p app/api/stripe-webhook
mkdir -p app/api/portal
mkdir -p lib

echo "▶︎ ファイル生成中..."

# ==============================================================================
# app/api/create-checkout-session/route.ts
# ==============================================================================
cat > app/api/create-checkout-session/route.ts <<'CHECKOUT_EOF'
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });

export async function POST(req: NextRequest) {
  try {
    const { plan, uid, email } = await req.json();
    if (!plan || !uid || !email) {
      return NextResponse.json({ error: "Missing plan, uid, or email" }, { status: 400 });
    }

    const priceId = plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_MAX;
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // 既存Customer取得 or 作成
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customer: Stripe.Customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({ email, metadata: { uid } });
    }

    // Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "https://app.psycle.app/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://app.psycle.app/cancel",
      metadata: { uid, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("create-checkout-session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
CHECKOUT_EOF

# ==============================================================================
# app/api/stripe-webhook/route.ts
# ==============================================================================
cat > app/api/stripe-webhook/route.ts <<'WEBHOOK_EOF'
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(Buffer.from(rawBody), signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid;
        const plan = session.metadata?.plan;
        if (!uid || !plan) break;

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const activeUntil = new Date(subscription.current_period_end * 1000).toISOString();

        await supabaseAdmin.from("profiles").upsert({
          id: uid,
          email: session.customer_details?.email,
          plan,
          active_until: activeUntil,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const uid = (customer as Stripe.Customer).metadata?.uid;
        if (!uid) break;

        const activeUntil = new Date(subscription.current_period_end * 1000).toISOString();
        await supabaseAdmin.from("profiles").update({ active_until: activeUntil }).eq("id", uid);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const uid = (customer as Stripe.Customer).metadata?.uid;
        if (!uid) break;

        await supabaseAdmin.from("profiles").update({ plan: "free", active_until: null }).eq("id", uid);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
WEBHOOK_EOF

# ==============================================================================
# app/api/portal/route.ts
# ==============================================================================
cat > app/api/portal/route.ts <<'PORTAL_EOF'
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: "https://app.psycle.app/settings",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("portal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
PORTAL_EOF

# ==============================================================================
# lib/supabaseAdmin.ts
# ==============================================================================
cat > lib/supabaseAdmin.ts <<'SUPABASE_EOF'
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
SUPABASE_EOF

# ==============================================================================
# .env.example
# ==============================================================================
cat > .env.example <<'ENV_EOF'
STRIPE_SECRET_KEY=sk_test_***
STRIPE_PRICE_PRO=price_***
STRIPE_PRICE_MAX=price_***
STRIPE_WEBHOOK_SECRET=whsec_***
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_***
ENV_EOF

# ==============================================================================
# supabase.sql
# ==============================================================================
cat > supabase.sql <<'SQL_EOF'
-- profiles テーブル作成
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  active_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS有効化（管理側はservice_roleで操作するため、ここではアプリ側のポリシーは省略）
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールは読み取り可能
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- auth.users作成時に自動でprofiles作成
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, plan)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_profile();
SQL_EOF

# ==============================================================================
# README-SETUP.md
# ==============================================================================
cat > README-SETUP.md <<'README_EOF'
# Psycle Billing - Setup Guide

## 前提

- Node.js / npm インストール済み
- Stripe アカウント作成済み（テストモードで動作確認）
- Supabase プロジェクト作成済み

## セットアップ手順

### 1. bootstrap.sh 実行（完了済み）

```bash
sh bootstrap.sh
```

### 2. Supabase にテーブル作成

Supabase Dashboard → SQL Editor で `supabase.sql` の内容を実行。

### 3. Stripe Webhook Secret 取得（ローカル開発）

```bash
stripe listen --forward-to http://localhost:3000/api/stripe-webhook
```

ターミナルに表示される `whsec_***` をコピーして `.env.local` に追加。

### 4. 環境変数設定

`.env.local` を作成（`.env.example` を参考）:

```env
STRIPE_SECRET_KEY=sk_test_***
STRIPE_PRICE_PRO=price_1SJ82EJDXOz4c0ISSpJmO8sx
STRIPE_PRICE_MAX=price_1SJ82FJDXOz4c0ISrrFASipQ
STRIPE_WEBHOOK_SECRET=whsec_*** # stripe listen で取得
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_***
```

### 5. ローカル動作確認

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### 6. Vercel デプロイ

```bash
npm install -g vercel
vercel
```

### 7. Vercel 環境変数設定

```bash
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PRICE_PRO
vercel env add STRIPE_PRICE_MAX
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

または Vercel Dashboard の Settings → Environment Variables で設定。

### 8. Stripe Webhook 本番設定

Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://your-app.vercel.app/api/stripe-webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
- Webhook signing secret をコピーして `STRIPE_WEBHOOK_SECRET` に設定

### 9. 動作確認

Expo アプリから `/api/create-checkout-session` を呼び出し、Stripe Checkout で決済テスト。

## API エンドポイント

- `POST /api/create-checkout-session` - Checkout URL 取得
  - Body: `{ plan: "pro"|"max", uid: "...", email: "..." }`
  - Response: `{ url: "https://checkout.stripe.com/..." }`

- `POST /api/stripe-webhook` - Webhook 受信（Stripe が呼び出す）

- `POST /api/portal` - Customer Portal URL 取得
  - Body: `{ email: "..." }`
  - Response: `{ url: "https://billing.stripe.com/..." }`
README_EOF

echo "✅ 完了！"
echo "   プロジェクト: ./$PROJECT_NAME"
echo "   次の手順: cd $PROJECT_NAME && cat README-SETUP.md"
