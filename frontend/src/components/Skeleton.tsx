interface SkeletonProps {
  count?: number;
  variant?: 'list' | 'grid' | 'text' | 'card';
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-gray-100 rounded">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/5" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
          <div className="flex gap-1">
            <div className="h-7 w-12 bg-gray-200 rounded" />
            <div className="h-7 w-16 bg-gray-200 rounded" />
            <div className="h-7 w-14 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded overflow-hidden">
          <div className="w-full aspect-square bg-gray-200" />
          <div className="p-1 h-4 bg-gray-100 rounded m-1" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonText() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex justify-between mb-4">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-8 w-28 bg-gray-200 rounded" />
      </div>
      <div className="h-80 bg-gray-200 rounded" />
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-24 mb-6" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg">
            <div className="h-40 bg-gray-200 rounded mb-3" />
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Skeleton({ count = 5, variant = 'list' }: SkeletonProps) {
  switch (variant) {
    case 'grid':
      return <SkeletonGrid count={count} />;
    case 'text':
      return <SkeletonText />;
    case 'card':
      return <SkeletonCard />;
    case 'list':
    default:
      return <SkeletonList count={count} />;
  }
}
