import RoleHomeLink from "@/components/layout/RoleHomeLink";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">403 - Forbidden</h1>
      <p className="text-muted-foreground">
        You don't have the permission to access this page.
      </p>
      <RoleHomeLink variant="link" className="underline p-0 h-auto" />
    </div>
  );
}
