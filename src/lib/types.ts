import {
  CartItem,
  Product,
  ProductImage,
  ProductVariant,
  Review,
  Store,
  User,
  UserRole,
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

export type UserDTO = {
  id: string;
  email: string;
  role: UserRole;

  name: string;
  username: string;
  image?: string | null;
  isBanned: boolean;

  isVerified: boolean;
};

export type AppUser = UserDTO | null;

export type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

export type SearchImage = {
  id: string;
  imageUrl: string;
};

export type SearchStore = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type SearchCategory = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type GlobalSearchResult = {
  products: SearchProduct[];
  nextCursor: string | null;
  stores?: SearchStore[];
  categories?: SearchCategory[];
};

export type SearchProduct = {
  id: string;
  name: string;

  price: number;
  images: {
    imageUrl: string;
  }[];
  store: {
    id: string;
    name: string;
  };
};

export type SearchProductCard = Pick<
  SearchProduct,
  "id" | "name" | "price" | "images" | "store"
>;
