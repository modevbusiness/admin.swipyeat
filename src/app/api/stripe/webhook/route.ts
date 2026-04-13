import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const restaurantId = session.metadata?.restaurantId;
        const planType = session.metadata?.planType || "pro";
        const billingCycle = session.metadata?.billingCycle || "monthly";

        if (restaurantId && session.subscription) {
          // Find the target plan
          let { data: targetPlan } = await supabaseAdmin
            .from("subscription_plans")
            .select("id")
            .eq("plan_type", planType)
            .single();

          if (targetPlan) {
            // Deactivate current subscription
            await supabaseAdmin
              .from("subscriptions")
              .update({ is_current: false, status: "canceled" })
              .eq("restaurant_id", restaurantId)
              .eq("is_current", true);

            // Create the new subscription
            await supabaseAdmin.from("subscriptions").insert({
              restaurant_id: restaurantId,
              plan_id: targetPlan.id,
              status: "active",
              is_current: true,
              billing_cycle: billingCycle,
              started_at: new Date().toISOString(),
              auto_renew: true,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const restaurantId = subscription.metadata?.restaurantId;

        if (restaurantId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled", is_current: false })
            .eq("restaurant_id", restaurantId)
            .eq("is_current", true);

          const { data: freePlan } = await supabaseAdmin
            .from("subscription_plans")
            .select("id")
            .eq("plan_type", "free_trial")
            .single();

          if (freePlan) {
            await supabaseAdmin.from("subscriptions").insert({
              restaurant_id: restaurantId,
              plan_id: freePlan.id,
              status: "active",
              is_current: true,
              billing_cycle: "monthly",
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.error("Payment failed for invoice:", invoice.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
