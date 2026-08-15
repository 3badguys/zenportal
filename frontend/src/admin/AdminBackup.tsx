import ConfirmDialog from '../components/ConfirmDialog';
import { useBackup, RestoreType } from './useBackup';
import { BackupFile, BackupType } from '../api/backup';

const TYPE_LABEL: Record<BackupType, string> = { database: 'Database', media: 'Media' };

function formatSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function RestoreRow({
  type, fileRef, restoring, onPick,
}: {
  type: RestoreType;
  fileRef: React.RefObject<HTMLInputElement>;
  restoring: RestoreType | null;
  onPick: (file: File) => void;
}) {
  const isDb = type === 'database';
  const busy = restoring === type;
  return (
    <div className="border border-gray-200 rounded p-4 bg-gray-50">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          {isDb ? 'Database restore:' : 'Media restore:'}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept={isDb ? '.sql' : '.tar.gz,.tgz'}
          className="text-sm text-gray-600 max-w-[220px] sm:max-w-none"
        />
        <button
          onClick={() => {
            const f = fileRef.current?.files?.[0];
            if (f) onPick(f);
          }}
          disabled={busy}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? 'Restoring, please wait...' : 'Upload & Restore'}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {isDb
          ? 'Only restores database content; media files are not affected.'
          : 'Only restores media files (images/videos/audio); the database is not affected.'}
      </p>
    </div>
  );
}

export default function AdminBackup() {
  const b = useBackup();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">💾 System Backup</h2>

      {/* Backup */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">📥 Backup (click to download)</h3>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => b.handleCreate('database')}
            disabled={b.creating !== null}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
          >
            {b.creating === 'database' ? 'Generating, please wait...' : '🗄️ Backup Database'} →
            <span className="block text-xs text-gray-300 mt-0.5">zenportal_database_YYYYMMDD_HHMMSS.sql</span>
          </button>
          <button
            onClick={() => b.handleCreate('media')}
            disabled={b.creating !== null}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
          >
            {b.creating === 'media' ? 'Generating, please wait...' : '🖼️ Backup Media Files'} →
            <span className="block text-xs text-gray-300 mt-0.5">zenportal_media_YYYYMMDD_HHMMSS.tar.gz</span>
          </button>
        </div>

        <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Recent backups</h4>
        {b.backups.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">No backups yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">File</th>
                <th className="py-2 pr-3 font-medium">Size</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {b.backups.map((f: BackupFile) => (
                <tr key={f.filename} className="border-b border-gray-100">
                  <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">{new Date(f.mtime).toLocaleString()}</td>
                  <td className="py-2 pr-3 text-gray-600">{TYPE_LABEL[f.type]}</td>
                  <td className="py-2 pr-3 text-gray-700 break-all">{f.filename}</td>
                  <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">{formatSize(f.size)}</td>
                  <td className="py-2 whitespace-nowrap">
                    <button
                      onClick={() => b.handleDownload(f)}
                      className="px-2 py-1 text-xs border rounded hover:bg-gray-100 mr-2 transition-colors"
                    >
                      ⬇ Download
                    </button>
                    <button
                      onClick={() => b.handleDelete(f)}
                      className="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-gray-400">💡 Backup files are stored on the server and retained for 30 days.</p>
      </div>

      {/* Restore */}
      <div className="border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-700 mb-3">📤 Restore (⚠️ Dangerous operation — will overwrite current data)</h3>
        <div className="space-y-3">
          <RestoreRow
            type="database"
            fileRef={b.dbFileRef}
            restoring={b.restoring}
            onPick={(f) => b.requestRestore('database', f)}
          />
          <RestoreRow
            type="media"
            fileRef={b.mediaFileRef}
            restoring={b.restoring}
            onPick={(f) => b.requestRestore('media', f)}
          />
        </div>
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          ⚠️ Make sure you have backed up your current data before restoring — this action is irreversible!
          <br />
          Do not refresh the page or close the browser during the restore process.
        </div>
      </div>

      {/* Toast */}
      {b.toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded shadow-lg">
          {b.toast}
        </div>
      )}

      {/* Confirm dialogs */}
      {b.confirm?.type === 'database' && (
        <ConfirmDialog
          title="Restore Database"
          message={'⚠️ Are you sure you want to restore the database?\n\nAll current data will be overwritten. This action cannot be undone!\n\n💡 Tip: create a database backup before restoring.'}
          confirmLabel="Confirm Restore"
          onConfirm={b.executeRestore}
          onCancel={b.cancelRestore}
        />
      )}
      {b.confirm?.type === 'media' && (
        <ConfirmDialog
          title="Restore Media Files"
          message={'⚠️ Are you sure you want to restore media files?\n\nThe storage/ directory will be completely overwritten. This action cannot be undone!\n\n💡 Tip: create a media backup before restoring.'}
          confirmLabel="Confirm Restore"
          onConfirm={b.executeRestore}
          onCancel={b.cancelRestore}
        />
      )}
    </div>
  );
}
