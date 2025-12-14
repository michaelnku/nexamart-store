import { getHierarchicalCategories } from "@/actions/category/categories";
import Image from "next/image";
import Link from "next/link";

export default async function CategoryPage() {
  const cats = await getHierarchicalCategories();

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold mb-6">Browse Categories</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {cats.map((cat) => (
          <Link
            href={`/category/${cat.slug}`}
            key={cat.id}
            className="p-4 rounded-xl border hover:shadow-lg transition flex flex-col items-center text-center"
          >
            {cat.iconImage && (
              <Image
                src={cat.iconImage}
                width={50}
                height={50}
                alt={cat.name}
              />
            )}
            <span className="mt-2 font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
