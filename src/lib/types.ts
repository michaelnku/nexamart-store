import {
  CartItem,
  Product,
  ProductImage,
  ProductVariant,
  Review,
  Store,
} from "@/generated/prisma/client";

export type FullProductVariant = ProductVariant & {
  stock: number;
};

export type FullProduct = Product & {
  images: ProductImage[];
  variants: FullProductVariant[];
  store: Pick<Store, "id" | "userId" | "name" | "slug" | "logo">;
  brand?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
  reviews?: (Review & {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  })[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
  iconImage?: string | null;
  bannerImage?: string | null;
  color?: string | null;
};

export type FullCart = {
  items: (CartItem & {
    product: {
      id: string;
      name: string;
      currency: string | null;
      basePrice: number;
      images: ProductImage[];
    };
    variant?: {
      id: string;
      price: number;
      color: string | null;
      size: string | null;
    } | null;
  })[];
};

export type WishlistProduct = {
  id: string;
  name: string;
  basePrice: number;
  discount?: number;
  images: ProductImage[];
  store: { name: string; slug: string };
};
export type WishlistItem = {
  id: string;
  product: WishlistProduct;
};

export type Wishlist = WishlistItem[];

export type ProductCardType = Product & {
  id: string;
  name: string;
  basePrice: number;
  oldPrice?: number | null;
  images: { imageUrl: string }[];
  store: { name: string; slug: string };
  variants: {
    id: string;
    color: string | null;
    size: string | null;
    price: number;
    oldPrice?: number | null;
    stock: number;
  }[];
};

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  fullName: string;
  email: string;
  role: "USER" | "ADMIN" | "MODERATOR" | "SELLER" | "RIDER";
  image?: string | null;
};

export type AppUser = CurrentUser | null;
