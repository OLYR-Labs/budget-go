"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  stock: number;
};

export type CartItem = CartProduct & {
  quantity: number;
};

type CartStore = {
  items: CartItem[];

  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateProductStock: (
    productId: string,
    stock: number,
  ) => void;
  clearCart: () => void;

  getItemCount: () => number;
  getSubtotal: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        if (product.stock <= 0) {
          return;
        }

        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === product.id,
          );

          if (existingItem) {
            const nextQuantity = Math.min(
              existingItem.quantity + 1,
              product.stock,
            );

            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? {
                      ...item,
                      name: product.name,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      stock: product.stock,
                      quantity: nextQuantity,
                    }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...product,
                quantity: 1,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.id !== productId,
          ),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) => item.id !== productId,
              ),
            };
          }

          return {
            items: state.items.map((item) => {
              if (item.id !== productId) {
                return item;
              }

              return {
                ...item,
                quantity: Math.min(
                  quantity,
                  item.stock,
                ),
              };
            }),
          };
        });
      },

      updateProductStock: (productId, stock) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.id !== productId) {
                return item;
              }

              return {
                ...item,
                stock,
                quantity: Math.min(
                  item.quantity,
                  stock,
                ),
              };
            })
            .filter((item) => item.stock > 0),
        }));
      },

      clearCart: () => {
        set({
          items: [],
        });
      },

      getItemCount: () => {
        return get().items.reduce(
          (total, item) => total + item.quantity,
          0,
        );
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) =>
            total + item.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: "budget-go-cart",

      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);