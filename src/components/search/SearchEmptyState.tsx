const SearchEmptyState = ({ query }: { query: string }) => {
  return (
    <div className="border rounded-xl light:bg-white p-10 text-center space-y-2">
      <p className="text-lg font-medium">No results found</p>
      <p className="text-sm text-gray-500">
        We couldn’t find any products for “{query}”
      </p>
    </div>
  );
};

export default SearchEmptyState;
