import { jsPDF } from "jspdf";
import type { BikeSale, DuePayment, DueRecord, WorkspaceData } from "../types";
import { dashboardMetrics, dueStatus, formatBDT, isLowStock, monthlySeries, todayISO } from "./calculations";

const company = {
  name: "Nur Motors & Electronics",
  subtitle: "Suzuki Bikes Sales & Service",
  note: "Official business invoice",
};

const page = {
  width: 210,
  margin: 14,
  right: 196,
};

function money(value: number) {
  return formatBDT(value).replace("BDT", "BDT ");
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number, width = 80) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(value || "-", width), x, y + 5);
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(page.margin, y, page.width - page.margin * 2, 9, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), page.margin + 3, y + 6);
}

function simpleTable(doc: jsPDF, rows: [string, string][], x: number, y: number, width: number, rowHeight = 9) {
  rows.forEach(([label, value], index) => {
    const rowY = y + index * rowHeight;
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, rowY, width, rowHeight);
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(x, rowY, width, rowHeight, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, rowY, width, rowHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, x + 3, rowY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(String(value || "-"), x + width * 0.46, rowY + 6);
  });
}

function drawHeader(doc: jsPDF, title: string, documentNo: string, status: string) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, page.width, 34, "F");
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(page.margin, 9, 15, 15, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text("NM", page.margin + 3.6, 18.7);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(company.name, page.margin + 20, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(company.subtitle, page.margin + 20, 21);
  doc.text(company.note, page.margin + 20, 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, page.right, 15, { align: "right" });
  doc.setFontSize(9);
  doc.text(documentNo, page.right, 22, { align: "right" });
  doc.setFillColor(status === "Paid" ? 220 : 254, status === "Paid" ? 252 : 243, status === "Paid" ? 231 : 199);
  doc.roundedRect(page.right - 34, 25, 34, 7, 3.5, 3.5, "F");
  doc.setTextColor(status === "Paid" ? 22 : 146, status === "Paid" ? 101 : 64, status === "Paid" ? 52 : 14);
  doc.setFontSize(8);
  doc.text(status.toUpperCase(), page.right - 17, 30, { align: "center" });
}

function footer(doc: jsPDF) {
  doc.setDrawColor(226, 232, 240);
  doc.line(page.margin, 270, page.right, 270);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("This invoice was generated electronically from the Nur Motors & Electronics business system.", page.margin, 276);
  doc.text("Customer Signature", page.margin, 290);
  doc.text("Authorized Signature", page.right, 290, { align: "right" });
  doc.line(page.margin, 286, page.margin + 45, 286);
  doc.line(page.right - 45, 286, page.right, 286);
}

function documentFooter(doc: jsPDF, text = "Generated electronically from the Nur Motors & Electronics business system.") {
  doc.setDrawColor(226, 232, 240);
  doc.line(page.margin, 282, page.right, 282);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(text, page.margin, 288);
  doc.text(`Generated: ${new Date().toLocaleString()}`, page.right, 288, { align: "right" });
}

function addPageIfNeeded(doc: jsPDF, y: number, neededHeight: number) {
  if (y + neededHeight <= 274) return y;
  documentFooter(doc);
  doc.addPage();
  return 44;
}

function summaryMetricGrid(doc: jsPDF, items: [string, string, string][], startY: number) {
  const colWidth = 58;
  const rowHeight = 22;
  const gap = 4;
  let y = startY;
  items.forEach(([label, value, meta], index) => {
    if (index > 0 && index % 3 === 0) y += rowHeight + gap;
    y = addPageIfNeeded(doc, y, rowHeight);
    const x = page.margin + (index % 3) * (colWidth + gap);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, colWidth, rowHeight, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 3, y + 5);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x + 3, y + 12.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(meta, x + 3, y + 18.5);
  });
  return y + rowHeight + gap;
}

function dataTable(doc: jsPDF, headers: string[], rows: string[][], x: number, y: number, widths: number[]) {
  const rowHeight = 8;
  y = addPageIfNeeded(doc, y, rowHeight * 2);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(x, y, widths.reduce((sum, width) => sum + width, 0), rowHeight, "FD");
  let cellX = x;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  headers.forEach((header, index) => {
    doc.text(header.toUpperCase(), cellX + 2, y + 5.5);
    cellX += widths[index];
  });
  y += rowHeight;

  const visibleRows = rows.length ? rows : [["No records found."]];
  for (const row of visibleRows) {
    y = addPageIfNeeded(doc, y, rowHeight);
    cellX = x;
    doc.setFillColor(row === visibleRows[0] ? 255 : 248, row === visibleRows[0] ? 255 : 250, row === visibleRows[0] ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, y, widths.reduce((sum, width) => sum + width, 0), rowHeight, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    row.forEach((cell, index) => {
      doc.text(doc.splitTextToSize(String(cell ?? "-"), widths[index] - 4).slice(0, 1), cellX + 2, y + 5.5);
      cellX += widths[index];
    });
    y += rowHeight;
  }
  return y + 4;
}

export function downloadBikeSaleInvoice(sale: BikeSale, due?: DueRecord, payments: DuePayment[] = []) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const status = due ? dueStatus(due) : sale.due_amount > 0 ? "Partially Paid" : "Paid";
  const invoiceNo = `INV-${sale.sale_no.replace(/^SALE-/, "")}`;
  const netSale = sale.selling_price - sale.discount;

  drawHeader(doc, "Tax Invoice", invoiceNo, status);

  labelValue(doc, "Invoice Date", sale.sale_date, page.margin, 45, 40);
  labelValue(doc, "Sale ID", sale.sale_no, 58, 45, 42);
  labelValue(doc, "Payment Method", sale.payment_method, 103, 45, 38);
  labelValue(doc, "Salesperson", sale.salesperson, 148, 45, 46);

  sectionTitle(doc, "Bill To", 64);
  labelValue(doc, "Customer Name", sale.customer_name, page.margin + 3, 79, 80);
  labelValue(doc, "Phone", sale.customer_phone, 103, 79, 40);
  labelValue(doc, "Payment Type", sale.payment_type, 148, 79, 45);

  sectionTitle(doc, "Suzuki Bike Details", 99);
  simpleTable(
    doc,
    [
      ["Company", sale.bike_brand],
      ["Model", sale.bike_model],
      ["Color", sale.bike_color],
      ["Chassis Number", sale.chassis_number],
      ["Engine Number", sale.engine_number],
      ["Registration Number", sale.registration_number ?? "-"],
    ],
    page.margin,
    113,
    88,
  );

  simpleTable(
    doc,
    [
      ["Selling Price", money(sale.selling_price)],
      ["Discount", money(sale.discount)],
      ["Net Sale Price", money(netSale)],
      ["Paid Amount", money(sale.paid_amount)],
      ["Due Amount", money(sale.due_amount)],
      ["Current Balance", money(due?.remaining_due ?? sale.due_amount)],
    ],
    108,
    113,
    88,
  );

  sectionTitle(doc, "Due and Payment Details", 173);
  simpleTable(
    doc,
    [
      ["Due Date", due?.due_date ?? "-"],
      ["Installment Type", due?.installment_type ?? "-"],
      ["Installment Amount", due ? money(due.installment_amount) : "-"],
      ["Last Payment Date", due?.last_payment_date ?? "-"],
      ["Total Payments Recorded", String(payments.length)],
    ],
    page.margin,
    187,
    88,
  );

  const recentPayments = payments.slice(0, 5);
  simpleTable(
    doc,
    recentPayments.length
      ? recentPayments.map((payment) => [payment.receipt_number, `${payment.payment_date} - ${money(payment.amount_received)}`])
      : [["Payment History", "No separate due payments recorded"]],
    108,
    187,
    88,
  );

  sectionTitle(doc, "Terms", 239);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    doc.splitTextToSize(
      "Please verify chassis and engine numbers before delivery. Warranty, registration, and service conditions follow the official Suzuki policy and the written terms provided at sale.",
      page.width - page.margin * 2 - 6,
    ),
    page.margin + 3,
    252,
  );

  footer(doc);
  doc.save(`${sanitizeFileName(company.name)}-${sanitizeFileName(invoiceNo)}.pdf`);
}

export function downloadDueReceipt(due: DueRecord, payments: DuePayment[] = []) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const latestPayment = payments[0];
  const receiptNo = latestPayment?.receipt_number ?? `DUE-${due.id.slice(0, 8).toUpperCase()}`;
  const status = dueStatus(due);

  drawHeader(doc, "Payment Receipt", receiptNo, status);
  labelValue(doc, "Receipt Date", latestPayment?.payment_date ?? todayISO(), page.margin, 45, 40);
  labelValue(doc, "Customer", due.customer_name, 58, 45, 60);
  labelValue(doc, "Phone", due.customer_phone, 123, 45, 34);
  labelValue(doc, "Method", latestPayment?.payment_method ?? due.payment_method, 164, 45, 30);

  sectionTitle(doc, "Payment Summary", 65);
  simpleTable(
    doc,
    [
      ["Bike", due.bike_details],
      ["Total Selling Price", money(due.total_selling_price)],
      ["Previously Paid", money(latestPayment?.previous_due ? due.total_selling_price - latestPayment.previous_due : due.paid_amount)],
      ["Amount Received", latestPayment ? money(latestPayment.amount_received) : "-"],
      ["Remaining Due", money(due.remaining_due)],
      ["Received By", latestPayment?.received_by ?? "-"],
    ],
    page.margin,
    80,
    page.width - page.margin * 2,
  );

  footer(doc);
  doc.save(`${sanitizeFileName(company.name)}-${sanitizeFileName(receiptNo)}.pdf`);
}

export function downloadBusinessSummary(data: WorkspaceData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const metrics = dashboardMetrics(data);
  const months = monthlySeries(data).slice(-6);
  const overdue = data.dues.filter((due) => dueStatus(due) === "Overdue").slice(0, 10);
  const lowStock = data.parts.filter(isLowStock).slice(0, 10);
  const reportNo = `SUM-${todayISO().replace(/-/g, "")}`;

  drawHeader(doc, "Business Summary", reportNo, "Summary");
  labelValue(doc, "Business", company.name, page.margin, 45, 70);
  labelValue(doc, "Scope", "Suzuki bikes sales, service, inventory and finance", 88, 45, 70);
  labelValue(doc, "Report Date", todayISO(), 164, 45, 30);

  sectionTitle(doc, "Key Performance Indicators", 64);
  let y = summaryMetricGrid(
    doc,
    [
      ["Sales Today", `${metrics.salesToday}`, "bikes"],
      ["Sales This Month", `${metrics.salesMonth}`, "bikes"],
      ["Sales This Year", `${metrics.salesYear}`, "bikes"],
      ["Service Income", money(metrics.serviceIncome), "received"],
      ["Total Due", money(metrics.totalDue), "open balance"],
      ["Due Today", `${metrics.dueToday}`, "customers"],
      ["Upcoming Dues", `${metrics.upcomingDues}`, "next 7 days"],
      ["Overdue Payments", `${metrics.overdueDues}`, "needs action"],
      ["Monthly Profit", money(metrics.monthlyProfit), "estimate"],
      ["Bike Stock", `${metrics.availableBikeStock}`, "available"],
      ["Parts Stock", `${metrics.availablePartsStock}`, "units"],
      ["Low Stock Parts", `${metrics.lowStockParts}`, "alerts"],
    ],
    78,
  );

  y = addPageIfNeeded(doc, y + 4, 54);
  sectionTitle(doc, "Financial Summary", y);
  simpleTable(
    doc,
    [
      ["Total Credit", money(metrics.totalCredit)],
      ["Total Debit", money(metrics.totalDebit)],
      ["Net Cash", money(metrics.netCash)],
      ["Monthly Expenses", money(metrics.monthlyExpenses)],
      ["Salary Due", money(metrics.staffSalaryDue)],
      ["Other Expenses", money(metrics.otherExpenses)],
    ],
    page.margin,
    y + 14,
    88,
  );
  simpleTable(
    doc,
    [
      ["Dhaka Home Expense", money(metrics.dhakaHomeExpense)],
      ["Dinajpur Home Expense", money(metrics.dinajpurHomeExpense)],
      ["Total Customers", `${data.customers.length}`],
      ["Total Services", `${data.services.length}`],
      ["Bike Records", `${data.bikes.length}`],
      ["Parts Records", `${data.parts.length}`],
    ],
    108,
    y + 14,
    88,
  );
  y += 76;

  y = addPageIfNeeded(doc, y, 48);
  sectionTitle(doc, "Recent Monthly Trend", y);
  y = dataTable(
    doc,
    ["Month", "Sales", "Revenue", "Profit"],
    months.map((month) => [month.month, String(month.sales), money(month.revenue), money(month.profit)]),
    page.margin,
    y + 14,
    [44, 30, 54, 54],
  );

  y = addPageIfNeeded(doc, y, 48);
  sectionTitle(doc, "Overdue Payments", y);
  y = dataTable(
    doc,
    ["Customer", "Bike", "Due Date", "Remaining"],
    overdue.map((due) => [due.customer_name, due.bike_details, due.due_date, money(due.remaining_due)]),
    page.margin,
    y + 14,
    [42, 72, 32, 36],
  );

  y = addPageIfNeeded(doc, y, 48);
  sectionTitle(doc, "Low Stock Parts", y);
  dataTable(
    doc,
    ["Part", "Category", "Stock", "Minimum"],
    lowStock.map((part) => [part.part_name, part.category, String(part.quantity_available), String(part.minimum_stock_level)]),
    page.margin,
    y + 14,
    [70, 46, 30, 36],
  );

  documentFooter(doc);
  doc.save(`${sanitizeFileName(company.name)}-${reportNo}.pdf`);
}
