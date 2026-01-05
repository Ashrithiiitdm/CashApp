// src/components/Icons.js

// 1. Import all images
import storeIcon1 from '../assets/stores/store.png'
import storeIcon2 from '../assets/stores/store-1.png'
import storeIcon3 from '../assets/stores/store-2.png'
import storeIcon4 from '../assets/stores/restaurant.png'
import storeIcon5 from '../assets/stores/restaurant-2.png'
import storeIcon6 from '../assets/stores/cafe.png'
import storeIcon7 from '../assets/stores/cafe-2.png'
import storeIcon8 from '../assets/stores/coffee-shop.png'
import storeIcon9 from '../assets/stores/coffee-shop-2.png'
import storeIcon10 from '../assets/stores/coffee-shop-3.png'
import storeIcon11 from '../assets/stores/coffee-shop-4.png'

// 2. Create a Map (ID -> Image Source)
// This ID is what you will save in the database
export const STORE_ICONS_MAP = {
  'store_1': storeIcon1,
  'store_2': storeIcon2,
  'store_3': storeIcon3,
  'restaurant_1': storeIcon4,
  'restaurant_2': storeIcon5,
  'cafe_1': storeIcon6,
  'cafe_2': storeIcon7,
  'coffee_1': storeIcon8,
  'coffee_2': storeIcon9,
  'coffee_3': storeIcon10,
  'coffee_4': storeIcon11,
};

// 3. Create a Reusable Display Component
// Pass the ID from the DB (e.g., "cafe_1") and it renders the image
export const StoreIconDisplay = ({ iconId, className, alt = "Store Icon" }) => {
  // Fallback to first icon if ID is missing or invalid
  const imageSrc = STORE_ICONS_MAP[iconId] || STORE_ICONS_MAP['store_1'];

  return (
    <img 
      src={imageSrc}
      alt={alt}
      className={className}
    />
  );
};