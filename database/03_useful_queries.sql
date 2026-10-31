-- ============================================================================
-- Script: 03_useful_queries.sql
-- Project: FoodOrder - Online Food Ordering System
-- Target: PostgreSQL Database
-- Execution: Run in psql or pgAdmin Query Tool
--
-- Example psql command:
--   psql -U postgres -d foodorder_db -f database/03_useful_queries.sql
-- ============================================================================

-- ============================================================================
-- QUERY 1: BASIC SELECT AND ORDER BY
-- Purpose: View all food items sorted from lowest to highest price
-- ============================================================================
SELECT 
    item_id AS "Item ID",
    item_name AS "Item Name",
    price AS "Price (INR)",
    is_available AS "Available"
FROM menu_items
ORDER BY price ASC;

-- ============================================================================
-- QUERY 2: FILTERING WITH WHERE CLAUSE
-- Purpose: View all available items priced under 300 Rupees
-- ============================================================================
SELECT 
    item_id AS "Item ID",
    item_name AS "Item Name",
    price AS "Price (INR)"
FROM menu_items
WHERE is_available = 'Y' AND price < 300.00
ORDER BY price DESC;

-- ============================================================================
-- QUERY 3: CASE-INSENSITIVE PATTERN MATCHING WITH ILIKE
-- Purpose: Search items containing 'burger' or 'pizza'
-- ============================================================================
SELECT 
    item_id AS "Item ID",
    item_name AS "Item Name",
    price AS "Price (INR)"
FROM menu_items
WHERE item_name ILIKE '%burger%' OR item_name ILIKE '%pizza%'
ORDER BY price ASC;

-- ============================================================================
-- QUERY 4: TWO-TABLE INNER JOIN
-- Purpose: List all menu items with their category name
-- ============================================================================
SELECT 
    m.item_id AS "Item ID",
    m.item_name AS "Dish Name",
    c.category_name AS "Category",
    m.price AS "Price (INR)"
FROM menu_items m
INNER JOIN food_categories c ON m.category_id = c.category_id
ORDER BY c.category_name, m.price;

-- ============================================================================
-- QUERY 5: THREE-TABLE JOIN (ORDERS -> ORDER_ITEMS -> MENU_ITEMS)
-- Purpose: View complete details of each customer's order line items
-- ============================================================================
SELECT 
    o.order_id AS "Order #",
    o.customer_name AS "Customer",
    m.item_name AS "Dish Name",
    i.quantity AS "Qty",
    i.unit_price AS "Unit Price",
    (i.quantity * i.unit_price) AS "Item Total",
    o.order_status AS "Status"
FROM food_orders o
JOIN food_order_items i ON o.order_id = i.order_id
JOIN menu_items m ON i.item_id = m.item_id
ORDER BY o.order_id, i.order_item_id;

-- ============================================================================
-- QUERY 6: AGGREGATE FUNCTIONS (COUNT, MIN, MAX, AVG)
-- Purpose: Calculate overall statistics for menu item prices
-- ============================================================================
SELECT 
    COUNT(*) AS "Total Dishes",
    MIN(price) AS "Lowest Price (INR)",
    MAX(price) AS "Highest Price (INR)",
    ROUND(AVG(price), 2) AS "Average Price (INR)"
FROM menu_items;

-- ============================================================================
-- QUERY 7: GROUP BY AND AGGREGATION
-- Purpose: Count number of items and average price per category
-- ============================================================================
SELECT 
    c.category_name AS "Category",
    COUNT(m.item_id) AS "Number of Items",
    ROUND(AVG(m.price), 2) AS "Average Price (INR)"
FROM food_categories c
LEFT JOIN menu_items m ON c.category_id = m.category_id
GROUP BY c.category_name
ORDER BY "Number of Items" DESC;

-- ============================================================================
-- QUERY 8: GROUP BY ON ORDERS (STATUS BREAKDOWN & TOTAL REVENUE)
-- Purpose: Summarize orders and revenue grouped by order status
-- ============================================================================
SELECT 
    order_status AS "Order Status",
    COUNT(order_id) AS "Orders Count",
    SUM(total_amount) AS "Total Revenue (INR)"
FROM food_orders
GROUP BY order_status
ORDER BY "Orders Count" DESC;

-- ============================================================================
-- QUERY 9: BEST-SELLING FOOD ITEMS (JOIN + GROUP BY + SUM)
-- Purpose: Identify top selling dishes by units ordered
-- ============================================================================
SELECT 
    m.item_name AS "Dish Name",
    SUM(i.quantity) AS "Total Units Sold",
    SUM(i.quantity * i.unit_price) AS "Total Sales (INR)"
FROM food_order_items i
JOIN menu_items m ON i.item_id = m.item_id
JOIN food_orders o ON i.order_id = o.order_id
WHERE o.order_status != 'CANCELLED'
GROUP BY m.item_name
ORDER BY "Total Units Sold" DESC;

-- ============================================================================
-- QUERY 10: DML DEMONSTRATION (INSERT, UPDATE, DELETE)
-- Purpose: Demonstrates adding a test dish, updating its price, and removing it
-- ============================================================================

-- 1. Insert temporary dish
INSERT INTO menu_items (category_id, item_name, description, price, is_available)
VALUES (5, 'Demo Vanilla Ice Cream', 'Creamy vanilla scoop with chocolate drizzle', 99.00, 'Y');

-- 2. Update price
UPDATE menu_items
SET price = 110.00
WHERE item_name = 'Demo Vanilla Ice Cream';

-- 3. Delete temporary dish
DELETE FROM menu_items
WHERE item_name = 'Demo Vanilla Ice Cream';
