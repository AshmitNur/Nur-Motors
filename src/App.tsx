import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bike,
  Boxes,
  Calculator,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  DatabaseBackup,
  FileDown,
  FileText,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PackagePlus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ActivityLog,
  Bike as InventoryBike,
  BikeSale,
  DuePayment,
  DueRecord,
  MoneyTransaction,
  Part,
  PaymentMethod,
  Role,
  ServiceRecord,
  WorkspaceData,
} from "./types";
import { dashboardMetrics, dueStatus, expenseCategorySeries, formatBDT, isLowStock, monthlySeries, serviceProfit, todayISO } from "./lib/calculations";
import { downloadBikeSaleInvoice, downloadBusinessSummary, downloadDueReceipt } from "./lib/invoiceDocuments";
import { createMemberUser, insertRecord, loadCurrentProfile, loadWorkspaceData, updateRecord } from "./lib/repository";
import { hasSupabaseConfig, supabase } from "./lib/supabase";

type Page = "dashboard" | "sales" | "service" | "inventory" | "finance" | "customers" | "reports" | "backup" | "activity";
type Tab = "sales-records" | "new-sale" | "active-dues" | "payment-history";

const paymentMethods: PaymentMethod[] = ["Cash", "Bank", "bKash", "Nagad", "Cheque"];
const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales & Dues", icon: Bike },
  { id: "service", label: "Service", icon: Wrench },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "finance", label: "Finance", icon: CircleDollarSign },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reports", label: "Reports", icon: ChartNoAxesCombined },
  { id: "backup", label: "Backup", icon: DatabaseBackup },
  { id: "activity", label: "Activity Log", icon: Activity },
] satisfies { id: Page; label: string; icon: typeof LayoutDashboard }[];

const rolePages: Record<Role, Page[]> = {
  owner: ["dashboard", "sales", "service", "inventory", "finance", "customers", "reports", "backup", "activity"],
  manager: ["dashboard", "sales", "service", "inventory", "customers", "reports"],
  accountant: ["dashboard", "finance", "reports"],
  staff: ["sales", "service", "customers"],
};

const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function matchesQuery(query: string, values: unknown[]) {
  const needle = normalizeQuery(query);
  if (!needle) return true;
  return values.some((value) => String(value ?? "").toLowerCase().includes(needle));
}

function matchesSale(sale: BikeSale, query: string) {
  return matchesQuery(query, [
    sale.sale_no,
    sale.sale_date,
    sale.customer_name,
    sale.customer_phone,
    sale.bike_brand,
    sale.bike_model,
    sale.bike_color,
    sale.chassis_number,
    sale.engine_number,
    sale.registration_number,
    sale.payment_type,
    sale.payment_method,
    sale.salesperson,
    sale.notes,
    sale.selling_price,
    sale.paid_amount,
    sale.due_amount,
  ]);
}

function matchesDue(due: DueRecord, query: string) {
  return matchesQuery(query, [
    due.customer_name,
    due.customer_phone,
    due.bike_details,
    due.due_date,
    due.installment_type,
    due.payment_status,
    due.payment_method,
    due.guarantor_name,
    due.guarantor_phone,
    due.notes,
    due.total_selling_price,
    due.paid_amount,
    due.remaining_due,
  ]);
}

function matchesPayment(payment: DuePayment, query: string) {
  return matchesQuery(query, [
    payment.receipt_number,
    payment.payment_date,
    payment.payment_method,
    payment.received_by,
    payment.notes,
    payment.amount_received,
    payment.previous_due,
    payment.remaining_due,
  ]);
}

function matchesService(service: ServiceRecord, query: string) {
  return matchesQuery(query, [
    service.service_no,
    service.service_date,
    service.customer_name,
    service.customer_phone,
    service.bike_brand,
    service.bike_model,
    service.service_type,
    service.parts_used,
    service.payment_method,
    service.mechanic_name,
    service.notes,
    service.total_bill,
    service.paid_amount,
    service.due_amount,
  ]);
}

function matchesBike(bike: InventoryBike, query: string) {
  return matchesQuery(query, [
    bike.brand,
    bike.model,
    bike.color,
    bike.year,
    bike.chassis_number,
    bike.engine_number,
    bike.purchase_price,
    bike.supplier_name,
    bike.purchase_date,
    bike.current_status,
    bike.location,
  ]);
}

function matchesPart(part: Part, query: string) {
  return matchesQuery(query, [
    part.part_name,
    part.category,
    part.brand,
    part.quantity_available,
    part.purchase_price_per_unit,
    part.selling_price_per_unit,
    part.supplier_name,
    part.minimum_stock_level,
    part.location,
  ]);
}

function matchesTransaction(item: MoneyTransaction, query: string) {
  return matchesQuery(query, [item.transaction_date, item.category, item.person, item.purpose, item.payment_method, item.related_module, item.added_by, item.notes, item.amount]);
}

function matchesCustomer(customer: WorkspaceData["customers"][number], data: WorkspaceData, query: string) {
  const customerSales = data.sales.filter((sale) => sale.customer_id === customer.id);
  const customerDues = data.dues.filter((due) => due.customer_id === customer.id);
  const customerServices = data.services.filter((service) => service.customer_id === customer.id);
  return matchesQuery(query, [
    customer.name,
    customer.phone,
    customer.alternative_phone,
    customer.address,
    customer.nid_number,
    customer.status,
    customer.notes,
    ...customerSales.flatMap((sale) => [sale.sale_no, sale.bike_model, sale.chassis_number, sale.engine_number]),
    ...customerDues.flatMap((due) => [due.bike_details, due.remaining_due, due.payment_status]),
    ...customerServices.flatMap((service) => [service.service_no, service.bike_model, service.service_type]),
  ]);
}

function matchesActivity(item: ActivityLog, query: string) {
  return matchesQuery(query, [item.created_at, item.actor, item.entity, item.action]);
}

export default function App() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [source, setSource] = useState<"supabase" | "demo">("demo");
  const [loadError, setLoadError] = useState<string | undefined>();
  const [page, setPage] = useState<Page>("dashboard");
  const [role, setRole] = useState<Role>("owner");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("new-sale");
  const [drawerDue, setDrawerDue] = useState<DueRecord | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [authChecked, setAuthChecked] = useState(!hasSupabaseConfig);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Owner");
  const [authError, setAuthError] = useState<string | null>(null);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (hasSupabaseConfig) return;
    loadWorkspaceData().then((result) => {
      setData(result.data);
      setSource(result.source);
      setLoadError(result.error);
    });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }
    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      const email = sessionData.session?.user.email ?? null;
      setAuthEmail(email);
      if (email) {
        await hydrateAuthenticatedWorkspace();
      }
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user.email ?? null);
      if (session) {
        void hydrateAuthenticatedWorkspace();
      } else if (hasSupabaseConfig) {
        setData(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const metrics = useMemo(() => (data ? dashboardMetrics(data) : null), [data]);
  const months = useMemo(() => (data ? monthlySeries(data) : []), [data]);
  const expenses = useMemo(() => (data ? expenseCategorySeries(data.debits, data.homeExpenses, data.others) : []), [data]);
  const filteredSales = useMemo(() => {
    if (!data) return [];
    return data.sales.filter((sale) => matchesSale(sale, query));
  }, [data, query]);

  useEffect(() => {
    if (!rolePages[role].includes(page)) {
      setPage(rolePages[role][0]);
    }
  }, [role, page]);

  const hydrateAuthenticatedWorkspace = async () => {
    try {
      const profile = await loadCurrentProfile();
      if (profile) {
        setRole(profile.role);
        setDisplayName(profile.display_name);
      }
      const result = await loadWorkspaceData(profile?.role ?? "staff");
      setData(result.data);
      setSource(result.source);
      setLoadError(result.error);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load authenticated workspace.");
    }
  };

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setAuthError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }
    await hydrateAuthenticatedWorkspace();
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthEmail(null);
    setData(null);
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setCreateUserError(null);
    setCreateUserSuccess(null);
    const form = new FormData(formElement);
    try {
      const user = await createMemberUser({
        email: String(form.get("new_user_email") || form.get("email") || ""),
        password: String(form.get("new_user_password") || form.get("password") || ""),
        displayName: String(form.get("display_name") || ""),
        role: String(form.get("role") || "staff") as Role,
      });
      setCreateUserSuccess(`Created ${user.email} as ${user.role}.`);
      formElement.reset();
      addActivity(`Created user ${user.email} as ${user.role}`, "User");
    } catch (error) {
      setCreateUserError(error instanceof Error ? error.message : "Unable to create user.");
    }
  };

  if (!authChecked) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (hasSupabaseConfig && !authEmail) {
    return <AuthPage authError={authError} onSignIn={signIn} />;
  }

  if (hasSupabaseConfig && authEmail && loadError && !data) {
    return <SetupBlockedPage error={loadError} onSignOut={signOut} />;
  }

  if (!data || !metrics) {
    return <div className="loading">Loading business workspace...</div>;
  }

  const addActivity = (action: string, entity: string) => {
    const activity: ActivityLog = {
      id: crypto.randomUUID(),
      actor: role === "owner" ? "Owner" : role,
      action,
      entity,
      created_at: new Date().toISOString(),
    };
    setData((current) => current && { ...current, activity: [activity, ...current.activity] });
    void insertRecord("activity", activity);
  };

  const addBikeSale = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const purchasePrice = Number(form.get("purchase_price") || 0);
    const sellingPrice = Number(form.get("selling_price") || 0);
    const discount = Number(form.get("discount") || 0);
    const additionalExpense = Number(form.get("additional_sale_expense") || 0);
    const paidAmount = Number(form.get("paid_amount") || 0);
    const dueAmount = Math.max(sellingPrice - discount - paidAmount, 0);
    const saleNo = `SALE-${new Date().getFullYear()}-${String(data.sales.length + 1).padStart(4, "0")}`;
    const customerName = String(form.get("customer_name") || "");
    const customerPhone = String(form.get("customer_phone") || "");
    const existingCustomer = data.customers.find((customer) => customer.phone === customerPhone);
    const bikeModel = String(form.get("bike_model") || "");
    const bikeBrand = "Suzuki";
    const chassis = String(form.get("chassis_number") || "");
    const sale: BikeSale = {
      id: crypto.randomUUID(),
      sale_no: saleNo,
      sale_date: String(form.get("sale_date") || todayISO()),
      customer_id: existingCustomer?.id ?? "",
      customer_name: customerName,
      customer_phone: customerPhone,
      bike_brand: bikeBrand,
      bike_model: bikeModel,
      bike_color: String(form.get("bike_color") || ""),
      chassis_number: chassis,
      engine_number: String(form.get("engine_number") || ""),
      purchase_price: purchasePrice,
      selling_price: sellingPrice,
      discount,
      additional_sale_expense: additionalExpense,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      profit: sellingPrice - purchasePrice - discount - additionalExpense,
      payment_type: dueAmount > 0 ? "Partial Payment" : "Full Payment",
      payment_method: String(form.get("payment_method") || "Cash") as PaymentMethod,
      salesperson: String(form.get("salesperson") || "Owner"),
      notes: String(form.get("notes") || ""),
    };
    const due: DueRecord | null =
      dueAmount > 0
        ? {
            id: crypto.randomUUID(),
            sale_id: sale.id,
            customer_id: sale.customer_id,
            customer_name: customerName,
            customer_phone: customerPhone,
            bike_details: `${bikeBrand} ${bikeModel} / ${chassis}`,
            total_selling_price: sellingPrice,
            paid_amount: paidAmount,
            due_amount: dueAmount,
            remaining_due: dueAmount,
            due_date: String(form.get("due_date") || todayISO()),
            installment_type: "One-time",
            installment_amount: dueAmount,
            payment_status: "Pending",
            payment_method: sale.payment_method,
            notes: sale.notes,
          }
        : null;
    const credit: MoneyTransaction = {
      id: crypto.randomUUID(),
      transaction_date: sale.sale_date,
      category: "Bike sale",
      amount: paidAmount,
      payment_method: sale.payment_method,
      person: customerName,
      purpose: `${saleNo} initial payment`,
      related_module: "Bike sale",
      added_by: sale.salesperson,
    };

    setData((current) =>
      current && {
        ...current,
        sales: [sale, ...current.sales],
        dues: due ? [due, ...current.dues] : current.dues,
        credits: [credit, ...current.credits],
        bikes: current.bikes.map((bike) => (bike.chassis_number === chassis ? { ...bike, current_status: "Sold" } : bike)),
      },
    );
    void insertRecord("sales", { ...sale, customer_id: existingCustomer?.id ?? null });
    if (due) void insertRecord("dues", { ...due, customer_id: existingCustomer?.id ?? null });
    void insertRecord("credits", credit);
    addActivity(`Added bike sale ${saleNo}`, "Bike Sale");
    event.currentTarget.reset();
  };

  const collectPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!drawerDue) return;
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount_received") || 0);
    const remaining = Math.max(drawerDue.remaining_due - amount, 0);
    const method = String(form.get("payment_method") || drawerDue.payment_method) as PaymentMethod;
    const receiptNumber = `RCPT-${new Date().getFullYear()}-${String(data.duePayments.length + 1).padStart(4, "0")}`;
    const payment: DuePayment = {
      id: crypto.randomUUID(),
      due_record_id: drawerDue.id,
      payment_date: String(form.get("payment_date") || todayISO()),
      amount_received: amount,
      payment_method: method,
      received_by: String(form.get("received_by") || "Owner"),
      previous_due: drawerDue.remaining_due,
      remaining_due: remaining,
      receipt_number: receiptNumber,
      notes: String(form.get("notes") || ""),
    };
    const updatedDue: DueRecord = {
      ...drawerDue,
      paid_amount: drawerDue.paid_amount + amount,
      remaining_due: remaining,
      last_payment_date: payment.payment_date,
      payment_status: remaining === 0 ? "Paid" : "Partially Paid",
    };
    const credit: MoneyTransaction = {
      id: crypto.randomUUID(),
      transaction_date: payment.payment_date,
      category: "Due collection",
      amount,
      payment_method: method,
      person: drawerDue.customer_name,
      purpose: `${receiptNumber} for ${drawerDue.bike_details}`,
      related_module: "Due payment",
      added_by: payment.received_by,
    };
    setData((current) =>
      current && {
        ...current,
        dues: current.dues.map((due) => (due.id === drawerDue.id ? updatedDue : due)),
        duePayments: [payment, ...current.duePayments],
        credits: [credit, ...current.credits],
      },
    );
    void updateRecord("dues", drawerDue.id, updatedDue);
    void insertRecord("duePayments", payment);
    void insertRecord("credits", credit);
    addActivity(`Collected ${formatBDT(amount)} from ${drawerDue.customer_name}`, "Due Payment");
    setDrawerDue(null);
  };

  const addServiceRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customerPhone = String(form.get("customer_phone") || "");
    const existingCustomer = data.customers.find((customer) => customer.phone === customerPhone);
    const serviceCharge = Number(form.get("service_charge") || 0);
    const partsCost = Number(form.get("parts_cost") || 0);
    const totalBill = serviceCharge + partsCost;
    const paidAmount = Number(form.get("paid_amount") || 0);
    const dueAmount = Math.max(totalBill - paidAmount, 0);
    const serviceNo = `SVC-${new Date().getFullYear()}-${String(data.services.length + 1).padStart(4, "0")}`;
    const service: ServiceRecord = {
      id: crypto.randomUUID(),
      service_no: serviceNo,
      service_date: String(form.get("service_date") || todayISO()),
      customer_id: existingCustomer?.id ?? "",
      customer_name: String(form.get("customer_name") || ""),
      customer_phone: customerPhone,
      bike_brand: "Suzuki",
      bike_model: String(form.get("bike_model") || ""),
      service_type: String(form.get("service_type") || ""),
      parts_used: String(form.get("parts_used") || ""),
      service_charge: serviceCharge,
      parts_cost: partsCost,
      total_bill: totalBill,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_method: String(form.get("payment_method") || "Cash") as PaymentMethod,
      mechanic_name: String(form.get("mechanic_name") || ""),
      notes: String(form.get("notes") || ""),
    };
    const credit: MoneyTransaction | null =
      paidAmount > 0
        ? {
            id: crypto.randomUUID(),
            transaction_date: service.service_date,
            category: "Service income",
            amount: paidAmount,
            payment_method: service.payment_method,
            person: service.customer_name,
            purpose: `${serviceNo} service payment`,
            related_module: "Service",
            added_by: service.mechanic_name || displayName,
          }
        : null;

    setData((current) =>
      current && {
        ...current,
        services: [service, ...current.services],
        credits: credit ? [credit, ...current.credits] : current.credits,
      },
    );
    void insertRecord("services", { ...service, customer_id: existingCustomer?.id ?? null });
    if (credit) void insertRecord("credits", credit);
    addActivity(`Added service record ${serviceNo}`, "Service");
    event.currentTarget.reset();
  };

  const addBikeStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const purchasePrice = Number(form.get("purchase_price") || 0);
    const bike: InventoryBike = {
      id: crypto.randomUUID(),
      brand: "Suzuki",
      model: String(form.get("model") || ""),
      color: String(form.get("color") || ""),
      year: Number(form.get("year") || new Date().getFullYear()),
      chassis_number: String(form.get("chassis_number") || ""),
      engine_number: String(form.get("engine_number") || ""),
      purchase_price: purchasePrice,
      supplier_name: String(form.get("supplier_name") || "Suzuki Dealer BD"),
      purchase_date: String(form.get("purchase_date") || todayISO()),
      current_status: "Available",
      location: String(form.get("location") || "Showroom"),
    };
    const debit: MoneyTransaction | null =
      purchasePrice > 0
        ? {
            id: crypto.randomUUID(),
            transaction_date: bike.purchase_date,
            category: "Bike purchase",
            amount: purchasePrice,
            payment_method: String(form.get("payment_method") || "Bank") as PaymentMethod,
            person: bike.supplier_name,
            purpose: `${bike.model} stock purchase`,
            related_module: "Bike stock",
            added_by: displayName,
          }
        : null;
    setData((current) =>
      current && {
        ...current,
        bikes: [bike, ...current.bikes],
        debits: debit ? [debit, ...current.debits] : current.debits,
      },
    );
    void insertRecord("bikes", bike);
    if (debit) void insertRecord("debits", debit);
    addActivity(`Added Suzuki ${bike.model} to stock`, "Bike Stock");
    event.currentTarget.reset();
  };

  const addPartStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get("quantity_available") || 0);
    const purchasePrice = Number(form.get("purchase_price_per_unit") || 0);
    const part: Part = {
      id: crypto.randomUUID(),
      part_name: String(form.get("part_name") || ""),
      category: String(form.get("category") || ""),
      brand: String(form.get("brand") || ""),
      quantity_available: quantity,
      purchase_price_per_unit: purchasePrice,
      selling_price_per_unit: Number(form.get("selling_price_per_unit") || 0),
      supplier_name: String(form.get("supplier_name") || ""),
      minimum_stock_level: Number(form.get("minimum_stock_level") || 0),
      location: String(form.get("location") || ""),
    };
    const totalCost = quantity * purchasePrice;
    const debit: MoneyTransaction | null =
      totalCost > 0
        ? {
            id: crypto.randomUUID(),
            transaction_date: String(form.get("purchase_date") || todayISO()),
            category: "Parts purchase",
            amount: totalCost,
            payment_method: String(form.get("payment_method") || "Cash") as PaymentMethod,
            person: part.supplier_name,
            purpose: `${part.part_name} stock purchase`,
            related_module: "Parts stock",
            added_by: displayName,
          }
        : null;
    setData((current) =>
      current && {
        ...current,
        parts: [part, ...current.parts],
        debits: debit ? [debit, ...current.debits] : current.debits,
      },
    );
    void insertRecord("parts", part);
    if (debit) void insertRecord("debits", debit);
    addActivity(`Added part stock ${part.part_name}`, "Parts Stock");
    event.currentTarget.reset();
  };

  const addMoneyTransaction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const transactionType = String(form.get("transaction_type") || "Debit");
    const transaction: MoneyTransaction = {
      id: crypto.randomUUID(),
      transaction_date: String(form.get("transaction_date") || todayISO()),
      category: String(form.get("category") || ""),
      amount: Number(form.get("amount") || 0),
      payment_method: String(form.get("payment_method") || "Cash") as PaymentMethod,
      person: String(form.get("person") || ""),
      purpose: String(form.get("purpose") || ""),
      related_module: "Manual finance entry",
      added_by: String(form.get("added_by") || displayName),
      notes: String(form.get("notes") || ""),
    };
    const isCredit = transactionType === "Credit";
    setData((current) =>
      current && {
        ...current,
        credits: isCredit ? [transaction, ...current.credits] : current.credits,
        debits: isCredit ? current.debits : [transaction, ...current.debits],
      },
    );
    void insertRecord(isCredit ? "credits" : "debits", transaction);
    addActivity(`Added ${transactionType.toLowerCase()} ${formatBDT(transaction.amount)}`, "Finance");
    event.currentTarget.reset();
  };

  const addCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customer = {
      id: crypto.randomUUID(),
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      alternative_phone: String(form.get("alternative_phone") || ""),
      address: String(form.get("address") || ""),
      nid_number: String(form.get("nid_number") || ""),
      status: String(form.get("status") || "Regular") as WorkspaceData["customers"][number]["status"],
      notes: String(form.get("notes") || ""),
    };
    setData((current) => current && { ...current, customers: [customer, ...current.customers] });
    void insertRecord("customers", customer);
    addActivity(`Added customer ${customer.name}`, "Customer");
    event.currentTarget.reset();
  };

  const allowedNav = nav.filter((item) => rolePages[role].includes(item.id));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">NM</div>
          <div>
            <strong>Nur Motors & Electronics</strong>
            <span>Business Management</span>
          </div>
        </div>
        <nav className="nav-list">
          {allowedNav.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id);
                setMobileNav(false);
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={16} />
          <span>{source === "supabase" ? "Supabase live data" : "Demo data mode"}</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileNav(true)} aria-label="Open navigation">
            <Menu size={18} />
          </button>
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this workspace..." />
          </div>
          {hasSupabaseConfig ? (
            <span className="role-chip">{role}</span>
          ) : (
            <select value={role} onChange={(event) => setRole(event.target.value as Role)} aria-label="Role">
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="staff">Staff</option>
            </select>
          )}
          <button className="icon-button" aria-label="Settings">
            <Settings size={18} />
          </button>
          <button className="user-chip auth-button" onClick={() => (authEmail ? void signOut() : undefined)}>
            <UserRound size={16} />
            <span>{authEmail ?? displayName}</span>
            {authEmail && <LogOut size={14} />}
          </button>
        </header>
        {!hasSupabaseConfig && <Banner tone="warning">Supabase env vars are not set, so the app is running against local demo data. Add `.env` values to connect the live backend.</Banner>}
        {loadError && <Banner tone="danger">Supabase load failed: {loadError}. Demo data is shown so the UI remains usable.</Banner>}

        {page === "dashboard" && <Dashboard data={data} metrics={metrics} months={months} expenses={expenses} openDue={setDrawerDue} query={query} />}
        {page === "sales" && (
          <SalesDues
            tab={tab}
            setTab={setTab}
            data={data}
            sales={filteredSales}
            addBikeSale={addBikeSale}
            openDue={setDrawerDue}
            canDelete={role === "owner"}
            query={query}
          />
        )}
        {page === "service" && <ServiceModule data={data} query={query} addServiceRecord={addServiceRecord} />}
        {page === "inventory" && <InventoryModule data={data} query={query} addBikeStock={addBikeStock} addPartStock={addPartStock} />}
        {page === "finance" && <FinanceModule data={data} query={query} addMoneyTransaction={addMoneyTransaction} />}
        {page === "customers" && <CustomersModule data={data} query={query} addCustomer={addCustomer} />}
        {page === "reports" && <ReportsModule data={data} metrics={metrics} expenses={expenses} query={query} />}
        {page === "backup" && <BackupModule data={data} query={query} />}
        {page === "activity" && role === "owner" && (
          <ActivityModule activity={data.activity} role={role} createUser={createUser} createUserError={createUserError} createUserSuccess={createUserSuccess} query={query} />
        )}
      </main>

      {drawerDue && (
        <div className="drawer-backdrop" onClick={() => setDrawerDue(null)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <span className="eyebrow">Collect Payment</span>
                <h2>{drawerDue.customer_name}</h2>
              </div>
              <StatusBadge value={dueStatus(drawerDue)} />
            </div>
            <dl className="receipt-summary">
              <div>
                <dt>Bike</dt>
                <dd>{drawerDue.bike_details}</dd>
              </div>
              <div>
                <dt>Previous Due</dt>
                <dd>{formatBDT(drawerDue.remaining_due)}</dd>
              </div>
            </dl>
            <form className="form-grid single" onSubmit={collectPayment}>
              <Field name="payment_date" label="Payment Date" type="date" defaultValue={todayISO()} />
              <Field name="amount_received" label="Amount Received" type="number" defaultValue={drawerDue.remaining_due} />
              <SelectField name="payment_method" label="Payment Method" options={paymentMethods} defaultValue={drawerDue.payment_method} />
              <Field name="received_by" label="Received By" defaultValue="Owner" />
              <Field name="notes" label="Notes" />
              <div className="button-row">
                <button type="button" className="secondary" onClick={() => setDrawerDue(null)}>
                  Cancel
                </button>
                <button type="submit">
                  <ReceiptText size={16} /> Generate Receipt
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

    </div>
  );
}

function AuthPage({ authError, onSignIn }: { authError: string | null; onSignIn: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">NM</div>
          <div>
            <strong>Nur Motors & Electronics</strong>
            <span>Production business workspace</span>
          </div>
        </div>
        <span className="eyebrow">Secure Sign In</span>
        <h1>Role-based staff access</h1>
        <p>Sign in with the user ID and password issued by the owner. Staff accounts cannot self-register.</p>
        <form className="form-grid single" onSubmit={onSignIn}>
          <Field name="email" label="User ID / Email" type="email" required />
          <Field name="password" label="Password" type="password" required />
          {authError && <Banner tone="danger">{authError}</Banner>}
          <button type="submit">
            <LogIn size={16} /> Sign In
          </button>
        </form>
      </section>
    </main>
  );
}

function SetupBlockedPage({ error, onSignOut }: { error: string; onSignOut: () => void }) {
  return (
    <main className="auth-page">
      <section className="auth-panel setup-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">NM</div>
          <div>
            <strong>Nur Motors & Electronics</strong>
            <span>Production setup required</span>
          </div>
        </div>
        <span className="eyebrow">Database Setup</span>
        <h1>Workspace is not ready yet</h1>
        <p>The app connected to Supabase, but the production database/profile setup is incomplete.</p>
        <div className="setup-error">{error}</div>
        <ol className="setup-list">
          <li>Run the full SQL migration in Supabase SQL Editor.</li>
          <li>Create the first owner in Supabase Authentication.</li>
          <li>Insert that owner into `public.user_profiles` with role `owner`.</li>
          <li>Refresh this page and sign in again.</li>
        </ol>
        <button type="button" className="secondary" onClick={onSignOut}>
          <LogOut size={16} /> Sign Out
        </button>
      </section>
    </main>
  );
}

function Dashboard({
  data,
  metrics,
  months,
  expenses,
  openDue,
  query,
}: {
  data: WorkspaceData;
  metrics: ReturnType<typeof dashboardMetrics>;
  months: ReturnType<typeof monthlySeries>;
  expenses: ReturnType<typeof expenseCategorySeries>;
  openDue: (due: DueRecord) => void;
  query: string;
}) {
  const kpis = [
    ["Sales today", metrics.salesToday, "bikes"],
    ["Sales this month", metrics.salesMonth, "bikes"],
    ["Sales this year", metrics.salesYear, "bikes"],
    ["Service income", formatBDT(metrics.serviceIncome), "received"],
    ["Total due", formatBDT(metrics.totalDue), "open balance"],
    ["Due today", metrics.dueToday, "customers"],
    ["Upcoming dues", metrics.upcomingDues, "next 7 days"],
    ["Overdue payments", metrics.overdueDues, "needs action"],
    ["Total debit", formatBDT(metrics.totalDebit), "money out"],
    ["Total credit", formatBDT(metrics.totalCredit), "money in"],
    ["Net cash", formatBDT(metrics.netCash), "balance"],
    ["Monthly profit", formatBDT(metrics.monthlyProfit), "estimate"],
    ["Monthly expenses", formatBDT(metrics.monthlyExpenses), "all categories"],
    ["Bike stock", metrics.availableBikeStock, "available"],
    ["Parts stock", metrics.availablePartsStock, "units"],
    ["Low stock parts", metrics.lowStockParts, "alerts"],
    ["Salary due", formatBDT(metrics.staffSalaryDue), "staff"],
    ["Dhaka home", formatBDT(metrics.dhakaHomeExpense), "expense"],
    ["Dinajpur home", formatBDT(metrics.dinajpurHomeExpense), "expense"],
    ["Other expenses", formatBDT(metrics.otherExpenses), "misc"],
  ];
  const overdue = data.dues.filter((due) => dueStatus(due) === "Overdue");
  const lowStock = data.parts.filter(isLowStock);
  const filteredOverdue = overdue.filter((due) => matchesDue(due, query));
  const filteredLowStock = lowStock.filter((part) => matchesPart(part, query));
  const searchActive = Boolean(normalizeQuery(query));
  const searchResults: React.ReactNode[][] = searchActive
    ? [
        ...data.sales.filter((sale) => matchesSale(sale, query)).map((sale) => ["Sale", sale.sale_no, `${sale.customer_name} - ${sale.bike_brand} ${sale.bike_model}`, formatBDT(sale.due_amount)]),
        ...data.dues.filter((due) => matchesDue(due, query)).map((due) => ["Due", due.customer_name, due.bike_details, formatBDT(due.remaining_due)]),
        ...data.customers.filter((customer) => matchesCustomer(customer, data, query)).map((customer) => ["Customer", customer.name, customer.phone, customer.address]),
        ...data.bikes.filter((bike) => matchesBike(bike, query)).map((bike) => ["Bike Stock", `${bike.brand} ${bike.model}`, bike.chassis_number, bike.current_status]),
        ...data.parts.filter((part) => matchesPart(part, query)).map((part) => ["Part", part.part_name, part.category, `${part.quantity_available} units`]),
        ...data.services.filter((service) => matchesService(service, query)).map((service) => ["Service", service.service_no, `${service.customer_name} - ${service.bike_model}`, formatBDT(service.total_bill)]),
        ...data.credits.filter((item) => matchesTransaction(item, query)).map((item) => ["Credit", item.category, item.person, formatBDT(item.amount)]),
        ...data.debits.filter((item) => matchesTransaction(item, query)).map((item) => ["Debit", item.category, item.person, formatBDT(item.amount)]),
      ].slice(0, 16)
    : [];

  return (
    <section className="page-stack">
      <PageTitle eyebrow="Dashboard" title="Business Overview" action={<button onClick={() => downloadBusinessSummary(data)}><FileDown size={16} /> Summary PDF</button>} />
      {searchActive && (
        <Panel title={`Search Results for "${query}"`}>
          <Table
            headers={["Area", "Record", "Details", "Value / Status"]}
            rows={searchResults}
            empty="No matching records found in the loaded workspace."
          />
        </Panel>
      )}
      <div className="kpi-grid">
        {kpis.map(([label, value, meta]) => (
          <article className="kpi" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{meta}</small>
          </article>
        ))}
      </div>
      <div className="chart-grid">
        <Panel title="Monthly Sales & Profit">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => (typeof value === "number" && value > 1000 ? formatBDT(value) : value)} />
              <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Due Collection Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={months}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatBDT(Number(value))} />
              <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Expense Categories">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={expenses} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92}>
                {expenses.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatBDT(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="split-grid">
        <Panel title="Overdue Payments" action={<button className="secondary"><FileDown size={16} /> Export</button>}>
          <Table
            headers={["Customer", "Bike", "Due Date", "Amount", "Status", "Action"]}
            rows={filteredOverdue.map((due) => [
              customerCell(due.customer_name, due.customer_phone),
              due.bike_details,
              due.due_date,
              formatBDT(due.remaining_due),
              <StatusBadge value={dueStatus(due)} />,
              <button className="small" onClick={() => openDue(due)}>Collect</button>,
            ])}
            empty="No overdue dues."
          />
        </Panel>
        <Panel title="Low Stock Parts">
          <Table
            headers={["Part", "Category", "Stock", "Min"]}
            rows={filteredLowStock.map((part) => [part.part_name, part.category, part.quantity_available, part.minimum_stock_level])}
            empty="No low stock parts."
          />
        </Panel>
      </div>
    </section>
  );
}

function SalesDues({
  tab,
  setTab,
  data,
  sales,
  addBikeSale,
  openDue,
  canDelete,
  query,
}: {
  tab: Tab;
  setTab: (tab: Tab) => void;
  data: WorkspaceData;
  sales: BikeSale[];
  addBikeSale: (event: FormEvent<HTMLFormElement>) => void;
  openDue: (due: DueRecord) => void;
  canDelete: boolean;
  query: string;
}) {
  const activeDues = data.dues.filter((due) => matchesDue(due, query)).map((due) => ({ ...due, payment_status: dueStatus(due) }));
  const duePayments = data.duePayments.filter((payment) => matchesPayment(payment, query));
  return (
    <section className="page-stack">
      <PageTitle
        eyebrow="Sales & Due Payments"
        title="Bike Sales and Loan Tracking"
        action={<button className="secondary" onClick={() => setTab("sales-records")}><FileDown size={16} /> Invoice Files</button>}
      />
      <Tabs
        value={tab}
        onChange={(value) => setTab(value as Tab)}
        tabs={[
          ["sales-records", "Sales Records"],
          ["new-sale", "New Bike Sale"],
          ["active-dues", "Active Dues"],
          ["payment-history", "Payment History"],
        ]}
      />
      {tab === "new-sale" && (
        <Panel title="New Bike Sale">
          <form className="form-grid" onSubmit={addBikeSale}>
            <SectionTitle title="Customer Details" />
            <Field name="sale_date" label="Sale Date" type="date" defaultValue={todayISO()} />
            <Field name="customer_name" label="Customer Name" required />
            <Field name="customer_phone" label="Customer Phone" required />
            <Field name="customer_address" label="Customer Address" />
            <Field name="nid_number" label="NID Number" />
            <SectionTitle title="Suzuki Bike Details" />
            <Field name="bike_model" label="Bike Model" required />
            <Field name="bike_color" label="Bike Color" />
            <Field name="chassis_number" label="Chassis Number" required />
            <Field name="engine_number" label="Engine Number" required />
            <Field name="registration_number" label="Registration Number" />
            <SectionTitle title="Financials" />
            <Field name="purchase_price" label="Purchase Price" type="number" defaultValue={220000} required />
            <Field name="selling_price" label="Selling Price" type="number" defaultValue={250000} required />
            <Field name="discount" label="Discount" type="number" defaultValue={0} />
            <Field name="additional_sale_expense" label="Additional Sale Expense" type="number" defaultValue={0} />
            <Field name="paid_amount" label="Paid Amount" type="number" defaultValue={0} />
            <Field name="due_date" label="Due Date" type="date" defaultValue={todayISO()} />
            <SelectField name="payment_method" label="Payment Method" options={paymentMethods} defaultValue="Cash" />
            <Field name="salesperson" label="Salesperson" defaultValue="Owner" />
            <Field name="notes" label="Notes" />
            <div className="button-row full">
              <button type="reset" className="secondary">Clear</button>
              <button type="submit"><PackagePlus size={16} /> Save Sale</button>
            </div>
          </form>
        </Panel>
      )}
      {tab === "sales-records" && (
        <Panel title="Sale History">
          <Table
            headers={["Sale ID", "Customer", "Bike", "Paid", "Due", "Profit", "Payment", "Actions"]}
            rows={sales.map((sale) => {
              const due = data.dues.find((item) => item.sale_id === sale.id);
              const payments = due ? data.duePayments.filter((payment) => payment.due_record_id === due.id) : [];
              return [
                sale.sale_no,
                customerCell(sale.customer_name, sale.customer_phone),
                `${sale.bike_brand} ${sale.bike_model}`,
                formatBDT(sale.paid_amount),
                formatBDT(sale.due_amount),
                formatBDT(sale.profit),
                <StatusBadge value={sale.due_amount > 0 ? "Partially Paid" : "Paid"} />,
                <div className="row-actions">
                  <button className="small" onClick={() => downloadBikeSaleInvoice(sale, due, payments)}><FileDown size={14} /> Invoice</button>
                  {canDelete && <button className="small danger">Delete</button>}
                </div>,
              ];
            })}
            empty="No sales match the search."
          />
        </Panel>
      )}
      {tab === "active-dues" && (
        <Panel
          title="Loan / Due Records"
          action={<div className="filter-pills"><span>Due Today</span><span>This Week</span><span>Upcoming</span><span>Overdue</span><span>Paid</span></div>}
        >
          <Table
            headers={["Customer", "Bike", "Due Date", "Total", "Paid", "Remaining", "Status", "Action"]}
            rows={activeDues.map((due) => [
              customerCell(due.customer_name, due.customer_phone),
              due.bike_details,
              due.due_date,
              formatBDT(due.total_selling_price),
              formatBDT(due.paid_amount),
              formatBDT(due.remaining_due),
              <StatusBadge value={due.payment_status} />,
              due.remaining_due > 0 ? (
                <button className="small" onClick={() => openDue(due)}>Collect Payment</button>
              ) : (
                <button className="small secondary" onClick={() => downloadDueReceipt(due, data.duePayments.filter((payment) => payment.due_record_id === due.id))}>
                  <FileDown size={14} /> Receipt
                </button>
              ),
            ])}
            empty="No active dues."
          />
        </Panel>
      )}
      {tab === "payment-history" && (
        <Panel title="Due Collection History">
          <Table
            headers={["Receipt", "Date", "Amount", "Previous Due", "Remaining Due", "Method", "Received By"]}
            rows={duePayments.map((payment) => [
              payment.receipt_number,
              payment.payment_date,
              formatBDT(payment.amount_received),
              formatBDT(payment.previous_due),
              formatBDT(payment.remaining_due),
              payment.payment_method,
              payment.received_by,
            ])}
            empty="No due payments recorded yet."
          />
        </Panel>
      )}
    </section>
  );
}

function ServiceModule({ data, query, addServiceRecord }: { data: WorkspaceData; query: string; addServiceRecord: (event: FormEvent<HTMLFormElement>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const services = data.services.filter((service) => matchesService(service, query));
  return (
    <section className="page-stack">
      <PageTitle eyebrow="Service" title="Service Income and Parts Usage" action={<button onClick={() => setShowForm((current) => !current)}><Wrench size={16} /> Add Service</button>} />
      {showForm && (
        <Panel title="Add Service Record">
          <form className="form-grid" onSubmit={addServiceRecord}>
            <Field name="service_date" label="Service Date" type="date" defaultValue={todayISO()} required />
            <Field name="customer_name" label="Customer Name" required />
            <Field name="customer_phone" label="Customer Phone" required />
            <Field name="bike_model" label="Suzuki Bike Model" required />
            <Field name="service_type" label="Service Type" required />
            <Field name="parts_used" label="Parts Used" />
            <Field name="service_charge" label="Service Charge" type="number" defaultValue={0} required />
            <Field name="parts_cost" label="Parts Cost" type="number" defaultValue={0} />
            <Field name="paid_amount" label="Paid Amount" type="number" defaultValue={0} />
            <SelectField name="payment_method" label="Payment Method" options={paymentMethods} defaultValue="Cash" />
            <Field name="mechanic_name" label="Mechanic Name" required />
            <Field name="notes" label="Notes" />
            <div className="button-row full">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit"><Wrench size={16} /> Save Service</button>
            </div>
          </form>
        </Panel>
      )}
      <div className="mini-grid">
        <Metric title="Service Income" value={formatBDT(data.services.reduce((sum, item) => sum + item.paid_amount, 0))} />
        <Metric title="Service Due" value={formatBDT(data.services.reduce((sum, item) => sum + item.due_amount, 0))} />
        <Metric title="Estimated Service Profit" value={formatBDT(data.services.reduce((sum, item) => sum + serviceProfit(item), 0))} />
      </div>
      <Panel title="Service Records">
        <Table
          headers={["Service ID", "Customer", "Bike", "Service", "Parts Used", "Bill", "Paid", "Due", "Mechanic"]}
          rows={services.map((service: ServiceRecord) => [
            service.service_no,
            customerCell(service.customer_name, service.customer_phone),
            `${service.bike_brand} ${service.bike_model}`,
            service.service_type,
            service.parts_used,
            formatBDT(service.total_bill),
            formatBDT(service.paid_amount),
            formatBDT(service.due_amount),
            service.mechanic_name,
          ])}
        />
      </Panel>
    </section>
  );
}

function InventoryModule({
  data,
  query,
  addBikeStock,
  addPartStock,
}: {
  data: WorkspaceData;
  query: string;
  addBikeStock: (event: FormEvent<HTMLFormElement>) => void;
  addPartStock: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const bikes = data.bikes.filter((bike) => matchesBike(bike, query));
  const parts = data.parts.filter((part) => matchesPart(part, query));
  return (
    <section className="page-stack">
      <PageTitle eyebrow="Inventory" title="Bike Stock and Parts Stock" action={<button onClick={() => setShowForm((current) => !current)}><PackagePlus size={16} /> Add Stock</button>} />
      {showForm && (
        <Panel title="Add Stock">
          <div className="dual-form-grid">
            <form className="form-grid single" onSubmit={addBikeStock}>
              <SectionTitle title="Suzuki Bike Stock" />
              <Field name="model" label="Model" required />
              <Field name="color" label="Color" />
              <Field name="year" label="Year" type="number" defaultValue={new Date().getFullYear()} required />
              <Field name="chassis_number" label="Chassis Number" required />
              <Field name="engine_number" label="Engine Number" required />
              <Field name="purchase_price" label="Purchase Price" type="number" defaultValue={0} required />
              <Field name="supplier_name" label="Supplier" defaultValue="Suzuki Dealer BD" required />
              <Field name="purchase_date" label="Purchase Date" type="date" defaultValue={todayISO()} />
              <Field name="location" label="Location" defaultValue="Showroom" />
              <SelectField name="payment_method" label="Payment Method" options={paymentMethods} defaultValue="Bank" />
              <div className="button-row full">
                <button type="submit"><Bike size={16} /> Save Bike</button>
              </div>
            </form>
            <form className="form-grid single" onSubmit={addPartStock}>
              <SectionTitle title="Parts Stock" />
              <Field name="part_name" label="Part Name" required />
              <Field name="category" label="Category" required />
              <Field name="brand" label="Part Brand" />
              <Field name="quantity_available" label="Quantity" type="number" defaultValue={0} required />
              <Field name="minimum_stock_level" label="Minimum Stock" type="number" defaultValue={0} />
              <Field name="purchase_price_per_unit" label="Buy Price / Unit" type="number" defaultValue={0} required />
              <Field name="selling_price_per_unit" label="Sell Price / Unit" type="number" defaultValue={0} required />
              <Field name="supplier_name" label="Supplier" required />
              <Field name="purchase_date" label="Purchase Date" type="date" defaultValue={todayISO()} />
              <Field name="location" label="Location" />
              <SelectField name="payment_method" label="Payment Method" options={paymentMethods} defaultValue="Cash" />
              <div className="button-row full">
                <button type="submit"><PackagePlus size={16} /> Save Part</button>
              </div>
            </form>
          </div>
          <div className="button-row full">
            <button type="button" className="secondary" onClick={() => setShowForm(false)}>Close Stock Forms</button>
          </div>
        </Panel>
      )}
      <div className="inventory-stack">
        <Panel title="Bike Stock">
          <Table
            headers={["Company", "Model", "Chassis", "Engine", "Value", "Status", "Location"]}
            rows={bikes.map((bike) => [
              bike.brand,
              bike.model,
              bike.chassis_number,
              bike.engine_number,
              formatBDT(bike.purchase_price),
              <StatusBadge value={bike.current_status} />,
              bike.location,
            ])}
          />
        </Panel>
        <Panel title="Parts Stock">
          <Table
            headers={["Part", "Category", "Qty", "Min", "Buy", "Sell", "Status"]}
            rows={parts.map((part: Part) => [
              part.part_name,
              part.category,
              part.quantity_available,
              part.minimum_stock_level,
              formatBDT(part.purchase_price_per_unit),
              formatBDT(part.selling_price_per_unit),
              <StatusBadge value={isLowStock(part) ? "Low Stock" : "Available"} />,
            ])}
          />
        </Panel>
      </div>
    </section>
  );
}

function FinanceModule({ data, query, addMoneyTransaction }: { data: WorkspaceData; query: string; addMoneyTransaction: (event: FormEvent<HTMLFormElement>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const debits = data.debits.filter((item) => matchesTransaction(item, query));
  const credits = data.credits.filter((item) => matchesTransaction(item, query));
  const salaryPayments = data.salaryPayments.filter((item) =>
    matchesQuery(query, [item.staff_name, item.salary_month, item.payment_date, item.payment_method, item.bonus_type, item.paid_amount, item.bonus_amount, item.due_salary]),
  );
  const allExpenses = [
    ...data.homeExpenses.map((item) => ({ ...item, label: `${item.home} home`, date: item.expense_date })),
    ...data.others.map((item) => ({ ...item, label: item.category, date: item.record_date })),
  ].filter((item) =>
    matchesQuery(query, [
      item.date,
      item.label,
      item.amount,
      "home" in item ? item.home : undefined,
      "paid_by" in item ? item.paid_by : undefined,
      "description" in item ? item.description : undefined,
      item.payment_method,
      "notes" in item ? item.notes : undefined,
      "type" in item ? item.type : "Expense",
    ]),
  );
  return (
    <section className="page-stack">
      <PageTitle eyebrow="Finance" title="Debit, Credit, Salary, Home Expenses and Others" action={<button onClick={() => setShowForm((current) => !current)}><Calculator size={16} /> Add Transaction</button>} />
      {showForm && (
        <Panel title="Add Transaction">
          <form className="form-grid" onSubmit={addMoneyTransaction}>
            <SelectField name="transaction_type" label="Type" options={["Debit", "Credit"]} defaultValue="Debit" />
            <Field name="transaction_date" label="Date" type="date" defaultValue={todayISO()} required />
            <Field name="category" label="Category" required />
            <Field name="amount" label="Amount" type="number" defaultValue={0} required />
            <SelectField name="payment_method" label="Payment Method" options={paymentMethods} defaultValue="Cash" />
            <Field name="person" label="Paid To / From" required />
            <Field name="purpose" label="Purpose" required />
            <Field name="added_by" label="Added By" defaultValue="Owner" />
            <Field name="notes" label="Notes" />
            <div className="button-row full">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit"><Calculator size={16} /> Save Transaction</button>
            </div>
          </form>
        </Panel>
      )}
      <div className="split-grid">
        <Panel title="Debit Transactions">
          <Table headers={["Date", "Category", "Paid To", "Purpose", "Amount", "Method"]} rows={debits.map((item) => [item.transaction_date, item.category, item.person, item.purpose, formatBDT(item.amount), item.payment_method])} />
        </Panel>
        <Panel title="Credit Transactions">
          <Table headers={["Date", "Category", "From", "Purpose", "Amount", "Method"]} rows={credits.map((item) => [item.transaction_date, item.category, item.person, item.purpose, formatBDT(item.amount), item.payment_method])} />
        </Panel>
      </div>
      <div className="split-grid">
        <Panel title="Salary and Bonus">
          <Table headers={["Staff", "Month", "Paid", "Bonus", "Due", "Method"]} rows={salaryPayments.map((item) => [item.staff_name, item.salary_month, formatBDT(item.paid_amount), formatBDT(item.bonus_amount), formatBDT(item.due_salary), item.payment_method])} />
        </Panel>
        <Panel title="Home and Other Records">
          <Table headers={["Date", "Category", "Amount", "Type"]} rows={allExpenses.map((item) => [item.date, item.label, formatBDT(item.amount), "type" in item ? item.type : "Expense"])} />
        </Panel>
      </div>
    </section>
  );
}

function CustomersModule({ data, query, addCustomer }: { data: WorkspaceData; query: string; addCustomer: (event: FormEvent<HTMLFormElement>) => void }) {
  const [showForm, setShowForm] = useState(false);
  const customers = data.customers.filter((customer) => matchesCustomer(customer, data, query));
  return (
    <section className="page-stack">
      <PageTitle eyebrow="Customers" title="Customer Profiles and Due History" action={<button onClick={() => setShowForm((current) => !current)}><Users size={16} /> Add Customer</button>} />
      {showForm && (
        <Panel title="Add Customer">
          <form className="form-grid" onSubmit={addCustomer}>
            <Field name="name" label="Customer Name" required />
            <Field name="phone" label="Phone" required />
            <Field name="alternative_phone" label="Alternative Phone" />
            <Field name="address" label="Address" required />
            <Field name="nid_number" label="NID Number" />
            <SelectField name="status" label="Status" options={["Regular", "Good Payer", "Risky", "Blacklisted"]} defaultValue="Regular" />
            <Field name="notes" label="Notes" />
            <div className="button-row full">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit"><Users size={16} /> Save Customer</button>
            </div>
          </form>
        </Panel>
      )}
      <Panel title="Customer Directory">
        <Table
          headers={["Customer", "Address", "Status", "Sales", "Active Due", "Service Records"]}
          rows={customers.map((customer) => [
            customerCell(customer.name, customer.phone),
            customer.address,
            <StatusBadge value={customer.status} />,
            data.sales.filter((sale) => sale.customer_id === customer.id).length,
            formatBDT(data.dues.filter((due) => due.customer_id === customer.id).reduce((sum, due) => sum + due.remaining_due, 0)),
            data.services.filter((service) => service.customer_id === customer.id).length,
          ])}
        />
      </Panel>
    </section>
  );
}

function ReportsModule({ data, metrics, expenses, query }: { data: WorkspaceData; metrics: ReturnType<typeof dashboardMetrics>; expenses: ReturnType<typeof expenseCategorySeries>; query: string }) {
  const reportCards = [
    ["Gross sales profit", formatBDT(data.sales.reduce((sum, sale) => sum + sale.profit, 0))],
    ["Total due amount", formatBDT(metrics.totalDue)],
    ["Stock valuation", formatBDT(data.bikes.filter((bike) => bike.current_status === "Available").reduce((sum, bike) => sum + bike.purchase_price, 0))],
    ["Parts valuation", formatBDT(data.parts.reduce((sum, part) => sum + part.quantity_available * part.purchase_price_per_unit, 0))],
    ["Net cash balance", formatBDT(metrics.netCash)],
    ["Monthly profit/loss", formatBDT(metrics.monthlyProfit)],
  ].filter(([title, value]) => matchesQuery(query, [title, value]));
  const filteredExpenses = expenses.filter((item) => matchesQuery(query, [item.name, item.value, formatBDT(item.value)]));
  return (
    <section className="page-stack">
      <PageTitle eyebrow="Reports" title="Business Reports" action={<button onClick={() => window.print()}><FileDown size={16} /> Export PDF</button>} />
      <div className="mini-grid">{reportCards.map(([title, value]) => <Metric key={title} title={title} value={value} />)}</div>
      <Panel title="Expense Breakdown">
        <Table headers={["Category", "Amount"]} rows={filteredExpenses.map((item) => [item.name, formatBDT(item.value)])} />
      </Panel>
    </section>
  );
}

function BackupModule({ data, query }: { data: WorkspaceData; query: string }) {
  const json = JSON.stringify(data, null, 2);
  const needle = normalizeQuery(query);
  const visibleJson = needle
    ? json
        .split("\n")
        .filter((line) => line.toLowerCase().includes(needle))
        .slice(0, 200)
        .join("\n")
    : json.slice(0, 2200);
  return (
    <section className="page-stack">
      <PageTitle eyebrow="Backup" title="Backup and Export" action={<button onClick={() => navigator.clipboard.writeText(json)}><ClipboardList size={16} /> Copy Backup JSON</button>} />
      <Panel title="Backup Controls">
        <div className="backup-grid">
          <ActionTile icon={DatabaseBackup} title="Manual Backup" text="Create a JSON snapshot of all loaded business data." />
          <ActionTile icon={FileDown} title="Excel Export" text="Use Supabase data export or wire this action to an Edge Function." />
          <ActionTile icon={ShieldCheck} title="Cloud Backup" text="Supabase keeps hosted Postgres backups by plan." />
          <ActionTile icon={LogIn} title="Restore" text="Restore should be owner-only and audited." />
        </div>
        <textarea className="backup-json" readOnly value={visibleJson} />
      </Panel>
    </section>
  );
}

function ActivityModule({
  activity,
  role,
  createUser,
  createUserError,
  createUserSuccess,
  query,
}: {
  activity: ActivityLog[];
  role: Role;
  createUser: (event: FormEvent<HTMLFormElement>) => void;
  createUserError: string | null;
  createUserSuccess: string | null;
  query: string;
}) {
  const filteredActivity = activity.filter((item) => matchesActivity(item, query));
  return (
    <section className="page-stack">
      <PageTitle eyebrow="Activity Log" title="Audit Trail" />
      {role === "owner" && (
        <Panel title="Owner User Management">
          <form className="form-grid" onSubmit={createUser}>
            <Field name="display_name" label="Staff Name" autoComplete="off" required />
            <Field name="new_user_email" label="User ID / Email" type="email" autoComplete="off" required />
            <Field name="new_user_password" label="Temporary Password" type="password" autoComplete="new-password" required />
            <SelectField name="role" label="Role" options={["manager", "accountant", "staff"]} defaultValue="staff" />
            {createUserError && <div className="full"><Banner tone="danger">{createUserError}</Banner></div>}
            {createUserSuccess && <div className="full"><div className="success-banner">{createUserSuccess}</div></div>}
            <div className="button-row full">
              <button type="reset" className="secondary">Clear</button>
              <button type="submit">
                <Users size={16} /> Create User
              </button>
            </div>
          </form>
        </Panel>
      )}
      <Panel title="Recent Actions">
        <Table headers={["Time", "Actor", "Entity", "Action"]} rows={filteredActivity.map((item) => [new Date(item.created_at).toLocaleString(), item.actor, item.entity, item.action])} />
      </Panel>
    </section>
  );
}

function PageTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <article className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Table({ headers, rows, empty = "No records found." }: { headers: string[]; rows: React.ReactNode[][]; empty?: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="empty">{empty}</td></tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Tabs({ value, onChange, tabs }: { value: string; onChange: (value: string) => void; tabs: [string, string][] }) {
  return (
    <div className="tabs">
      {tabs.map(([id, label]) => (
        <button key={id} className={value === id ? "active" : ""} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} required={required} autoComplete={autoComplete} />
    </label>
  );
}

function SelectField({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="section-title">{title}</h3>;
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase().replace(/\s+/g, "-");
  return <span className={`badge ${normalized}`}>{value}</span>;
}

function Banner({ tone, children }: { tone: "warning" | "danger"; children: React.ReactNode }) {
  return (
    <div className={`banner ${tone}`}>
      <AlertTriangle size={16} />
      <span>{children}</span>
    </div>
  );
}

function ActionTile({ icon: Icon, title, text }: { icon: typeof Home; title: string; text: string }) {
  return (
    <article className="action-tile">
      <Icon size={20} />
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      <ChevronRight size={16} />
    </article>
  );
}

function customerCell(name: string, phone: string) {
  return (
    <div className="customer-cell">
      <strong>{name}</strong>
      <span>{phone}</span>
    </div>
  );
}
