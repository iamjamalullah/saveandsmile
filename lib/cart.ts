'use client';

import { Product } from './data';

export interface CartItem {
  id: number | string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  qty: number;
  code?: string;
}

const CART_KEY = 'qadri_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (e) {}
}

export function addToCart(product: Product, qty: number = 1) {
  const cart = getCart();
  const existing = cart.find(item => String(item.id) === String(product.id));
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      qty: qty,
      code: product.code,
    });
  }
  saveCart(cart);
}

export function updateCartQty(id: number | string, delta: number): CartItem[] {
  let cart = getCart();
  const item = cart.find(i => String(i.id) === String(id));
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => String(i.id) !== String(id));
    }
    saveCart(cart);
  }
  return cart;
}

export function removeFromCart(id: number | string): CartItem[] {
  const cart = getCart().filter(item => String(item.id) !== String(id));
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + (item.price * item.qty), 0);
}

export function getCartCount(): number {
  return getCart().reduce((count, item) => count + item.qty, 0);
}
