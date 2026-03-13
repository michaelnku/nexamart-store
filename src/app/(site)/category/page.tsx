import { getHierarchicalCategories } from "@/actions/category/categories";
import Image from "next/image";
import Link from "next/link";

export default async function CategoryPage() {
  const cats = await getHierarchicalCategories();

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-950 dark:text-zinc-100">
        Browse Categories
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {cats.map((cat) => (
          <Link
            href={`/category/${cat.slug}`}
            key={cat.id}
            className="flex flex-col items-center rounded-xl border border-slate-200 p-4 text-center transition hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950/60"
          >
            {cat.iconImage && (
              <Image
                src={cat.iconImage}
                width={50}
                height={50}
                alt={cat.name}
              />
            )}
            <span className="mt-2 font-medium text-slate-950 dark:text-zinc-100">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
