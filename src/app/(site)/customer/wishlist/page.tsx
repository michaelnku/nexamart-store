import { getWishlistAction } from "@/actions/auth/wishlist";
import WishListPage from "@/components/product/WishListPage";

export default async function Page() {
  const wishlistProducts = await getWishlistAction();

  return (
    <div className="min-h-full">
      <WishListPage initialData={wishlistProducts} />
    </div>
  );
}

