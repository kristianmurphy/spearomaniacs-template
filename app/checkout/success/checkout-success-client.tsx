"use client";

import { useEffect } from "react";

const CART_STORAGE_KEY = "spearomaniacs.cart";

export function CheckoutSuccessClient() {
  useEffect(() => {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  return null;
}
