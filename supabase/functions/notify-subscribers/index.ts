import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Find picks that haven't been notified yet
    const { data: unnotifiedPicks, error: picksError } = await supabase
      .from("picks")
      .select("*")
      .eq("notified", false)
      .order("created_at", { ascending: false });

    if (picksError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch picks" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!unnotifiedPicks || unnotifiedPicks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new picks to notify about", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all subscribers with a linked auth user account
    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select("user_id, email")
      .eq("notify_picks", true)
      .not("user_id", "is", null);

    if (subError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscribers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let notificationCount = 0;

    if (subscribers && subscribers.length > 0) {
      // Create in-app notifications for each subscriber for each new pick
      const notificationsToInsert: { user_id: string; title: string; message: string; pick_id: string }[] = [];

      for (const pick of unnotifiedPicks) {
        const title = `Nouveau pronostic: ${pick.match_name}`;
        const message = `${pick.bet_type} — ${pick.bet} @ ${pick.cote} (Confiance: ${pick.confidence}/5)`;

        for (const sub of subscribers) {
          if (sub.user_id) {
            notificationsToInsert.push({
              user_id: sub.user_id,
              title,
              message,
              pick_id: pick.id,
            });
          }
        }
      }

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notificationsToInsert);

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Failed to create notifications: " + insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      notificationCount = notificationsToInsert.length;
    }

    // Mark all picks as notified
    const pickIds = unnotifiedPicks.map((p) => p.id);
    await supabase.from("picks").update({ notified: true }).in("id", pickIds);

    return new Response(
      JSON.stringify({
        message: "Notifications created",
        notifications: notificationCount,
        picks: pickIds.length,
        subscribers: subscribers?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
