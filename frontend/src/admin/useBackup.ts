import { useState, useCallback, useEffect, useRef } from 'react';
import { backupApi, BackupFile, BackupType } from '../api/backup';

export type RestoreType = BackupType;

export function useBackup() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [creating, setCreating] = useState<BackupType | null>(null);
  const [restoring, setRestoring] = useState<RestoreType | null>(null);
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState<{ type: RestoreType; file: File } | null>(null);
  const dbFileRef = useRef<HTMLInputElement>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchList = useCallback(async () => {
    try {
      const res = await backupApi.list();
      setBackups(res.data);
    } catch (e: any) {
      showToast(e.message || 'Failed to load backups');
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleCreate = async (type: BackupType) => {
    setCreating(type);
    try {
      await backupApi.createAndDownload(type);
      showToast(type === 'database' ? 'Database backup created and downloaded' : 'Media backup created and downloaded');
      fetchList();
    } catch (e: any) {
      showToast(e.message || 'Backup failed');
    } finally {
      setCreating(null);
    }
  };

  const handleDownload = async (file: BackupFile) => {
    try {
      await backupApi.downloadExisting(file.filename);
    } catch (e: any) {
      showToast(e.message || 'Download failed');
    }
  };

  const handleDelete = async (file: BackupFile) => {
    try {
      await backupApi.remove(file.filename);
      showToast('Backup deleted');
      fetchList();
    } catch (e: any) {
      showToast(e.message || 'Delete failed');
    }
  };

  const requestRestore = (type: RestoreType, file: File) => {
    setConfirm({ type, file });
  };

  const executeRestore = async () => {
    if (!confirm) return;
    const { type, file } = confirm;
    setRestoring(type);
    setConfirm(null);
    try {
      await backupApi.restore(type, file);
      showToast(type === 'database' ? 'Database restored successfully' : 'Media files restored successfully');
    } catch (e: any) {
      showToast(e.message || 'Restore failed');
    } finally {
      setRestoring(null);
      if (dbFileRef.current) dbFileRef.current.value = '';
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    }
  };

  const cancelRestore = () => setConfirm(null);

  return {
    backups, creating, restoring, toast, confirm,
    dbFileRef, mediaFileRef,
    handleCreate, handleDownload, handleDelete, requestRestore,
    executeRestore, cancelRestore,
  };
}
