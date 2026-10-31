import React from 'react';
import { Plus, Check } from 'lucide-react';

export default function MenuCard({ item, onAddToCart, isInCart }) {
  const isAvailable = item.IS_AVAILABLE === 'Y';

  return (
    <div className="food-card">
      <div className="food-image-wrapper">
        <img 
          src={item.IMAGE_URL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
          alt={item.ITEM_NAME} 
          className="food-image"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <span className="food-category-badge">{item.CATEGORY_NAME}</span>
        <span className={`food-avail-badge ${isAvailable ? 'badge-available' : 'badge-unavailable'}`}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="food-card-body">
        <h3 className="food-name">{item.ITEM_NAME}</h3>
        <p className="food-desc">{item.DESCRIPTION || 'Freshly prepared with authentic ingredients and rich spices.'}</p>
        
        <div className="food-footer">
          <div className="food-price">₹{parseFloat(item.PRICE).toFixed(2)}</div>
          
          <button
            className="btn-add-cart"
            onClick={() => onAddToCart(item)}
            disabled={!isAvailable}
          >
            {isInCart ? (
              <>
                <Check size={16} />
                <span>Added ({isInCart})</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
