export type Role = "owner" | "manager" | "accountant" | "staff";
export type PaymentMethod = "Cash" | "Bank" | "bKash" | "Nagad" | "Cheque";
export type PaymentStatus = "Pending" | "Partially Paid" | "Paid" | "Overdue";
export type BikeStatus = "Available" | "Sold" | "Reserved" | "Damaged";

export interface Staff {
  id: string;
  name: string;
  role: Role | "mechanic" | "salesperson";
  monthly_salary: number;
  salary_due: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alternative_phone?: string;
  address: string;
  nid_number?: string;
  status: "Regular" | "Good Payer" | "Risky" | "Blacklisted";
  notes?: string;
}

export interface Bike {
  id: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  chassis_number: string;
  engine_number: string;
  purchase_price: number;
  supplier_name: string;
  purchase_date: string;
  current_status: BikeStatus;
  location: string;
}

export interface Part {
  id: string;
  part_name: string;
  category: string;
  brand: string;
  quantity_available: number;
  purchase_price_per_unit: number;
  selling_price_per_unit: number;
  supplier_name: string;
  minimum_stock_level: number;
  location: string;
}

export interface BikeSale {
  id: string;
  sale_no: string;
  sale_date: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  bike_id?: string;
  bike_brand: string;
  bike_model: string;
  bike_color: string;
  chassis_number: string;
  engine_number: string;
  registration_number?: string;
  purchase_price: number;
  selling_price: number;
  discount: number;
  additional_sale_expense: number;
  paid_amount: number;
  due_amount: number;
  profit: number;
  payment_type: "Full Payment" | "Partial Payment" | "Loan";
  payment_method: PaymentMethod;
  salesperson: string;
  notes?: string;
}

export interface DueRecord {
  id: string;
  sale_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  bike_details: string;
  total_selling_price: number;
  paid_amount: number;
  due_amount: number;
  remaining_due: number;
  due_date: string;
  installment_type: "One-time" | "Multiple installments";
  installment_amount: number;
  payment_status: PaymentStatus;
  last_payment_date?: string;
  next_payment_date?: string;
  payment_method: PaymentMethod;
  guarantor_name?: string;
  guarantor_phone?: string;
  notes?: string;
}

export interface DuePayment {
  id: string;
  due_record_id: string;
  payment_date: string;
  amount_received: number;
  payment_method: PaymentMethod;
  received_by: string;
  previous_due: number;
  remaining_due: number;
  receipt_number: string;
  notes?: string;
}

export interface ServiceRecord {
  id: string;
  service_no: string;
  service_date: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  bike_brand: string;
  bike_model: string;
  service_type: string;
  parts_used: string;
  service_charge: number;
  parts_cost: number;
  total_bill: number;
  paid_amount: number;
  due_amount: number;
  payment_method: PaymentMethod;
  mechanic_name: string;
  notes?: string;
}

export interface MoneyTransaction {
  id: string;
  transaction_date: string;
  category: string;
  amount: number;
  payment_method: PaymentMethod;
  person: string;
  purpose: string;
  related_module?: string;
  added_by: string;
  notes?: string;
}

export interface SalaryPayment {
  id: string;
  staff_id: string;
  staff_name: string;
  salary_month: string;
  bonus_amount: number;
  bonus_type?: string;
  payment_date: string;
  paid_amount: number;
  due_salary: number;
  payment_method: PaymentMethod;
}

export interface HomeExpense {
  id: string;
  home: "Dhaka" | "Dinajpur";
  expense_date: string;
  category: string;
  amount: number;
  paid_by: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface OtherRecord {
  id: string;
  record_date: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  description: string;
  payment_method: PaymentMethod;
  added_by: string;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  created_at: string;
}

export interface WorkspaceData {
  staff: Staff[];
  customers: Customer[];
  bikes: Bike[];
  parts: Part[];
  sales: BikeSale[];
  dues: DueRecord[];
  duePayments: DuePayment[];
  services: ServiceRecord[];
  debits: MoneyTransaction[];
  credits: MoneyTransaction[];
  salaryPayments: SalaryPayment[];
  homeExpenses: HomeExpense[];
  others: OtherRecord[];
  activity: ActivityLog[];
}
