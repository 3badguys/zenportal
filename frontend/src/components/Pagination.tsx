interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  variant?: 'full' | 'simple';
}

export default function Pagination({ page, totalPages, onPage, variant = 'simple' }: PaginationProps) {
  if (variant === 'simple') {
    return (
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 border rounded text-sm disabled:opacity-30 transition-colors hover:bg-gray-50"
        >
          Prev
        </button>
        <span className="px-3 py-1 text-sm text-gray-500">
          {page}/{totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 border rounded text-sm disabled:opacity-30 transition-colors hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    );
  }

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex justify-center items-center gap-1 mt-8">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 border rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-1 text-sm text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`px-3 py-1 border rounded text-sm transition-colors ${
              p === page ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 border rounded text-sm hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
