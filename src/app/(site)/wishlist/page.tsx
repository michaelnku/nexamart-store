import { getWishlistAction } from "@/actions/auth/wishlist";
import WishListPage from "@/components/product/WishListPage";

export default async function Page() {
  const wishlistProducts = await getWishlistAction();

  return (
    <div className="min-h-full bg-white dark:bg-neutral-950">
      <WishListPage initialData={wishlistProducts} />
    </div>
  );
}

