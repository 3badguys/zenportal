import { useEffect, useState } from 'react';
import { useLayout } from '../hooks/useLayout';
import PageRenderer from '../components/PageRenderer';
import Skeleton from '../components/Skeleton';

export default function HomePage() {
  const { layout, loading, error, refetch } = useLayout('home');
  const [visible, setVisible] = useState(false);

  useEffect(() => { document.title = 'ZenPortal'; }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (loading) return <Skeleton variant="text" />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!layout) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">No content.</div>;
  }

  return (
    <div className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <PageRenderer blocks={layout.blocks} />
    </div>
  );
}
