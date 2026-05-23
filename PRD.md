# Product Requirements Document (PRD)

## Motorbike Business Management System

---

## 1. Product Overview

The Motorbike Business Management System is a business management software designed for a motorbike business that needs to track bike sales, profits, customer dues, service income, stock, salaries, expenses, and daily financial activities.

The system will help the business owner and staff manage operations in one place instead of relying on notebooks, spreadsheets, or manual calculations.

A major feature of the software is **Loan / Due Payment Tracking**. When a bike is sold and the customer does not pay the full amount, the remaining balance will be recorded as due. The system will track the due amount, agreed payment date, payment history, overdue status, and collection records.

---

## 2. Purpose of the Software

The purpose of the software is to make motorbike business management easier, faster, and more accurate.

The system should help the business answer important questions such as:

- How many bikes were sold today, this month, and this year?
- How much profit was made from each bike sale?
- Which customers still have due payments?
- Which due payments are overdue?
- What is the current bike stock?
- What is the current parts stock?
- How much money came in as credit?
- How much money went out as debit?
- How much was spent on staff salary and bonus?
- How much was spent on Dhaka home expenses?
- How much was spent on Dinajpur home expenses?
- What is the monthly profit or loss?

---

## 3. Business Goals

The software should achieve the following goals:

1. Track all bike sales accurately.
2. Track full and partial payments from customers.
3. Track due amounts after selling bikes on loan.
4. Send reminders or alerts for upcoming and overdue payments.
5. Maintain updated bike stock.
6. Maintain updated parts stock.
7. Track service income and service-related costs.
8. Record all debit and credit transactions.
9. Track staff salary and bonus payments.
10. Track Dhaka home expenses separately.
11. Track Dinajpur home expenses separately.
12. Track miscellaneous income and expenses under Others.
13. Generate reports for sales, profit, due payments, stock, and expenses.
14. Reduce manual calculation errors.
15. Make the overall business seamless and easy to maintain.

---

## 4. Target Users

### 4.1 Business Owner

The owner has full access to the system.

The owner can:

- View all sales and profit reports.
- View due and overdue customers.
- Manage debit and credit records.
- Manage stock.
- Manage salary and bonus.
- View all expense categories.
- Approve deletions and sensitive edits.
- Export reports.

### 4.2 Manager

The manager handles daily operations.

The manager can:

- Add bike sales.
- Add service records.
- Add customer records.
- Update stock.
- Record customer payments.
- View operational reports.

### 4.3 Accountant

The accountant handles financial records.

The accountant can:

- Add debit records.
- Add credit records.
- Manage salary payments.
- Add expenses.
- Generate financial reports.

### 4.4 Staff / Salesperson

Staff members have limited access.

Staff can:

- Add basic customer details.
- Add service entries.
- Add sales entries if permitted.
- View assigned records.

---

## 5. Core Features

The software must include the following major features:

1. Bike Sales
2. Service
3. Loan / Due Payment Tracking
4. Debit
5. Credit
6. Bike Stock
7. Parts Stock
8. Staff Salary + Bonus
9. Dhaka Home Expenses
10. Dinajpur Home Expenses
11. Others
12. Dashboard
13. Customer Management
14. Reports
15. Invoice and Receipt Generation
16. User Roles and Permissions
17. Backup and Security

---

## 6. Dashboard

The dashboard should provide a quick overview of the entire business.

### 6.1 Dashboard Summary Cards

The dashboard should show:

- Total bike sales today
- Total bike sales this month
- Total bike sales this year
- Total service income
- Total due amount
- Due payments due today
- Upcoming due payments
- Overdue payments
- Total debit
- Total credit
- Net cash balance
- Monthly profit
- Monthly expenses
- Available bike stock
- Available parts stock
- Low stock parts
- Staff salary due
- Dhaka home expenses
- Dinajpur home expenses
- Other expenses

### 6.2 Dashboard Charts

The dashboard should include:

- Monthly sales chart
- Monthly profit/loss chart
- Due collection chart
- Expense category chart
- Bike stock status chart
- Parts stock status chart

---

## 7. Bike Sales Module

The Bike Sales module records every motorbike sold by the business.

### 7.1 Required Fields

| Field | Description |
|---|---|
| Sale ID | Auto-generated unique sale number |
| Sale Date | Date of sale |
| Customer Name | Buyer name |
| Customer Phone | Buyer phone number |
| Customer Address | Buyer address |
| Bike Brand | Brand of the bike |
| Bike Model | Model of the bike |
| Bike Color | Bike color |
| Chassis Number | Unique chassis number |
| Engine Number | Unique engine number |
| Registration Number | Optional registration number |
| Purchase Price | Cost price of the bike |
| Selling Price | Final selling price |
| Discount | Discount given to customer |
| Additional Sale Expense | Any extra cost related to the sale |
| Paid Amount | Amount paid during sale |
| Due Amount | Remaining unpaid amount |
| Payment Type | Full Payment / Partial Payment / Loan |
| Payment Method | Cash / Bank / bKash / Nagad / Cheque |
| Salesperson | Staff who handled the sale |
| Notes | Additional remarks |

### 7.2 Required Actions

The system should allow users to:

- Add a new bike sale.
- Edit a sale record.
- Delete a sale record with owner permission.
- View sale history.
- Search sale by customer, phone, chassis number, engine number, or Sale ID.
- Print bike sale invoice.
- Generate PDF invoice.
- Automatically update bike stock after sale.
- Automatically calculate bike sale profit.
- Automatically create a credit entry for the paid amount.
- Automatically create a loan/due record if there is an unpaid amount.

### 7.3 Profit Calculation

```text
Profit = Selling Price - Purchase Price - Discount - Additional Sale Expenses
```

Example:

```text
Selling Price = 250,000 BDT
Purchase Price = 220,000 BDT
Discount = 5,000 BDT
Additional Sale Expense = 2,000 BDT

Profit = 250,000 - 220,000 - 5,000 - 2,000
Profit = 23,000 BDT
```

---

## 8. Loan / Due Payment Module

The Loan / Due Payment module is one of the most important features of the software.

When a customer buys a bike but does not pay the full amount, the remaining amount will be recorded as due. A specific payment date will be set based on the agreement between the buyer and the business.

The system should track the full due lifecycle from sale creation to final payment collection.

### 8.1 Required Fields

| Field | Description |
|---|---|
| Loan/Due ID | Auto-generated unique ID |
| Sale ID | Connected bike sale |
| Customer Name | Auto-filled from sale |
| Customer Phone | Auto-filled from sale |
| Customer Address | Auto-filled from customer profile |
| Bike Details | Bike brand, model, chassis number, engine number |
| Total Selling Price | Final bike price |
| Paid Amount | Amount already paid |
| Due Amount | Remaining amount |
| Due Date | Agreed payment date |
| Installment Type | One-time / Multiple installments |
| Installment Amount | Amount per installment |
| Payment Status | Pending / Partially Paid / Paid / Overdue |
| Last Payment Date | Most recent payment date |
| Next Payment Date | Upcoming payment date |
| Payment Method | Cash / Bank / bKash / Nagad / Cheque |
| Guarantor Name | Optional guarantor |
| Guarantor Phone | Optional guarantor phone |
| Documents | NID, agreement paper, cheque photo, etc. |
| Notes | Extra remarks |

### 8.2 Due Date Tracking

The system should show all due payments according to date.

Required views:

- Due today
- Due this week
- Due this month
- Upcoming due payments
- Overdue payments
- Fully paid loans
- Partially paid loans

Example table:

| Customer | Bike | Due Amount | Due Date | Status |
|---|---:|---:|---|---|
| Rahim Uddin | Yamaha FZ | 80,000 BDT | 10 June 2026 | Pending |
| Karim Ahmed | Honda Livo | 35,000 BDT | 25 May 2026 | Overdue |

### 8.3 Overdue Status

The system should automatically mark a due payment as overdue if the due date has passed and the full amount has not been paid.

Logic:

```text
If today’s date is after the due date
AND remaining due amount is greater than 0,
then status = Overdue.
```

### 8.4 Payment Collection

When the customer pays part or all of the due amount, the system should allow the user to record the payment.

Required payment collection fields:

| Field | Description |
|---|---|
| Payment Date | Date of collection |
| Amount Received | Amount paid by customer |
| Payment Method | Cash / Bank / bKash / Nagad / Cheque |
| Received By | Staff who collected payment |
| Previous Due | Due before this payment |
| Remaining Due | Auto-calculated due after payment |
| Receipt Number | Auto-generated receipt number |
| Notes | Optional notes |

### 8.5 Partial Payment Logic

The system should support partial payments.

Example:

```text
Total Due = 100,000 BDT

Payment 1 = 30,000 BDT
Remaining Due = 70,000 BDT

Payment 2 = 50,000 BDT
Remaining Due = 20,000 BDT

Payment 3 = 20,000 BDT
Remaining Due = 0 BDT

Final Status = Paid
```

### 8.6 Customer Due History

Each customer should have a complete due history.

The system should show:

- Bike purchased
- Sale date
- Total price
- Initial paid amount
- Total due
- Payments made
- Payment dates
- Payment methods
- Remaining balance
- Overdue status
- Staff who collected each payment
- Notes and documents

### 8.7 Reminder System

The system should generate alerts for:

- Due payment coming in 7 days
- Due payment coming in 3 days
- Due payment due today
- Due payment overdue
- Customer missed payment multiple times

Reminder methods:

- Dashboard alert
- SMS reminder
- WhatsApp reminder
- Email reminder
- Printable due list

---

## 9. Service Module

The Service module records motorbike servicing activities.

### 9.1 Required Fields

| Field | Description |
|---|---|
| Service ID | Auto-generated service number |
| Service Date | Date of service |
| Customer Name | Customer name |
| Customer Phone | Contact number |
| Bike Brand | Bike brand |
| Bike Model | Bike model |
| Service Type | Oil change, repair, wash, tuning, etc. |
| Parts Used | Parts taken from stock |
| Service Charge | Labour or service charge |
| Parts Cost | Cost of parts used |
| Total Bill | Service charge + parts cost |
| Paid Amount | Amount paid |
| Due Amount | Remaining amount |
| Payment Method | Cash / Bank / Mobile Banking |
| Mechanic Name | Staff responsible |
| Notes | Additional details |

### 9.2 Required Actions

The system should allow users to:

- Add service record.
- Edit service record.
- Print service invoice.
- Track service payment.
- Track service due.
- Deduct used parts from parts stock.
- View service history by customer.
- View service history by bike.
- Show daily, monthly, and yearly service income.
- Show service profit.

---

## 10. Debit Module

Debit means money going out from the business.

### 10.1 Examples of Debit

- Bike purchase cost
- Parts purchase cost
- Staff salary
- Staff bonus
- Shop rent
- Utility bills
- Transport cost
- Dhaka home expenses
- Dinajpur home expenses
- Maintenance cost
- Other expenses

### 10.2 Required Fields

| Field | Description |
|---|---|
| Debit ID | Auto-generated debit number |
| Date | Transaction date |
| Category | Salary, stock purchase, home expense, others, etc. |
| Amount | Money paid |
| Payment Method | Cash / Bank / bKash / Nagad / Cheque |
| Paid To | Person, supplier, or company |
| Purpose | Reason for payment |
| Related Module | Optional link to stock, salary, expense, etc. |
| Added By | User who entered the record |
| Notes | Optional notes |

### 10.3 Required Actions

The system should allow users to:

- Add debit transaction.
- Edit debit transaction.
- Delete debit transaction with owner permission.
- Filter debit records by category.
- Filter debit records by date range.
- Generate debit report.
- Export debit records.

---

## 11. Credit Module

Credit means money coming into the business.

### 11.1 Examples of Credit

- Bike sale payment
- Due collection
- Service income
- Parts sale income
- Owner investment
- Other income

### 11.2 Required Fields

| Field | Description |
|---|---|
| Credit ID | Auto-generated credit number |
| Date | Transaction date |
| Category | Bike sale, due collection, service, parts sale, others |
| Amount | Money received |
| Payment Method | Cash / Bank / bKash / Nagad / Cheque |
| Received From | Customer or source |
| Related Sale ID | Optional linked sale |
| Related Service ID | Optional linked service |
| Added By | User who entered the record |
| Notes | Optional notes |

### 11.3 Required Actions

The system should allow users to:

- Add credit transaction.
- Edit credit transaction.
- Delete credit transaction with owner permission.
- Connect credit to bike sale.
- Connect credit to due payment.
- Connect credit to service payment.
- Generate credit report.
- Show total income by category.
- Export credit records.

---

## 12. Bike Stock Module

The Bike Stock module manages all available, sold, reserved, and damaged bikes.

### 12.1 Required Fields

| Field | Description |
|---|---|
| Bike ID | Auto-generated bike ID |
| Brand | Bike brand |
| Model | Bike model |
| Color | Bike color |
| Year | Manufacturing year |
| Chassis Number | Unique chassis number |
| Engine Number | Unique engine number |
| Purchase Price | Buying price |
| Supplier Name | Supplier or dealer name |
| Purchase Date | Date of bike purchase |
| Current Status | Available / Sold / Reserved / Damaged |
| Location | Showroom / Warehouse / Other |
| Notes | Optional notes |

### 12.2 Required Actions

The system should allow users to:

- Add new bike stock.
- Update bike details.
- Mark bike as available.
- Mark bike as sold.
- Mark bike as reserved.
- Mark bike as damaged.
- Track purchase cost.
- Search bike by chassis number.
- Search bike by engine number.
- View available stock.
- View sold stock.
- Generate stock valuation report.

### 12.3 Stock Valuation

```text
Total Bike Stock Value = Sum of Purchase Price of all available bikes
```

---

## 13. Parts Stock Module

The Parts Stock module tracks spare parts inventory.

### 13.1 Required Fields

| Field | Description |
|---|---|
| Part ID | Auto-generated part ID |
| Part Name | Name of part |
| Category | Oil, tyre, brake, chain, battery, etc. |
| Brand | Brand name |
| Quantity Available | Current stock |
| Purchase Price Per Unit | Cost price |
| Selling Price Per Unit | Selling price |
| Supplier Name | Supplier |
| Minimum Stock Level | Alert quantity |
| Location | Shelf or store location |
| Notes | Optional notes |

### 13.2 Required Actions

The system should allow users to:

- Add new parts.
- Update parts quantity.
- Deduct parts after service.
- Deduct parts after direct sale.
- Add parts after purchase.
- Show low stock alert.
- View parts stock report.
- View parts stock valuation.
- View parts profit report.

### 13.3 Low Stock Alert

```text
If available quantity is less than or equal to minimum stock level,
show low stock warning.
```

---

## 14. Staff Salary + Bonus Module

This module manages staff salary, bonus, and payment records.

### 14.1 Required Fields

| Field | Description |
|---|---|
| Staff ID | Auto-generated staff ID |
| Staff Name | Employee name |
| Role | Salesperson, mechanic, accountant, manager, etc. |
| Monthly Salary | Fixed monthly salary |
| Bonus Amount | Bonus amount |
| Bonus Type | Sales bonus, service bonus, festival bonus, special bonus |
| Payment Date | Salary or bonus payment date |
| Paid Amount | Amount paid |
| Due Salary | Remaining unpaid salary |
| Payment Method | Cash / Bank / Mobile Banking |
| Notes | Optional notes |

### 14.2 Required Actions

The system should allow users to:

- Add staff profile.
- Set monthly salary.
- Add bonus.
- Record salary payment.
- Record partial salary payment.
- Track unpaid salary.
- Generate monthly salary report.
- Show total staff cost.
- Link bonus to sales or service performance if needed.

---

## 15. Dhaka Home Expenses Module

This module separately tracks Dhaka home expenses.

### 15.1 Required Fields

| Field | Description |
|---|---|
| Expense ID | Auto-generated expense ID |
| Date | Expense date |
| Category | Rent, food, utility, transport, maintenance, others |
| Amount | Expense amount |
| Paid By | Person who paid |
| Payment Method | Cash / Bank / Mobile Banking |
| Notes | Optional notes |

### 15.2 Required Actions

The system should allow users to:

- Add Dhaka home expense.
- Edit Dhaka home expense.
- Delete with owner permission.
- Filter by month.
- Filter by category.
- Generate monthly Dhaka home expense report.
- Include Dhaka home expenses in total expense summary.

---

## 16. Dinajpur Home Expenses Module

This module separately tracks Dinajpur home expenses.

### 16.1 Required Fields

| Field | Description |
|---|---|
| Expense ID | Auto-generated expense ID |
| Date | Expense date |
| Category | Food, family support, utility, maintenance, transport, others |
| Amount | Expense amount |
| Paid By | Person who paid |
| Payment Method | Cash / Bank / Mobile Banking |
| Notes | Optional notes |

### 16.2 Required Actions

The system should allow users to:

- Add Dinajpur home expense.
- Edit Dinajpur home expense.
- Delete with owner permission.
- Filter by month.
- Filter by category.
- Generate monthly Dinajpur home expense report.
- Include Dinajpur home expenses in total expense summary.

---

## 17. Others Module

The Others module records miscellaneous income or expenses that do not fit into other categories.

### 17.1 Possible Categories

- Miscellaneous income
- Miscellaneous expense
- Owner withdrawal
- Emergency expense
- Document cost
- Legal cost
- Transport cost
- Gift or customer relation cost
- Office supplies
- Repair and maintenance
- Other business costs

### 17.2 Required Fields

| Field | Description |
|---|---|
| Other ID | Auto-generated ID |
| Date | Transaction date |
| Type | Income / Expense |
| Category | Custom category |
| Amount | Transaction amount |
| Description | Reason for transaction |
| Payment Method | Cash / Bank / Mobile Banking |
| Added By | User who added the record |
| Notes | Optional notes |

### 17.3 Required Actions

The system should allow users to:

- Add other income.
- Add other expense.
- Edit records.
- Delete records with owner permission.
- Filter by type.
- Filter by category.
- Generate others report.

---

## 18. Customer Management Module

The system should maintain detailed customer profiles.

### 18.1 Required Fields

| Field | Description |
|---|---|
| Customer ID | Auto-generated customer ID |
| Name | Customer name |
| Phone | Main phone number |
| Alternative Phone | Optional phone number |
| Address | Full address |
| NID Number | Optional NID number |
| Customer Photo | Optional image |
| Purchased Bikes | List of purchased bikes |
| Service History | List of service records |
| Due History | List of due payment records |
| Customer Status | Regular / Good Payer / Risky / Blacklisted |
| Notes | Optional notes |

### 18.2 Required Actions

The system should allow users to:

- Add customer profile.
- Edit customer profile.
- Search customer by name or phone.
- View sales history.
- View service history.
- View due history.
- Upload customer documents.
- Mark customer payment behavior.
- View all active dues under one customer.

---

## 19. Reports Module

The Reports module should generate clear business reports.

### 19.1 Sales Reports

- Daily sales report
- Monthly sales report
- Yearly sales report
- Sales by bike model
- Sales by salesperson
- Profit per bike
- Total gross profit
- Total discount report

### 19.2 Loan / Due Reports

- Total due amount
- Due today
- Due this week
- Due this month
- Overdue customers
- Fully paid customers
- Partially paid customers
- Customer-wise due report
- Due collection report
- Missed payment report

### 19.3 Stock Reports

- Available bike stock
- Sold bike stock
- Reserved bike stock
- Damaged bike stock
- Bike stock valuation
- Parts stock valuation
- Low stock parts report
- Parts usage report

### 19.4 Service Reports

- Daily service income
- Monthly service income
- Service profit
- Parts used in service
- Mechanic-wise service report
- Customer-wise service report

### 19.5 Financial Reports

- Total debit
- Total credit
- Net cash balance
- Monthly profit/loss
- Expense by category
- Dhaka home expense report
- Dinajpur home expense report
- Staff salary and bonus report
- Others report

---

## 20. Accounting and Calculation Logic

The system should automatically calculate financial totals.

### 20.1 Total Credit

```text
Total Credit = Bike Sale Payments + Due Collections + Service Income + Parts Sale Income + Other Income
```

### 20.2 Total Debit

```text
Total Debit = Bike Purchase Cost + Parts Purchase Cost + Salary + Bonus + Expenses + Other Payments
```

### 20.3 Net Cash Balance

```text
Net Cash Balance = Total Credit - Total Debit
```

### 20.4 Business Profit

```text
Business Profit = Total Revenue - Total Business Cost
```

### 20.5 Total Due

```text
Total Due = Sum of all unpaid customer balances
```

### 20.6 Bike Sale Profit

```text
Bike Sale Profit = Selling Price - Purchase Price - Discount - Additional Sale Expenses
```

### 20.7 Parts Profit

```text
Parts Profit = Parts Selling Price - Parts Purchase Price
```

### 20.8 Service Profit

```text
Service Profit = Service Charge + Parts Profit - Service Related Costs
```

---

## 21. Notifications and Alerts

The system should show important alerts.

### 21.1 Required Alerts

- Customer due payment is coming soon.
- Customer due payment is due today.
- Customer due payment is overdue.
- Customer missed multiple due dates.
- Bike stock is low.
- Parts stock is low.
- Staff salary payment date is near.
- Service payment is due.
- Monthly expenses exceed budget.
- Unusual high debit entry.
- Cheque payment is pending or bounced.
- Bike document or registration follow-up is needed.

---

## 22. Search and Filter Requirements

Users should be able to search and filter records easily.

### 22.1 Search Options

- Customer name
- Customer phone
- Bike model
- Bike brand
- Chassis number
- Engine number
- Sale ID
- Service ID
- Staff name
- Date range
- Payment status
- Due status
- Transaction category
- Payment method

### 22.2 Filter Options

- Today
- This week
- This month
- This year
- Custom date range
- Full payment
- Partial payment
- Loan sale
- Paid
- Pending
- Overdue
- Available stock
- Sold stock
- Low stock

---

## 23. User Roles and Permissions

### 23.1 Owner

The owner has full system access.

Owner permissions:

- Add, edit, and delete all records.
- View all reports.
- Manage users.
- Approve sensitive changes.
- Approve salary and bonus.
- Export all reports.
- View profit and loss.
- View activity logs.
- Manage system settings.

### 23.2 Manager

Manager permissions:

- Add and edit sales.
- Add and edit service records.
- Add payments.
- Manage bike stock.
- Manage parts stock.
- View operational reports.

Manager restrictions:

- Cannot delete major financial records without owner approval.
- Cannot change system settings.
- Cannot view restricted owner-only reports if disabled.

### 23.3 Accountant

Accountant permissions:

- Add debit records.
- Add credit records.
- Add expenses.
- Manage staff salary and bonus.
- Generate financial reports.

Accountant restrictions:

- Cannot delete sales records without approval.
- Cannot edit stock without permission.

### 23.4 Staff

Staff permissions:

- Add basic customer details.
- Add service records.
- Add sales entries if permitted.
- View assigned records.

Staff restrictions:

- Cannot view profit reports.
- Cannot delete records.
- Cannot manage salary.
- Cannot access owner-level reports.

---

## 24. Invoice and Receipt Requirements

The system should generate printable invoices and receipts.

### 24.1 Bike Sale Invoice

The bike sale invoice should include:

- Business name
- Business address
- Sale ID
- Sale date
- Customer name
- Customer phone
- Customer address
- Bike brand and model
- Chassis number
- Engine number
- Selling price
- Discount
- Paid amount
- Due amount
- Due date
- Payment method
- Salesperson name
- Customer signature section
- Business signature section

### 24.2 Due Payment Receipt

The due payment receipt should include:

- Receipt ID
- Customer name
- Customer phone
- Sale ID
- Bike details
- Payment date
- Amount received
- Previous due
- Remaining due
- Payment method
- Received by
- Customer signature section
- Business signature section

### 24.3 Service Invoice

The service invoice should include:

- Service ID
- Service date
- Customer details
- Bike details
- Service type
- Parts used
- Service charge
- Parts cost
- Total bill
- Paid amount
- Due amount
- Mechanic name
- Signature section

---

## 25. Backup and Security Requirements

### 25.1 Backup Requirements

The system should support:

- Daily automatic backup.
- Manual backup.
- Cloud backup.
- Export data as Excel.
- Export reports as PDF.
- Restore from backup.
- Backup download option.

### 25.2 Security Requirements

The system should include:

- Login system.
- Role-based access control.
- Strong password support.
- Owner approval for deletion.
- Activity log.
- Record edit history.
- Backup encryption.
- Secure file upload.
- Session timeout for inactive users.

---

## 26. Activity Log

The system should track important user actions.

### 26.1 Activity Log Should Record

- Who added a sale.
- Who edited a sale.
- Who deleted a record.
- Who collected due payment.
- Who changed stock quantity.
- Who added a debit record.
- Who added a credit record.
- Who approved salary or bonus.
- Who uploaded customer documents.
- Date and time of each action.

This is important for accountability, error tracking, and fraud prevention.

---

## 27. Data Entities

The main data entities of the system are:

1. User
2. Staff
3. Customer
4. Bike
5. Bike Sale
6. Loan / Due Record
7. Due Payment
8. Service Record
9. Part
10. Parts Transaction
11. Debit Transaction
12. Credit Transaction
13. Salary Payment
14. Bonus Payment
15. Dhaka Home Expense
16. Dinajpur Home Expense
17. Other Income / Expense
18. Invoice
19. Receipt
20. Activity Log

---

## 28. MVP Scope

The first version of the software should include the essential business features.

### 28.1 MVP Features

1. Dashboard
2. Bike Sales
3. Loan / Due Payment Tracking
4. Bike Stock
5. Parts Stock
6. Service
7. Debit
8. Credit
9. Staff Salary + Bonus
10. Dhaka Home Expenses
11. Dinajpur Home Expenses
12. Others
13. Customer Management
14. Basic Reports
15. Invoice and Receipt Generation
16. User Login
17. Role Permissions
18. Activity Log
19. Data Backup

---

## 29. Future Enhancements

The following features can be added after the MVP.

### 29.1 Advanced Features

- SMS reminders
- WhatsApp reminders
- Mobile app
- Barcode or QR code scanning for bikes and parts
- Customer payment portal
- Advanced profit analytics
- Staff performance dashboard
- Supplier management
- Warranty tracking
- Installment agreement generator
- Cheque tracking
- Bank account reconciliation
- Multi-branch support
- AI-based sales prediction
- Customer risk scoring
- Automated monthly business summary
- Tax and VAT reporting

---

## 30. Sample User Flows

### 30.1 Bike Sold with Partial Payment

1. Manager opens the Bike Sales module.
2. Manager selects a bike from available stock.
3. Manager adds or selects customer details.
4. Manager enters selling price.
5. Manager enters discount if any.
6. Manager enters paid amount.
7. System calculates due amount.
8. Manager enters agreed due date.
9. System creates sale record.
10. Bike stock changes from Available to Sold.
11. Credit entry is created for the paid amount.
12. Loan/Due record is created for the remaining amount.
13. Invoice is generated.
14. Dashboard updates sale, credit, stock, and due amount.

### 30.2 Due Payment Collection

1. Customer pays part or full due amount.
2. Manager opens Loan / Due module.
3. Manager searches customer by phone number or name.
4. Manager selects active due record.
5. Manager enters received amount.
6. System shows previous due and remaining due.
7. System creates credit entry automatically.
8. System updates due status.
9. Receipt is generated.
10. If due becomes zero, status changes to Paid.
11. If due remains, status stays Pending or Partially Paid.

### 30.3 Service with Parts Used

1. Staff opens Service module.
2. Staff adds customer and bike details.
3. Staff selects service type.
4. Staff selects parts used.
5. System deducts parts from stock.
6. System calculates total bill.
7. Customer pays bill.
8. System creates service record.
9. Credit entry is created.
10. Service invoice is generated.

### 30.4 Staff Salary Payment

1. Accountant opens Staff Salary module.
2. Accountant selects staff member.
3. Accountant enters salary month.
4. Accountant enters paid amount.
5. System calculates due salary if partially paid.
6. Debit entry is created automatically.
7. Salary report updates.

---

## 31. Acceptance Criteria

The system will be accepted if the following conditions are met:

1. The owner can add and view bike sales.
2. The system calculates bike profit automatically.
3. The system updates bike stock after sale.
4. The system creates due records for partial bike payments.
5. The system tracks due date, due amount, payment history, and overdue status.
6. The system allows partial due payment collection.
7. The system creates credit records for received payments.
8. The system creates debit records for outgoing payments.
9. The system tracks bike stock and parts stock.
10. The system shows low stock alerts.
11. The system records service income.
12. The system deducts used parts from stock.
13. The system tracks staff salary and bonus.
14. The system tracks Dhaka home expenses separately.
15. The system tracks Dinajpur home expenses separately.
16. The system tracks miscellaneous records under Others.
17. The dashboard shows business summaries.
18. Reports can be generated by date range and category.
19. User roles and permissions work correctly.
20. Invoice and receipt generation works correctly.
21. Activity logs are recorded.
22. Backup and export options are available.

---

## 32. Success Metrics

The software will be successful if:

- Sales records are easier to maintain.
- Customer due payments are tracked accurately.
- Overdue payments are reduced.
- Stock mistakes are reduced.
- Monthly profit/loss can be calculated quickly.
- The owner can see business health from the dashboard.
- Staff salary and expenses are properly organized.
- Reports can be generated without manual calculation.
- Business data becomes easier to search, filter, and export.
- Manual accounting mistakes decrease.

---

## 33. Final Product Summary

The Motorbike Business Management System should be a complete management tool for a motorbike business.

It must handle:

- Bike sales
- Service
- Loan / due payment tracking
- Debit
- Credit
- Bike stock
- Parts stock
- Staff salary and bonus
- Dhaka home expenses
- Dinajpur home expenses
- Others

The most important feature is the Loan / Due Payment module. It should allow the business to sell bikes with partial payment, track remaining due, set payment dates, record partial collections, mark overdue payments, and generate receipts.

The final software should make the business easier to manage, reduce calculation errors, improve payment collection, and give the owner a clear view of sales, profit, stock, expenses, dues, and cash flow.

