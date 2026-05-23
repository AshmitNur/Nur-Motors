insert into public.staff (name, role, monthly_salary, salary_due) values
  ('Rahim Manager', 'manager', 35000, 12000),
  ('Karim Mechanic', 'mechanic', 25000, 0),
  ('Nasir Accountant', 'accountant', 30000, 8000);

insert into public.customers (id, name, phone, address, nid_number, status) values
  ('00000000-0000-0000-0000-000000000101', 'Rahim Uddin', '01711111111', 'Dinajpur Sadar', '1988123456789', 'Regular'),
  ('00000000-0000-0000-0000-000000000102', 'Karim Ahmed', '01822222222', 'Birampur, Dinajpur', null, 'Risky'),
  ('00000000-0000-0000-0000-000000000103', 'Salma Akter', '01933333333', 'Mirpur, Dhaka', null, 'Good Payer');

insert into public.bikes (id, brand, model, color, year, chassis_number, engine_number, purchase_price, supplier_name, purchase_date, current_status, location) values
  ('00000000-0000-0000-0000-000000000201', 'Suzuki', 'Gixxer SF', 'Matte Blue', 2025, 'SZKGXSF260001', 'ENGSZK0001', 220000, 'Suzuki Dealer BD', '2026-05-01', 'Sold', 'Showroom'),
  ('00000000-0000-0000-0000-000000000202', 'Suzuki', 'Access 125', 'Red', 2025, 'SZKACS260002', 'ENGSZK0002', 145000, 'Suzuki Dealer BD', '2026-05-04', 'Sold', 'Showroom'),
  ('00000000-0000-0000-0000-000000000203', 'Suzuki', 'Gixxer', 'Black', 2026, 'SZKGIX26003', 'ENGSZK0003', 238000, 'Suzuki Dealer BD', '2026-05-14', 'Available', 'Showroom');

insert into public.parts (part_name, category, brand, quantity_available, purchase_price_per_unit, selling_price_per_unit, supplier_name, minimum_stock_level, location) values
  ('Engine Oil 10W-40', 'Oil', 'Castrol', 9, 620, 850, 'Parts Hub', 12, 'Shelf A1'),
  ('Brake Pad Set', 'Brake', 'Nissin', 18, 500, 750, 'Parts Hub', 10, 'Shelf B2'),
  ('Chain Kit', 'Chain', 'DID', 4, 2100, 2900, 'Moto Parts', 5, 'Shelf C1');

insert into public.bike_sales (
  id, sale_no, sale_date, customer_id, customer_name, customer_phone, bike_id, bike_brand, bike_model,
  bike_color, chassis_number, engine_number, purchase_price, selling_price, discount,
  additional_sale_expense, paid_amount, payment_type, payment_method, salesperson
) values
  ('00000000-0000-0000-0000-000000000301', 'SALE-2026-0001', '2026-05-17', '00000000-0000-0000-0000-000000000101', 'Rahim Uddin', '01711111111', '00000000-0000-0000-0000-000000000201', 'Suzuki', 'Gixxer SF', 'Matte Blue', 'SZKGXSF260001', 'ENGSZK0001', 220000, 250000, 5000, 2000, 170000, 'Partial Payment', 'Cash', 'Rahim Manager'),
  ('00000000-0000-0000-0000-000000000302', 'SALE-2026-0002', '2026-05-07', '00000000-0000-0000-0000-000000000102', 'Karim Ahmed', '01822222222', '00000000-0000-0000-0000-000000000202', 'Suzuki', 'Access 125', 'Red', 'SZKACS260002', 'ENGSZK0002', 145000, 173000, 3000, 1500, 138000, 'Loan', 'bKash', 'Rahim Manager');

insert into public.due_records (
  sale_id, customer_id, customer_name, customer_phone, bike_details, total_selling_price,
  paid_amount, due_amount, remaining_due, due_date, installment_type, installment_amount, payment_method
) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'Rahim Uddin', '01711111111', 'Suzuki Gixxer SF / SZKGXSF260001', 250000, 170000, 80000, 80000, '2026-06-10', 'One-time', 80000, 'Cash'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102', 'Karim Ahmed', '01822222222', 'Suzuki Access 125 / SZKACS260002', 173000, 138000, 35000, 35000, '2026-05-25', 'Multiple installments', 17500, 'bKash');

insert into public.credit_transactions (transaction_date, category, amount, payment_method, person, purpose, related_module, added_by) values
  ('2026-05-17', 'Bike sale', 170000, 'Cash', 'Rahim Uddin', 'SALE-2026-0001 initial payment', 'Bike sale', 'Rahim Manager'),
  ('2026-05-07', 'Bike sale', 138000, 'bKash', 'Karim Ahmed', 'SALE-2026-0002 initial payment', 'Bike sale', 'Rahim Manager');

insert into public.debit_transactions (transaction_date, category, amount, payment_method, person, purpose, related_module, added_by) values
  ('2026-05-01', 'Bike purchase', 220000, 'Bank', 'Suzuki Dealer BD', 'Gixxer SF stock purchase', 'Bike stock', 'Nasir Accountant'),
  ('2026-05-04', 'Bike purchase', 145000, 'Bank', 'Suzuki Dealer BD', 'Access 125 stock purchase', 'Bike stock', 'Nasir Accountant');
