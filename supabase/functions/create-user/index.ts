import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

type Role = "owner" | "manager" | "accountant" | "staff";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Supabase function environment is not configured." }, 500);
  }

  const authorization = req.headers.get("Authorization") ?? "";
  const jwt = authorization.replace("Bearer ", "");
  if (!jwt) {
    return json({ error: "Missing owner authorization." }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !userData.user) {
    return json({ error: "Invalid session." }, 401);
  }

  const { data: profile, error: profileError } = await userClient
    .from("user_profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || profile?.role !== "owner") {
    return json({ error: "Only owner accounts can create users." }, 403);
  }

  const body = await req.json().catch(() => null) as null | {
    email?: string;
    password?: string;
    displayName?: string;
    role?: Role;
  };

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  const displayName = body?.displayName?.trim();
  const role = body?.role;

  if (!email || !password || !displayName || !role) {
    return json({ error: "Email, password, display name, and role are required." }, 400);
  }

  if (!["owner", "manager", "accountant", "staff"].includes(role)) {
    return json({ error: "Invalid role." }, 400);
  }

  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters." }, 400);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      role,
      created_by_owner: userData.user.id,
    },
  });

  if (createError || !created.user) {
    return json({ error: createError?.message ?? "Unable to create auth user." }, 400);
  }

  const { error: profileInsertError } = await adminClient.from("user_profiles").upsert({
    id: created.user.id,
    display_name: displayName,
    role,
  });

  if (profileInsertError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json({ error: profileInsertError.message }, 400);
  }

  await adminClient.from("activity_logs").insert({
    actor: profile.role,
    action: `Created user ${email} as ${role}`,
    entity: "User",
    entity_id: created.user.id,
  });

  return json({ id: created.user.id, email, role }, 201);
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
