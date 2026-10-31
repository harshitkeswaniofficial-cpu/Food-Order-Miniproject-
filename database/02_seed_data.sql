-- ============================================================================
-- Script: 02_seed_data.sql
-- Project: FoodOrder - Online Food Ordering System
-- Target: PostgreSQL Database
-- Execution: Run in psql or pgAdmin Query Tool
--
-- Example psql command:
--   psql -U postgres -d foodorder_db -f database/02_seed_data.sql
-- ============================================================================

-- Clean existing data and reset identity sequences
TRUNCATE TABLE food_order_items, food_orders, menu_items, food_categories RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
-- 1. Insert 5 Food Categories
-- ----------------------------------------------------------------------------
INSERT INTO food_categories (category_id, category_name) VALUES 
(1, 'Pizza'),
(2, 'Burgers'),
(3, 'Indian Dishes'),
(4, 'Chinese'),
(5, 'Desserts & Drinks');

-- ----------------------------------------------------------------------------
-- 2. Insert 18 Sample Food Items with Indian Rupee Prices
-- ----------------------------------------------------------------------------

-- Category 1: Pizza
INSERT INTO menu_items (item_id, category_id, item_name, description, price, image_url, is_available) VALUES
(101, 1, 'Margherita Pizza', 'Classic hand-tossed crust with mozzarella cheese, fresh tomatoes, and aromatic sweet basil.', 299.00, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80', 'Y'),
(102, 1, 'Farmhouse Veggie Pizza', 'Topped with crunchy bell peppers, sweet corn, button mushrooms, black olives, and melted mozzarella.', 399.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', 'Y'),
(103, 1, 'Paneer Tikka Pizza', 'Tandoori spiced cottage cheese cubes, crisp red onions, capsicum, and fresh mozzarella blend.', 449.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80', 'Y'),
(104, 1, 'BBQ Chicken Pizza', 'Tender grilled chicken chunks with smoky barbecue drizzle and rich mozzarella.', 489.00, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80', 'Y');

-- Category 2: Burgers
INSERT INTO menu_items (item_id, category_id, item_name, description, price, image_url, is_available) VALUES
(105, 2, 'Crispy Veg Burger', 'Golden crispy vegetable patty with fresh lettuce, tomatoes, and herb mayonnaise.', 149.00, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80', 'Y'),
(106, 2, 'Double Cheese Veg Burger', 'Two layers of melted cheddar cheese with crispy herb patty and caramelized onions.', 199.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', 'Y'),
(107, 2, 'Crispy Chicken Burger', 'Spiced crispy fried chicken breast fillet with chipotle sauce and pickles in a toasted brioche bun.', 249.00, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80', 'Y');

-- Category 3: Indian Dishes
INSERT INTO menu_items (item_id, category_id, item_name, description, price, image_url, is_available) VALUES
(108, 3, 'Paneer Butter Masala', 'Fresh cottage cheese cubes cooked in rich, creamy tomato and butter cashew gravy.', 320.00, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80', 'Y'),
(109, 3, 'Dal Makhani', 'Slow-cooked whole black lentils with fresh cream, country butter, and fragrant mild spices.', 260.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', 'Y'),
(110, 3, 'Hyderabadi Chicken Biryani', 'Aromatic long-grain basmati rice slow dum-cooked with marinated chicken and saffron spices.', 380.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', 'Y'),
(111, 3, 'Butter Naan (2 Pcs)', 'Tandoori-baked flatbread brushed with melted butter and sprinkled with fresh coriander.', 80.00, '/images/butter_naan.jpg', 'Y');

-- Category 4: Chinese
INSERT INTO menu_items (item_id, category_id, item_name, description, price, image_url, is_available) VALUES
(112, 4, 'Veg Hakka Noodles', 'Wok-tossed thin noodles with cabbage, carrots, bell peppers, and scallions.', 199.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', 'Y'),
(113, 4, 'Chilli Paneer Dry', 'Crispy batter-fried paneer cubes tossed with capsicum, onions, and spicy soya chili sauce.', 280.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', 'Y'),
(114, 4, 'Chicken Schezwan Fried Rice', 'Spicy wok-tossed basmati rice with shredded chicken, eggs, and homemade Schezwan sauce.', 270.00, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80', 'Y'),
(115, 4, 'Steamed Veg Dim Sums (6 Pcs)', 'Delicate dumplings stuffed with minced vegetables, served with spicy garlic dip.', 210.00, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80', 'Y');

-- Category 5: Desserts & Drinks
INSERT INTO menu_items (item_id, category_id, item_name, description, price, image_url, is_available) VALUES
(116, 5, 'Chocolate Walnut Brownie', 'Fudgy warm chocolate brownie served with melted dark chocolate fudge.', 160.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', 'Y'),
(117, 5, 'Gulab Jamun (2 Pcs)', 'Traditional sweet milk dumplings soaked in cardamom sugar syrup.', 110.00, '/images/gulab_jamun.jpg', 'Y'),
(118, 5, 'Fresh Mint Mojito', 'Refreshing cooler prepared with mint leaves, lemon slices, and sparkling soda.', 120.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', 'Y');

-- ----------------------------------------------------------------------------
-- 3. Insert Sample Customer Orders and Order Line Items
-- ----------------------------------------------------------------------------

-- Order 1: Delivered
INSERT INTO food_orders (order_id, customer_name, customer_phone, delivery_address, order_date, total_amount, order_status) VALUES
(1001, 'Aman Verma', '9876543210', 'Flat 302, Green Park Apartments, Bengaluru', NOW() - INTERVAL '2 days', 619.00, 'DELIVERED');

INSERT INTO food_order_items (order_item_id, order_id, item_id, quantity, unit_price) VALUES
(5001, 1001, 101, 1, 299.00),
(5002, 1001, 108, 1, 320.00);

-- Order 2: Preparing
INSERT INTO food_orders (order_id, customer_name, customer_phone, delivery_address, order_date, total_amount, order_status) VALUES
(1002, 'Sneha Patel', '9812345678', 'House 45, Sector 14, Bengaluru', NOW() - INTERVAL '40 minutes', 460.00, 'PREPARING');

INSERT INTO food_order_items (order_item_id, order_id, item_id, quantity, unit_price) VALUES
(5003, 1002, 110, 1, 380.00),
(5004, 1002, 111, 1, 80.00);

-- Order 3: Newly Placed
INSERT INTO food_orders (order_id, customer_name, customer_phone, delivery_address, order_date, total_amount, order_status) VALUES
(1003, 'Rohan Sharma', '9899001122', 'Room 12, Tech Residency, Outer Ring Road, Bengaluru', NOW() - INTERVAL '5 minutes', 419.00, 'PLACED');

INSERT INTO food_order_items (order_item_id, order_id, item_id, quantity, unit_price) VALUES
(5005, 1003, 105, 1, 149.00),
(5006, 1003, 114, 1, 270.00);

-- ----------------------------------------------------------------------------
-- 4. Advance Sequence Counters Beyond Seeded IDs
-- ----------------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('food_categories', 'category_id'), COALESCE((SELECT MAX(category_id) FROM food_categories), 1));
SELECT setval(pg_get_serial_sequence('menu_items', 'item_id'), COALESCE((SELECT MAX(item_id) FROM menu_items), 1));
SELECT setval(pg_get_serial_sequence('food_orders', 'order_id'), COALESCE((SELECT MAX(order_id) FROM food_orders), 1));
SELECT setval(pg_get_serial_sequence('food_order_items', 'order_item_id'), COALESCE((SELECT MAX(order_item_id) FROM food_order_items), 1));
