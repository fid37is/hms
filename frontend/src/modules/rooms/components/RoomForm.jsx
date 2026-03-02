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
  if (file.type === 'image/gif')            return 'gif';
  if (file.type.startsWith('video/'))       return 'video';
  return 'image';
}

function MediaThumb({ item, onDelete, deleting }) {
  const isVideo = item.type === 'video';
  return (
    <div className="relative group rounded-lg overflow-hidden aspect-video bg-black"
      style={{ border: '1px solid var(--border-soft)' }}>
      {isVideo ? (
        <video src={item.url} className="w-full h-full object-cover" muted />
      ) : (
        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
      )}
      {/* Type badge */}
      <span className="absolute bottom-1 left-1 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}>
        {isVideo ? <Film size={10} /> : <Image size={10} />}
        {item.type.toUpperCase()}
      </span>
      {/* Delete button */}
      <button type="button" onClick={() => onDelete(item)}
        disabled={deleting}
        className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: 'rgba(220,38,38,0.9)' }}>
        {deleting ? <Loader2 size={11} className="animate-spin text-white" /> : <X size={11} color="white" />}
      </button>
    </div>
  );
}

// ── Upload zone shown when room already exists (has an ID) ──
function MediaUploader({ roomId, media = [], onMediaChange }) {
  const [uploading,  setUploading]  = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    const remaining = MAX_FILES - media.length;
    const toUpload  = Array.from(files).slice(0, remaining);

    if (!toUpload.length) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    for (const file of toUpload) {
      const type   = getType(file);
      const maxMB  = type === 'video' ? MAX_VIDEO_MB : MAX_IMG_MB;
      const maxB   = maxMB * 1024 * 1024;
      if (file.size > maxB) {
        toast.error(`${file.name} exceeds ${maxMB}MB limit`);
        continue;
      }

      setUploading(true);
      try {
        const res = await roomApi.uploadRoomMedia(roomId, file);
        onMediaChange(res.data.data.media);
        toast.success(`${file.name} uploaded`);
      } catch (e) {
        toast.error(e.response?.data?.message || `Failed to upload ${file.name}`);
      } finally {
        setUploading(false);
      }
    }
    inputRef.current.value = '';
  };

  const handleDelete = async (item) => {
    setDeletingId(item.path);
    try {
      const res = await roomApi.deleteRoomMedia(roomId, item.path);
      onMediaChange(res.data.data.media);
      toast.success('Removed');
    } catch (e) {
      toast.error('Failed to remove');
    } finally {
      setDeletingId(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const canAdd = media.length < MAX_FILES;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">Room Media</label>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {media.length}/{MAX_FILES} files
        </span>
      </div>

      {/* Grid of existing media */}
      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {media.map(item => (
            <MediaThumb key={item.path} item={item}
              onDelete={handleDelete}
              deleting={deletingId === item.path} />
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canAdd && (
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && inputRef.current.click()}
          className="rounded-lg border-2 border-dashed flex flex-col items-center justify-center py-6 gap-2 cursor-pointer transition-colors"
          style={{ borderColor: 'var(--border-soft)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand)' }} />
          ) : (
            <Upload size={20} style={{ color: 'var(--text-muted)' }} />
          )}
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {uploading ? 'Uploading…' : 'Click or drag to upload'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            JPG, PNG, WebP, GIF (max 2MB) · MP4, WebM (max 5MB)
          </p>
          <input ref={inputRef} type="file" accept={ACCEPT}
            multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />
        </div>
      )}

      {!canAdd && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
          Maximum {MAX_FILES} files reached. Remove one to add more.
        </p>
      )}
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────
export default function RoomForm({ room, types = [], onSuccess }) {
  const isEdit = !!room;
  const qc     = useQueryClient();

  const [form, setForm] = useState(() => ({
    number:  room?.number  ?? '',
    floor:   room?.floor   != null ? String(room.floor) : '',
    type_id: room?.type_id ?? '',
    notes:   room?.notes   ?? '',
  }));
  const [media, setMedia] = useState(room?.media || []);
  const [savedRoom, setSavedRoom] = useState(room || null);

  const save = useMutation({
    mutationFn: (d) => isEdit
      ? roomApi.updateRoom(room.id, d)
      : roomApi.createRoom(d),
    onSuccess: (res) => {
      const saved = res.data.data;
      setSavedRoom(saved);
      setMedia(saved.media || []);
      qc.invalidateQueries(['rooms']);
      if (!isEdit) {
        toast.success('Room created — you can now add photos below');
      } else {
        toast.success('Room updated');
        onSuccess();
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save room'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({ ...form, floor: Number(form.floor) || null });
  };

  const roomId = savedRoom?.id;

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label" htmlFor="rf-number">Room Number *</label>
            <input id="rf-number" name="number" className="input" required
              value={form.number} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="rf-floor">Floor</label>
            <input id="rf-floor" name="floor" type="number" className="input"
              value={form.floor} onChange={handleChange} />
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

        <div className="flex justify-end gap-2">
          <button type="submit" disabled={save.isPending} className="btn-primary">
            {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Room'}
          </button>
        </div>
      </form>

      {/* Media section — only shown once room has an ID */}
      {roomId && (
        <>
          <div style={{ borderTop: '1px solid var(--border-soft)' }} />
          <MediaUploader
            roomId={roomId}
            media={media}
            onMediaChange={(updated) => {
              setMedia(updated);
              qc.invalidateQueries(['rooms']);
            }}
          />
          {!isEdit && media.length === 0 && (
            <div className="flex justify-end">
              <button type="button" onClick={onSuccess} className="btn-secondary text-sm">
                Skip for now
              </button>
            </div>
          )}
          {!isEdit && media.length > 0 && (
            <div className="flex justify-end">
              <button type="button" onClick={onSuccess} className="btn-primary text-sm">
                Done
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
