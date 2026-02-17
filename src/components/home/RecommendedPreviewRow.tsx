import { CurrentUser } from "@/lib/currentUser";
import ProductRowUI from "@/components/home/ProductRowUI";
import { getRecommendedProducts } from "@/lib/recommendations/getRecommendedProducts";

export default async function RecommendedPreviewRow() {
  const user = await CurrentUser();

  if (!user) return null;

  const products = await getRecommendedProducts(user.id);

  if (products.length === 0) return null;

  return (
    <ProductRowUI
      title="Recommended For You"
      products={products}
      autoplay={false}
      seeAllLink="/recommended"
    />
  );
}
