import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faDownload } from '@fortawesome/free-solid-svg-icons';
import MDEditor from '@uiw/react-md-editor';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useApiFetch } from '../../auth/use-api-fetch';
import { useUser } from '../../contexts/UserContext';
import { BackButton } from '../../components/back-button';
import { ConfirmDeleteDialog } from '../../components/confirm-delete-dialog';
import type { Document } from './types';
import { DOC_TYPE_FILE, DOC_TYPE_ATTACHMENT } from './types';

type DialogState =
  | { kind: 'none' }
  | { kind: 'delete' }
  | { kind: 'rename' };

export function DocumentViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const user = useUser();
  const isAdmin = user?.role === 'SYSTEM_ADMIN';

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  const [busy, setBusy] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [breadcrumb, setBreadcrumb] = useState<{ id: number; name: string }[]>([]);

  const loadDoc = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/knowledge/documents/${id}`);
      const data = await res.json();
      setDoc(data);
      setEditContent(data.content || '');
      setTagsInput(data.tags?.tags?.join(', ') || '');
      setRenameName(data.name);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, id]);

  // Build breadcrumb by walking up parent chain
  const loadBreadcrumb = useCallback(async () => {
    if (!doc) { setBreadcrumb([]); return; }
    const trail: { id: number; name: string }[] = [];
    let currentId = doc.parentId;
    while (currentId !== 0) {
      try {
        const res = await apiFetch(`/knowledge/documents/${currentId}`);
        const parent = await res.json();
        trail.unshift({ id: parent.id, name: parent.name });
        currentId = parent.parentId;
      } catch { break; }
    }
    setBreadcrumb(trail);
  }, [apiFetch, doc]);

  useEffect(() => { loadDoc(); }, [loadDoc]);
  useEffect(() => { loadBreadcrumb(); }, [loadBreadcrumb]);

  const closeDialog = useCallback(() => {
    if (!busy) setDialog({ kind: 'none' });
  }, [busy]);

  const handleSaveContent = async () => {
    setBusy(true);
    try {
      await apiFetch(`/knowledge/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      setEditing(false);
      await loadDoc();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveTags = async () => {
    setBusy(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await apiFetch(`/knowledge/documents/${id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      setEditingTags(false);
      await loadDoc();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = useCallback(async () => {
    setBusy(true);
    try {
      await apiFetch(`/knowledge/documents/${id}`, { method: 'DELETE' });
      navigate(`/knowledge/documents?parentId=${doc?.parentId || 0}`);
    } finally {
      setBusy(false);
    }
  }, [apiFetch, id, doc, navigate]);

  const handleRename = useCallback(async () => {
    setBusy(true);
    try {
      await apiFetch(`/knowledge/documents/${id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameName }),
      });
      setDialog({ kind: 'none' });
      await loadDoc();
    } finally {
      setBusy(false);
    }
  }, [apiFetch, id, renameName, loadDoc]);

  const handleDownload = () => {
    if (doc?.downloadUrl) {
      window.open(doc.downloadUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Loading…</h1>
        </header>
      </section>
    );
  }

  if (error || !doc) {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Document not found</h1>
        </header>
        <p>{error || 'The document could not be loaded.'}</p>
      </section>
    );
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleString() : '—';

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/knowledge/documents?parentId=${doc.parentId}`} />
          <h1 className="ic-page-title">
            <span className="ic-breadcrumb">
              <a href="#" className="ic-link" onClick={(e) => { e.preventDefault(); navigate('/knowledge/documents'); }}>
                Root
              </a>
              {breadcrumb.map((b) => (
                <span key={b.id}>
                  {' / '}
                  <a href="#" className="ic-link" onClick={(e) => { e.preventDefault(); navigate(`/knowledge/documents?parentId=${b.id}`); }}>
                    {b.name}
                  </a>
                </span>
              ))}
              {' / '}
              <span>{doc.name}</span>
            </span>
          </h1>
        </div>
        {isAdmin && (
          <div className="ic-page-actions">
            <button type="button" className="ic-btn ic-btn-secondary" onClick={() => { setRenameName(doc.name); setDialog({ kind: 'rename' }); }}>
              Rename
            </button>
            <button type="button" className="ic-btn ic-btn-secondary" onClick={() => setDialog({ kind: 'delete' })}>
              - Delete
            </button>
          </div>
        )}
      </header>

      <dl className="profile-grid">
        <dt>ID</dt>
        <dd>#{doc.id}</dd>
        <dt>Name</dt>
        <dd>{doc.name}</dd>
        <dt>Path</dt>
        <dd>{doc.path}</dd>
        <dt>Size</dt>
        <dd>{doc.size} bytes</dd>
        <dt>Created On</dt>
        <dd>{formatDate(doc.createdOn)}</dd>
        <dt>Created By</dt>
        <dd>{doc.createdBy}</dd>
        <dt>Updated On</dt>
        <dd>{formatDate(doc.updatedOn)}</dd>
        <dt>Updated By</dt>
        <dd>{doc.updatedBy || '—'}</dd>
      </dl>

      {/* Tags */}
      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">Tags</h2>
          {isAdmin && !editingTags && (
            <button type="button" className="ic-icon-btn" aria-label="Edit tags" title="Edit" onClick={() => setEditingTags(true)}>
              <FontAwesomeIcon icon={faPen} />
            </button>
          )}
        </div>
        {editingTags ? (
          <div>
            <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="ic-input" placeholder="tag1, tag2, tag3" />
            <div style={{ marginTop: '0.5rem' }}>
              <button type="button" className="ic-btn ic-btn-primary" onClick={handleSaveTags} disabled={busy}>Save</button>
              <button type="button" className="ic-btn ic-btn-secondary" onClick={() => setEditingTags(false)} disabled={busy} style={{ marginLeft: '0.5rem' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="ic-tag-list">
            {doc.tags?.tags?.length ? doc.tags.tags.map(t => <span key={t} className="ic-tag">{t}</span>) : <span className="ic-field-hint">No tags</span>}
          </div>
        )}
      </section>

      {/* Content - Markdown */}
      {doc.type === DOC_TYPE_FILE && (
        <section className="ic-section">
          <div className="ic-section-header">
            <h2 className="ic-section-title">Content</h2>
            {isAdmin && !editing && (
              <button type="button" className="ic-icon-btn" aria-label="Edit content" title="Edit" onClick={() => setEditing(true)}>
                <FontAwesomeIcon icon={faPen} />
              </button>
            )}
          </div>
          {editing ? (
            <div>
              <MDEditor value={editContent} onChange={(v) => setEditContent(v || '')} height={400} />
              <div style={{ marginTop: '0.5rem' }}>
                <button type="button" className="ic-btn ic-btn-primary" onClick={handleSaveContent} disabled={busy}>Save</button>
                <button type="button" className="ic-btn ic-btn-secondary" onClick={() => { setEditing(false); setEditContent(doc.content || ''); }} disabled={busy} style={{ marginLeft: '0.5rem' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="ic-markdown-content">
              <MarkdownPreview source={doc.content || ''} />
            </div>
          )}
        </section>
      )}

      {/* Content - PDF */}
      {doc.type === DOC_TYPE_ATTACHMENT && (
        <section className="ic-section">
          <div className="ic-section-header">
            <h2 className="ic-section-title">Content</h2>
          </div>
          <button type="button" className="ic-btn ic-btn-primary" onClick={handleDownload}>
            <FontAwesomeIcon icon={faDownload} /> Download PDF
          </button>
        </section>
      )}

      {/* Dialogs */}
      {dialog.kind === 'delete' && (
        <ConfirmDeleteDialog
          busy={busy}
          message={`Delete "${doc.name}"?`}
          onCancel={closeDialog}
          onConfirm={handleDelete}
        />
      )}

      {dialog.kind === 'rename' && (
        <div className="ic-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}>
          <div className="ic-modal" role="dialog" aria-modal="true">
            <h2 className="ic-modal-title">Rename</h2>
            <div className="ic-modal-body">
              <label className="ic-field-label">New name
                <input type="text" value={renameName} onChange={e => setRenameName(e.target.value)} className="ic-input" autoFocus />
              </label>
            </div>
            <div className="ic-modal-actions">
              <button type="button" className="ic-btn ic-btn-secondary" onClick={closeDialog} disabled={busy}>Cancel</button>
              <button type="button" className="ic-btn ic-btn-primary" onClick={handleRename} disabled={!renameName.trim() || busy}>Rename</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
