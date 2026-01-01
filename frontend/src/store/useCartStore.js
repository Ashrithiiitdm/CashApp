import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  cart: [],

  // Add item or increment quantity
  addItem: (item) => set((state) => {
    const existingItem = state.cart.find((i) => i.id === item.id);
    if (existingItem) {
      return {
        cart: state.cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    }
    return { cart: [...state.cart, { ...item, quantity: 1 }] };
  }),

  // Decrement quantity or remove if 0
  removeItem: (itemId) => set((state) => {
    const existingItem = state.cart.find((i) => i.id === itemId);
    if (existingItem.quantity === 1) {
      return { cart: state.cart.filter((i) => i.id !== itemId) };
    }
    return {
      cart: state.cart.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      ),
    };
  }),

  // Get quantity of a specific item (useful for UI)
  getItemQty: (itemId) => {
    const item = get().cart.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  },

  // Get total price
  getCartTotal: () => {
    return get().cart.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  // Get total item count
  getCartCount: () => {
    return get().cart.reduce((count, item) => count + item.quantity, 0);
  },

  clearCart: () => set({ cart: [] }),
}));

export default useCartStore;