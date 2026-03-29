import { cn } from "@/lib/utils";

export default function SitePageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto flex min-h-full w-full flex-1 flex-col", className)}>
      {children}
    </main>
  );
}
