-- ============================================================================
-- Script: 04_admin_migration.sql
-- Project: FoodOrder - Online Food Ordering System
-- Target: PostgreSQL Database
-- Purpose: Adds administrator credentials table without modifying existing
--          food_categories, menu_items, food_orders, or food_order_items.
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
    admin_id      SERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) DEFAULT 'ADMIN' NOT NULL CHECK (role = 'ADMIN'),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(email);

COMMENT ON TABLE admin_users IS 'Stores authorized administrator accounts for the Admin Panel';
