import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed", status: session.payment_status },
        { status: 400 }
      );
    }

    const restaurantId = session.metadata?.restaurantId;
    const planType = session.metadata?.planType || "pro";
    const billingCycle = session.metadata?.billingCycle || "monthly";

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID not found in session" },
        { status: 400 }
      );
    }

    // Check if already upgraded (avoid duplicate processing)
    const { data: existingSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("*, subscription_plans(*)")
      .eq("restaurant_id", restaurantId)
      .eq("is_current", true)
      .single();

    // If already on the target plan, skip
    if (existingSubs?.subscription_plans?.plan_type === planType) {
      return NextResponse.json({
        success: true,
        message: "Already on this plan",
        subscription: existingSubs,
      });
    }

    // Find the target plan in DB
    const { data: targetPlan } = await supabaseAdmin
      .from("subscription_plans")
      .select("id")
      .eq("plan_type", planType)
      .single();

    if (!targetPlan) {
      return NextResponse.json(
        { error: "Target plan not found" },
        { status: 404 }
      );
    }

    // Deactivate current subscription
    await supabaseAdmin
      .from("subscriptions")
      .update({ is_current: false, status: "canceled" })
      .eq("restaurant_id", restaurantId)
      .eq("is_current", true);

    // Calculate ends_at based on billing cycle
    const now = new Date();
    let endsAt: string;
    if (billingCycle === "yearly") {
      endsAt = new Date(
        now.getFullYear() + 1,
        now.getMonth(),
        now.getDate()
      ).toISOString();
    } else {
      endsAt = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
      ).toISOString();
    }

    // Create the new subscription
    const { data: newSub, error: insertError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        restaurant_id: restaurantId,
        plan_id: targetPlan.id,
        status: "active",
        is_current: true,
        billing_cycle: billingCycle,
        started_at: now.toISOString(),
        ends_at: endsAt,
        auto_renew: true,
      })
      .select("*, subscription_plans(*)")
      .single();

    if (insertError) {
      console.error("Failed to create subscription:", insertError);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: newSub,
    });
  } catch (error: any) {
    console.error("Verify session error:", error);
    return NextResponse.json(
      { error: "Failed to verify session", details: error.message },
      { status: 500 }
    );
  }
}
