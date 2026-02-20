import RoleHomeLink from "@/components/layout/RoleHomeLink";

const NotFoundError = () => {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          404 - Page Not Found
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base md:text-lg">
        Sorry, the page you are looking for does not exist.
        </p>
        <RoleHomeLink
          className="mt-6 w-full max-w-xs rounded-lg bg-blue-600 px-6 py-3 text-sm text-white transition hover:bg-blue-700 sm:w-auto sm:text-base"
        />
      </div>
    </main>
  );
};

export default NotFoundError;
