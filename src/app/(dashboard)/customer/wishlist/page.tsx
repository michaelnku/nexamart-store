import WishListPage from "@/components/product/WishListPage";
import { getWishlistAction } from "@/actions/getWishlistItems";

export default async function Page() {
  const wishlistProducts = await getWishlistAction();

  return (
    <div className="min-h-screen">
      <WishListPage initialData={wishlistProducts} />
    </div>
  );
}
