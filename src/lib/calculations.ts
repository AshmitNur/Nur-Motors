import type { BikeSale, DueRecord, HomeExpense, MoneyTransaction, OtherRecord, Part, ServiceRecord, WorkspaceData } from "../types";

export function formatBDT(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function calcBikeProfit(input: Pick<BikeSale, "selling_price" | "purchase_price" | "discount" | "additional_sale_expense">) {
  return input.selling_price - input.purchase_price - input.discount - input.additional_sale_expense;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function dueStatus(due: DueRecord): DueRecord["payment_status"] {
  if (due.remaining_due <= 0) return "Paid";
  if (new Date(todayISO()) > new Date(due.due_date)) return "Overdue";
  if (due.remaining_due < due.due_amount) return "Partially Paid";
  return "Pending";
}

export function daysUntil(date: string) {
  const now = new Date(todayISO()).getTime();
  const then = new Date(date).getTime();
  return Math.ceil((then - now) / 86400000);
}

export function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

export function dashboardMetrics(data: WorkspaceData) {
  const currentMonth = todayISO().slice(0, 7);
  const currentYear = todayISO().slice(0, 4);
  const salesToday = data.sales.filter((sale) => sale.sale_date === todayISO());
  const salesMonth = data.sales.filter((sale) => sale.sale_date.startsWith(currentMonth));
  const salesYear = data.sales.filter((sale) => sale.sale_date.startsWith(currentYear));
  const credits = sumBy(data.credits, (item) => item.amount);
  const debits = sumBy(data.debits, (item) => item.amount);
  const monthlyExpenses =
    sumBy(data.debits.filter((item) => item.transaction_date.startsWith(currentMonth)), (item) => item.amount) +
    sumBy(data.homeExpenses.filter((item) => item.expense_date.startsWith(currentMonth)), (item) => item.amount) +
    sumBy(data.others.filter((item) => item.type === "Expense" && item.record_date.startsWith(currentMonth)), (item) => item.amount);
  const monthlyProfit =
    sumBy(salesMonth, (sale) => sale.profit) +
    sumBy(data.services.filter((service) => service.service_date.startsWith(currentMonth)), serviceProfit) -
    monthlyExpenses;

  return {
    salesToday: salesToday.length,
    salesMonth: salesMonth.length,
    salesYear: salesYear.length,
    serviceIncome: sumBy(data.services, (service) => service.paid_amount),
    totalDue: sumBy(data.dues, (due) => due.remaining_due),
    dueToday: data.dues.filter((due) => due.due_date === todayISO() && due.remaining_due > 0).length,
    upcomingDues: data.dues.filter((due) => daysUntil(due.due_date) > 0 && daysUntil(due.due_date) <= 7 && due.remaining_due > 0).length,
    overdueDues: data.dues.filter((due) => dueStatus(due) === "Overdue").length,
    totalDebit: debits,
    totalCredit: credits,
    netCash: credits - debits,
    monthlyProfit,
    monthlyExpenses,
    availableBikeStock: data.bikes.filter((bike) => bike.current_status === "Available").length,
    availablePartsStock: sumBy(data.parts, (part) => part.quantity_available),
    lowStockParts: data.parts.filter(isLowStock).length,
    staffSalaryDue: sumBy(data.staff, (staff) => staff.salary_due),
    dhakaHomeExpense: sumBy(data.homeExpenses.filter((expense) => expense.home === "Dhaka"), (expense) => expense.amount),
    dinajpurHomeExpense: sumBy(data.homeExpenses.filter((expense) => expense.home === "Dinajpur"), (expense) => expense.amount),
    otherExpenses: sumBy(data.others.filter((item) => item.type === "Expense"), (item) => item.amount),
  };
}

export function serviceProfit(service: ServiceRecord) {
  return service.service_charge + Math.max(service.parts_cost * 0.18, 0);
}

export function isLowStock(part: Part) {
  return part.quantity_available <= part.minimum_stock_level;
}

export function monthlySeries(data: WorkspaceData) {
  const months = Array.from(
    new Set([
      ...data.sales.map((item) => monthKey(item.sale_date)),
      ...data.services.map((item) => monthKey(item.service_date)),
      ...data.credits.map((item) => monthKey(item.transaction_date)),
      ...data.debits.map((item) => monthKey(item.transaction_date)),
    ]),
  ).sort();

  return months.map((month) => {
    const sales = data.sales.filter((item) => monthKey(item.sale_date) === month);
    const credits = data.credits.filter((item) => monthKey(item.transaction_date) === month);
    const debits = data.debits.filter((item) => monthKey(item.transaction_date) === month);
    return {
      month,
      sales: sales.length,
      revenue: sumBy(credits, (item) => item.amount),
      profit: sumBy(sales, (item) => item.profit) - sumBy(debits, (item) => item.amount),
    };
  });
}

export function expenseCategorySeries(debits: MoneyTransaction[], homeExpenses: HomeExpense[], others: OtherRecord[]) {
  const totals = new Map<string, number>();
  for (const item of debits) totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
  for (const item of homeExpenses) totals.set(`${item.home} home`, (totals.get(`${item.home} home`) ?? 0) + item.amount);
  for (const item of others.filter((record) => record.type === "Expense")) totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
  return Array.from(totals, ([name, value]) => ({ name, value }));
}
