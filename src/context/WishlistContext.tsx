import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BulkTier {
  inner: number;
  qty: number;
  price: number;
}

interface WishlistItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  innerQty: number;
  bulkPricing?: BulkTier[];
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const toggleWishlist = (item: WishlistItem) => {
    setWishlistItems(prev => {
      const exists = prev.find(p => p.productId === item.productId);
      if (exists) {
        return prev.filter(p => p.productId !== item.productId);
      } else {
        return [...prev, item];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
