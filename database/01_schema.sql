-- ============================================================================
-- Script: 01_schema.sql
-- Project: FoodOrder - Online Food Ordering System
-- Target: PostgreSQL Database
-- Execution: Run in psql or pgAdmin Query Tool
--
-- Example psql command:
--   psql -U postgres -d foodorder_db -f database/01_schema.sql
-- ============================================================================

-- Drop existing tables in reverse order of dependencies to allow clean reruns
DROP TABLE IF EXISTS food_order_items CASCADE;
DROP TABLE IF EXISTS food_orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS food_categories CASCADE;

-- ----------------------------------------------------------------------------
-- Table 1: food_categories
-- Stores food groups such as Pizza, Burgers, Indian Dishes, Chinese, Desserts
-- ----------------------------------------------------------------------------
CREATE TABLE food_categories (
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

COMMENT ON TABLE food_categories IS 'Food categories used to organize menu dishes';

-- ----------------------------------------------------------------------------
-- Table 2: menu_items
-- Catalog of food dishes with foreign key reference to food_categories
-- ----------------------------------------------------------------------------
CREATE TABLE menu_items (
    item_id       SERIAL PRIMARY KEY,
    category_id   INT NOT NULL REFERENCES food_categories(category_id) ON DELETE CASCADE,
    item_name     VARCHAR(100) NOT NULL,
    description   VARCHAR(400),
    price         NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url     VARCHAR(500),
    is_available  CHAR(1) DEFAULT 'Y' NOT NULL CHECK (is_available IN ('Y', 'N'))
);

COMMENT ON TABLE menu_items IS 'Dishes available for customer orders with pricing in INR';

-- ----------------------------------------------------------------------------
-- Table 3: food_orders
-- Master table storing customer delivery information and order status
-- ----------------------------------------------------------------------------
CREATE TABLE food_orders (
    order_id          SERIAL PRIMARY KEY,
    customer_name     VARCHAR(100) NOT NULL,
    customer_phone    VARCHAR(20) NOT NULL,
    delivery_address  VARCHAR(300) NOT NULL,
    order_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total_amount      NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    order_status      VARCHAR(20) DEFAULT 'PLACED' NOT NULL CHECK (
        order_status IN ('PLACED', 'PREPARING', 'DELIVERED', 'CANCELLED')
    )
);

COMMENT ON TABLE food_orders IS 'Customer order headers with order totals and live statuses';

-- ----------------------------------------------------------------------------
-- Table 4: food_order_items
-- Line items linking an order to specific menu dishes with quantity & price snapshot
-- ----------------------------------------------------------------------------
CREATE TABLE food_order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id      INT NOT NULL REFERENCES food_orders(order_id) ON DELETE CASCADE,
    item_id       INT NOT NULL REFERENCES menu_items(item_id),
    quantity      INT NOT NULL CHECK (quantity > 0),
    unit_price    NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

COMMENT ON TABLE food_order_items IS 'Line items linking each order to specific menu items';

-- ----------------------------------------------------------------------------
-- Indexes on Foreign Keys and Frequently Filtered Columns
-- ----------------------------------------------------------------------------
CREATE INDEX idx_menu_category ON menu_items(category_id);
CREATE INDEX idx_order_items_order ON food_order_items(order_id);
CREATE INDEX idx_order_items_item ON food_order_items(item_id);
CREATE INDEX idx_orders_date ON food_orders(order_date DESC);
CREATE INDEX idx_orders_phone ON food_orders(customer_phone);
