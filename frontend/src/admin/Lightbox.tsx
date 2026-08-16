import { useEffect } from 'react';
import { Medium } from '../api/media';

interface LightboxProps {
  media: Medium[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Lightbox({ media, index, onClose, onPrev, onNext }: LightboxProps) {
  const m = media[index];
  if (!m) return null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-10">&times;</button>
      <button onClick={e => { e.stopPropagation(); onPrev(); }} disabled={index <= 0} className="absolute left-4 text-white text-3xl hover:text-gray-300 transition-colors z-10 disabled:opacity-30">‹</button>
      <button onClick={e => { e.stopPropagation(); onNext(); }} disabled={index >= media.length - 1} className="absolute right-4 text-white text-3xl hover:text-gray-300 transition-colors z-10 disabled:opacity-30">›</button>
      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
        {m.mimeType?.startsWith('image/') ? (
          <img src={m.filePath} alt={m.originalName} className="max-w-full max-h-[80vh] object-contain rounded shadow-lg" />
        ) : m.mimeType?.startsWith('video/') ? (
          <video src={m.filePath} controls className="max-w-full max-h-[80vh] rounded shadow-lg" />
        ) : m.mimeType?.startsWith('audio/') ? (
          <div className="bg-gray-800 p-8 rounded shadow-lg flex flex-col items-center gap-4">
            <div className="text-6xl">🎵</div>
            <audio src={m.filePath} controls className="w-72 max-w-full" />
          </div>
        ) : (
          <div className="bg-gray-800 text-white p-8 rounded flex items-center justify-center text-4xl">📄</div>
        )}
        <div className="mt-3 text-white text-sm text-center max-w-md">
          <p className="truncate">{m.originalName}</p>
          <p className="text-gray-400 text-xs mt-0.5">{index + 1} / {media.length}</p>
        </div>
      </div>
    </div>
  );
}
