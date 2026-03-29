import { Star } from "lucide-react";

const StoreRatingSummary = ({
  averageRating,
  reviewCount,
}: {
  averageRating: number;
  reviewCount: number;
}) => {
  if (reviewCount === 0) {
    return <p className="text-sm text-gray-500">No ratings yet</p>;
  }

  return (
    <div className="flex items-center gap-1 font-medium text-yellow-500">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index <= Math.round(averageRating) ? "fill-yellow-500" : ""
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">
        {averageRating.toFixed(1)} • {reviewCount} review
        {reviewCount === 1 ? "" : "s"}
      </span>
    </div>
  );
};

export default StoreRatingSummary;
