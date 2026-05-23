import type { WorkspaceData } from "../types";
import { mockData } from "./mockData";
import { hasSupabaseConfig, supabase, supabaseUrl } from "./supabase";
import { normalizeUserIdentifier } from "./userIds";

const tableMap = {
  staff: "staff",
  customers: "customers",
  bikes: "bikes",
  parts: "parts",
  sales: "bike_sales",
  dues: "due_records",
  duePayments: "due_payments",
  services: "service_records",
  debits: "debit_transactions",
  credits: "credit_transactions",
  salaryPayments: "salary_payments",
  homeExpenses: "home_expenses",
  others: "other_records",
  activity: "activity_logs",
} as const;

const roleTables = {
  owner: Object.keys(tableMap),
  manager: ["staff", "customers", "bikes", "parts", "sales", "dues", "duePayments", "services", "credits", "activity"],
  accountant: ["staff", "customers", "sales", "dues", "duePayments", "services", "debits", "credits", "salaryPayments", "homeExpenses", "others", "activity"],
  staff: ["customers", "sales", "dues", "services", "activity"],
} as const;

const emptyWorkspace: WorkspaceData = {
  staff: [],
  customers: [],
  bikes: [],
  parts: [],
  sales: [],
  dues: [],
  duePayments: [],
  services: [],
  debits: [],
  credits: [],
  salaryPayments: [],
  homeExpenses: [],
  others: [],
  activity: [],
};

export async function loadWorkspaceData(role: "owner" | "manager" | "accountant" | "staff" = "owner"): Promise<{ data: WorkspaceData; source: "supabase" | "demo"; error?: string }> {
  if (!hasSupabaseConfig || !supabase) {
    return { data: structuredClone(mockData), source: "demo" };
  }

  const client = supabase;
  try {
    const allowed = roleTables[role];
    const entries = await Promise.all(
      Object.entries(tableMap).filter(([key]) => allowed.includes(key as never)).map(async ([key, table]) => {
        const { data, error } = await client.from(table).select("*").order("created_at", { ascending: false, nullsFirst: false });
        if (error) throw error;
        return [key, data ?? []] as const;
      }),
    );
    return { data: { ...emptyWorkspace, ...Object.fromEntries(entries) } as WorkspaceData, source: "supabase" };
  } catch (error) {
    return {
      data: structuredClone(mockData),
      source: "demo",
      error: error instanceof Error ? error.message : "Unable to load Supabase data",
    };
  }
}

export async function insertRecord<T extends keyof typeof tableMap>(collection: T, payload: unknown) {
  if (!supabase) return null;
  const { data, error } = await supabase.from(tableMap[collection]).insert(payload as Record<string, unknown>).select().single();
  if (error) throw error;
  return data;
}

export async function updateRecord<T extends keyof typeof tableMap>(collection: T, id: string, payload: unknown) {
  if (!supabase) return null;
  const { data, error } = await supabase.from(tableMap[collection]).update(payload as Record<string, unknown>).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRecord<T extends keyof typeof tableMap>(collection: T, id: string) {
  if (!supabase) return null;
  const { error } = await supabase.from(tableMap[collection]).delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function loadCurrentProfile() {
  if (!supabase) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const { data, error } = await supabase.from("user_profiles").select("id, display_name, role").eq("id", userData.user.id).single();
  if (error) throw error;
  return data as { id: string; display_name: string; role: "owner" | "manager" | "accountant" | "staff" };
}

export async function createMemberUser(input: { email: string; password: string; displayName: string; role: "owner" | "manager" | "accountant" | "staff" }) {
  if (!supabase || !supabaseUrl) throw new Error("Supabase is not configured.");
  const email = normalizeUserIdentifier(input.email);
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You must be signed in as owner.");

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...input, email }),
    });
  } catch (error) {
    throw new Error("User creation service is not deployed or is unreachable. Deploy the Supabase Edge Function `create-user` first.");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User creation service is not deployed. Deploy the Supabase Edge Function `create-user` first.");
    }
    throw new Error(body.error ?? body.message ?? "Unable to create user.");
  }
  return body as { id: string; email: string; role: string };
}
