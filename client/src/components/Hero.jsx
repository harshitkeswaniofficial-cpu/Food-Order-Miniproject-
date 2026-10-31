import React from 'react';
import { Search } from 'lucide-react';

export default function Hero({ 
  categories = [], 
  selectedCategory, 
  onSelectCategory, 
  searchQuery, 
  onSearchChange 
}) {
  return (
    <section className="hero">
      <div className="container">

        <h1 className="hero-title">
          Delicious Food, <span>Delivered Fresh</span>
        </h1>
        <p className="hero-subtitle">
          Explore delicious pizzas, gourmet burgers, authentic Indian curries, and desserts. Order online with Cash on Delivery!
        </p>

        {/* Search Bar */}
        <div className="filter-bar">
          <div className="search-wrapper">
            <Search className="search-icon" size={19} />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search by food name (e.g., Pizza, Biryani, Burger)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills">
            <button
              className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => onSelectCategory('all')}
            >
              🍽️ All Dishes
            </button>
            {categories.map((cat) => (
              <button
                key={cat.CATEGORY_ID}
                className={`category-pill ${selectedCategory === String(cat.CATEGORY_ID) ? 'active' : ''}`}
                onClick={() => onSelectCategory(String(cat.CATEGORY_ID))}
              >
                {cat.CATEGORY_NAME}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
