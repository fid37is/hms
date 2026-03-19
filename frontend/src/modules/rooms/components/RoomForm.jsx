import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, Image, Film, Loader2 } from 'lucide-react';
import * as roomApi from '../../../lib/api/roomApi';
import toast from 'react-hot-toast';

const MAX_FILES    = 5;
const MAX_IMG_MB   = 2;
const MAX_VIDEO_MB = 5;
const ACCEPT       = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm';

function getType(file) {
  if (file.type === 'image/gif')       return 'gif';
  if (file.type.startsWith('video/'))  return 'video';
  return 'image';
}

// A staged file — local preview only, not yet uploaded
function StagedThumb({ item, onRemove }) {
  const isVideo = item.type === 'video';
  return (
    <div className="relative group rounded-lg overflow-hidden aspect-video"
      style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-soft)' }}>
      {isVideo ? (
        <video src={item.preview} className="w-full h-full object-cover" muted />
      ) : (
        <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
      )}
      <span className="absolute bottom-1 left-1 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff' }}>
        {isVideo ? <Film size={10} /> : <Image size={10} />}
        {item.type.toUpperCase()}
      </span>
      <button type="button" onClick={() => onRemove(item.id)}
        className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center
          opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
        style={{ backgroundColor: 'rgba(220,38,38,0.9)' }}>
        <X size={11} color="white" />
      </button>
    </div>
  );
}

// Already-saved media thumb (edit mode)
function SavedThumb({ item, onDelete, deleting }) {
  const isVideo = item.type === 'video';
  return (
    <div className="relative group rounded-lg overflow-hidden aspect-video"
      style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-soft)' }}>
      {isVideo ? (
        <video src={item.url} className="w-full h-full object-cover" muted />
      ) : (
        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
      )}
      <span className="absolute bottom-1 left-1 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff' }}>
        {isVideo ? <Film size={10} /> : <Image size={10} />}
        {item.type.toUpperCase()}
      </span>
      <button type="button" onClick={() => onDelete(item)} disabled={deleting}
        className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center
          opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
        style={{ backgroundColor: 'rgba(220,38,38,0.9)' }}>
        {deleting
          ? <Loader2 size={11} className="animate-spin text-white" />
          : <X size={11} color="white" />}
      </button>
    </div>
  );
}

export default function RoomForm({ room, types = [], onSuccess, onClose }) {
  const isEdit = !!room;
  const qc     = useQueryClient();
  const inputRef = useRef();

  const [form, setForm] = useState(() => ({
    number:  room?.number  ?? '',
    floor:   room?.floor   != null ? String(room.floor) : '',
    type_id: room?.type_id ?? '',
    notes:   room?.notes   ?? '',
  }));

  // Staged files (local, not yet uploaded) — used for create flow
  const [staged,     setStaged]     = useState([]);
  // Already-saved media (edit flow — these are on the server)
  const [savedMedia, setSavedMedia] = useState(room?.media || []);
  const [deletingId, setDeletingId] = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [dragOver,   setDragOver]   = useState(false);

  const totalCount = savedMedia.length + staged.length;
  const canAdd     = totalCount < MAX_FILES;

  // ── File staging ──────────────────────────────────────────
  const stageFiles = (files) => {
    const remaining = MAX_FILES - totalCount;
    const toAdd = Array.from(files).slice(0, remaining);
    if (!toAdd.length) { toast.error(`Maximum ${MAX_FILES} files allowed`); return; }

    const newStaged = [];
    for (const file of toAdd) {
      const type  = getType(file);
      const maxMB = type === 'video' ? MAX_VIDEO_MB : MAX_IMG_MB;
      if (file.size > maxMB * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${maxMB}MB limit`);
        continue;
      }
      newStaged.push({
        id:      `${Date.now()}-${Math.random()}`,
        file,
        type,
        preview: URL.createObjectURL(file),
      });
    }
    setStaged(prev => [...prev, ...newStaged]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeStaged = (id) => {
    setStaged(prev => {
      const item = prev.find(s => s.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(s => s.id !== id);
    });
  };

  // ── Delete saved media (edit mode) ────────────────────────
  const deleteSaved = async (item) => {
    setDeletingId(item.path);
    try {
      const res = await roomApi.deleteRoomMedia(room.id, item.path);
      setSavedMedia(res.data.data.media || []);
      qc.invalidateQueries(['rooms']);
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Main submit ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      // 1. Save room details
      const roomPayload = { ...form, floor: Number(form.floor) || null };
      let savedRoom;
      if (isEdit) {
        const res = await roomApi.updateRoom(room.id, roomPayload);
        savedRoom = res.data.data;
      } else {
        const res = await roomApi.createRoom(roomPayload);
        savedRoom = res.data.data;
      }

      // 2. Upload any staged files sequentially
      if (staged.length > 0) {
        let latestMedia = savedRoom.media || [];
        for (const item of staged) {
          try {
            const res = await roomApi.uploadRoomMedia(savedRoom.id, item.file);
            latestMedia = res.data.data.media || latestMedia;
            URL.revokeObjectURL(item.preview);
          } catch (err) {
            toast.error(`Failed to upload ${item.file.name}: ${err.response?.data?.message || 'Unknown error'}`);
          }
        }
        setSavedMedia(latestMedia);
      }

      qc.invalidateQueries(['rooms']);
      toast.success(isEdit ? 'Room updated' : 'Room created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Room details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label" htmlFor="rf-number">Room Number *</label>
          <input id="rf-number" name="number" className="input" required
            placeholder="e.g. 101" value={form.number} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="rf-floor">Floor</label>
          <input id="rf-floor" name="floor" type="number" className="input"
            placeholder="e.g. 1" value={form.floor} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="rf-type_id">Room Type *</label>
        <select id="rf-type_id" name="type_id" className="input" required
          value={form.type_id} onChange={handleChange}>
          <option value="">Select type…</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="rf-notes">Notes</label>
        <textarea id="rf-notes" name="notes" rows={2} className="input"
          value={form.notes} onChange={handleChange} />
      </div>

      {/* Media section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">
            Room Photos / Videos
            <span className="ml-1 font-normal normal-case" style={{ color: 'var(--text-muted)' }}>
              (optional)
            </span>
          </label>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {totalCount}/{MAX_FILES}
          </span>
        </div>

        {/* Saved media grid (edit mode) */}
        {savedMedia.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {savedMedia.map(item => (
              <SavedThumb key={item.path} item={item}
                onDelete={deleteSaved}
                deleting={deletingId === item.path} />
            ))}
          </div>
        )}

        {/* Staged (local preview) grid */}
        {staged.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {staged.map(item => (
              <StagedThumb key={item.id} item={item} onRemove={removeStaged} />
            ))}
          </div>
        )}

        {/* Upload zone */}
        {canAdd && (
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); stageFiles(e.dataTransfer.files); }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center py-6 gap-1.5 cursor-pointer transition-all"
            style={{
              borderColor:     dragOver ? 'var(--brand)' : 'var(--border-base)',
              backgroundColor: dragOver ? 'var(--brand-subtle)' : 'transparent',
            }}
          >
            <Upload size={20} style={{ color: dragOver ? 'var(--brand)' : 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: dragOver ? 'var(--brand)' : 'var(--text-muted)' }}>
              Click or drag to add photos
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              JPG, PNG, WebP, GIF (max 2MB) · MP4, WebM (max 5MB)
            </p>
            <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden"
              onChange={e => stageFiles(e.target.files)} />
          </div>
        )}

        {staged.length > 0 && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {staged.length} file{staged.length !== 1 ? 's' : ''} ready to upload — will be saved when you click below
          </p>
        )}
      </div>

      {/* Single submit button */}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={uploading} className="btn-primary">
          {uploading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" />
              {staged.length > 0 ? `Saving & uploading ${staged.length} file${staged.length !== 1 ? 's' : ''}…` : 'Saving…'}
            </span>
          ) : (
            isEdit ? 'Save Changes' : 'Create Room'
          )}
        </button>
      </div>
    </form>
  );
}