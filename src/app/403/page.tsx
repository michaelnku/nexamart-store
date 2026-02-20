import RoleHomeLink from "@/components/layout/RoleHomeLink";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          403 - Forbidden
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base md:text-lg">
          You don&apos;t have permission to access this page.
        </p>
        <RoleHomeLink
          variant="link"
          className="mt-6 h-auto p-0 text-sm underline sm:text-base"
        />
      </div>
    </main>
  );
}
