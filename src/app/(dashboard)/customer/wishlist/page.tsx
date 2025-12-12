import WishListPage from "@/components/product/WishListPage";

export default async function Page() {
  const wishlistProducts = await getWishlistAction();

  return (
    <div className="min-h-screen">
      <WishListPage initialData={wishlistProducts} />
    </div>
  );
}
function getWishlistAction() {
  throw new Error("Function not implemented.");
}
