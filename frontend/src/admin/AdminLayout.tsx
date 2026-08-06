import { useState, useEffect, useRef } from 'react';
import { layoutApi, Block } from '../api/layout';
import Skeleton from '../components/Skeleton';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminLayout() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [json, setJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await layoutApi.get('home');
        setBlocks(res.data.blocks);
        setJson(JSON.stringify(res.data.blocks, null, 2));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validateAndShowError = (raw: string): boolean => {
    try {
      JSON.parse(raw);
      setErrorLine(null);
      setError('');
      return true;
    } catch (e: any) {
      const match = e.message?.match(/position\s+(\d+)/);
      if (match) {
        const pos = parseInt(match[1], 10);
        const lineNum = raw.substring(0, pos).split('\n').length;
        setErrorLine(lineNum);
        const line = raw.split('\n')[lineNum - 1] || '';
        setError(`Line ${lineNum}: ${e.message.split('\n')[0]}`);
      } else {
        setErrorLine(null);
        setError(e.message || 'Invalid JSON');
      }
      return false;
    }
  };

  const handleJsonChange = (val: string) => {
    setJson(val);
    if (error) validateAndShowError(val);
  };

  const handleSaveClick = () => {
    if (!validateAndShowError(json)) return;
    setShowConfirm(true);
  };

  const handleSave = async () => {
    setShowConfirm(false);
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        setError('blocks must be a JSON array');
        return;
      }
      setLoading(true);
      await layoutApi.update('home', parsed);
      setBlocks(parsed);
      setMessage('Saved!');
      setError('');
      setErrorLine(null);
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
    } finally {
      setLoading(false);
    }
  };

  if (loading && blocks.length === 0) return <Skeleton variant="text" />;

  const lineCount = json.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Page Layout (Home)</h2>
        <button onClick={handleSaveClick} disabled={loading} className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {loading ? 'Saving...' : 'Save Config'}
        </button>
      </div>

      {message && (
        <div className="mb-3 p-2 bg-green-50 text-green-700 rounded text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-green-400 hover:text-green-600 ml-2">&times;</button>
        </div>
      )}
      {error && <div className="mb-3 p-2 bg-red-50 text-red-600 rounded text-sm">{error}</div>}

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">
          Block types: <code className="bg-gray-100 px-1 rounded">Hero</code>, <code className="bg-gray-100 px-1 rounded">SocialLinks</code>, <code className="bg-gray-100 px-1 rounded">FeaturedPosts</code>, <code className="bg-gray-100 px-1 rounded">Divider</code>, <code className="bg-gray-100 px-1 rounded">AboutMe</code>
        </p>
        <div className="relative border border-gray-300 rounded overflow-hidden focus-within:border-gray-400 transition-colors">
          <div className="flex">
            <div className="bg-gray-100 text-right select-none py-2 pr-2 border-r border-gray-200 shrink-0" style={{ minWidth: '3rem' }}>
              {lineNumbers.map((ln) => (
                <div
                  key={ln}
                  className={`text-xs font-mono px-1 ${ln === errorLine ? 'bg-red-100 text-red-600 font-bold rounded-r' : 'text-gray-400'}`}
                  style={{ fontSize: '0.813rem', lineHeight: '1.5715' }}
                >
                  {ln}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={json}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="flex-1 px-3 py-2 font-mono text-sm min-h-[400px] outline-none resize-none"
              style={{ fontSize: '0.813rem', lineHeight: '1.5715' }}
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Preview ({blocks.length} blocks)</h3>
        <div className="space-y-1">
          {blocks.map((b, idx) => (
            <div key={b.id ?? `block-${idx}`} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded transition-all hover:bg-gray-100">
              <span className="font-medium text-gray-700 w-24 shrink-0">{b.type}</span>
              <span className="text-gray-400 text-xs">id={b.id}</span>
              <span className="text-gray-400 text-xs truncate">{JSON.stringify(b.props).slice(0, 60)}</span>
            </div>
          ))}
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          confirmLabel="Save"
          title="Save Layout Config"
          message={`This will overwrite the current layout with ${JSON.parse(json).length} blocks. Continue?`}
          onConfirm={handleSave}
          onCancel={() => setShowConfirm(false)}
          variant="default"
        />
      )}
    </div>
  );
}
