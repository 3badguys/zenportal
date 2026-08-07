interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  variant?: 'full' | 'simple';
}

const btn =
  'px-3 py-1 border rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

/** Generate compact page list with ellipsis, e.g. [1, '...', 4, 5, 6, '...', 20] */
export function buildPages(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (page > 3) pages.push('...');
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push('...');
  pages.push(totalPages);
  return pages;
}

export default function Pagination({ page, totalPages, onPage, variant = 'simple' }: PaginationProps) {
  const common = (
    <>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={btn}>
        Prev
      </button>
      {variant === 'simple' ? (
        <span className="px-3 py-1 text-sm text-gray-500">{page}/{totalPages}</span>
      ) : (
        buildPages(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 py-1 text-sm text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`${btn} ${p === page ? 'bg-gray-900 text-white border-gray-900' : 'hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ),
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={btn}>
        Next
      </button>
    </>
  );

  return (
    <div className={`flex justify-center items-center gap-1 ${variant === 'simple' ? 'mt-4' : 'mt-8'}`}>
      {common}
    </div>
  );
}
