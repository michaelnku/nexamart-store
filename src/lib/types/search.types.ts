export type SearchImage = {
  id: string;
  imageUrl: string;
};

export type SearchStore = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  badge?: "ELITE" | "RELIABLE" | "STANDARD" | "LOW_PERFORMANCE";
  onTimeRate?: number;
};

export type SearchCategory = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type SearchProduct = {
  id: string;
  name: string;

  priceUSD: number;
  images: {
    imageUrl: string;
  }[];
  store: {
    id: string;
    name: string;
  };
};

export type GlobalSearchResult = {
  products: SearchProduct[];
  nextCursor: string | null;
  stores?: SearchStore[];
  categories?: SearchCategory[];
};

export type SearchProductCard = Pick<
  SearchProduct,
  "id" | "name" | "priceUSD" | "images" | "store"
>;
