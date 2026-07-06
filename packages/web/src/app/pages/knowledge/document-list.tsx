import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import MDEditor from '@uiw/react-md-editor';
import { useApiFetch } from '../../auth/use-api-fetch';
import { useUser } from '../../contexts/UserContext';
import { ConfirmDeleteDialog } from '../../components/confirm-delete-dialog';
import type { Document } from './types';
import { DOC_TYPE_DIRECTORY, DOC_TYPE_FILE, DOC_TYPE_ATTACHMENT } from './types';

type SortField = 'name' | 'createdOn' | 'updatedOn';
type SortOrder = 'ASC' | 'DESC';

export function DocumentListPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const user = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const parentId = parseInt(searchParams.get('parentId') || '0', 10);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
  const [breadcrumb, setBreadcrumb] = useState<{ id: number; name: string }[]>([]);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [mkdirDialogOpen, setMkdirDialogOpen] = useState(false);

  const isAdmin = user?.role === 'SYSTEM_ADMIN';

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(
        `/knowledge/documents?parentId=${parentId}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, parentId, sortBy, sortOrder]);

  // Build breadcrumb from current path
  const loadBreadcrumb = useCallback(async () => {
    if (parentId === 0) {
      setBreadcrumb([]);
      return;
    }
    try {
      const res = await apiFetch(`/knowledge/documents/${parentId}`);
      const doc = await res.json();
      const parts = doc.path.split('/').filter(Boolean);
      // Build breadcrumb trail by walking up
      const trail: { id: number; name: string }[] = [];
      let currentId = parentId;
      let currentDoc = doc;
      while (currentId !== 0) {
        trail.unshift({ id: currentDoc.id, name: currentDoc.name });
        currentId = currentDoc.parentId;
        if (currentId !== 0) {
          const parentRes = await apiFetch(`/knowledge/documents/${currentId}`);
          currentDoc = await parentRes.json();
        }
      }
      setBreadcrumb(trail);
    } catch {
      setBreadcrumb([]);
    }
  }, [apiFetch, parentId]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);
  useEffect(() => { loadBreadcrumb(); }, [loadBreadcrumb]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const toggleRow = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === documents.length ? new Set() : new Set(documents.map(d => d.id))
    );
  }, [documents]);

  const onDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch('/knowledge/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setDialogOpen(false);
      await loadDocuments();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, loadDocuments, selected]);

  const navigateToDir = (id: number) => {
    setSearchParams({ parentId: String(id) });
    setSelected(new Set());
  };

  const handleCreateDir = async (name: string) => {
    await apiFetch('/knowledge/directories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    });
    setMkdirDialogOpen(false);
    await loadDocuments();
  };

  const handleCreateDoc = async (name: string, content: string) => {
    await apiFetch('/knowledge/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId, content }),
    });
    setAddDialogOpen(false);
    await loadDocuments();
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parentId', String(parentId));
    await apiFetch('/knowledge/attachments', {
      method: 'POST',
      body: formData,
    });
    setUploadDialogOpen(false);
    await loadDocuments();
  };

  const getIcon = (type: number) => {
    switch (type) {
      case DOC_TYPE_DIRECTORY: return <FontAwesomeIcon icon={faFolder} className="ic-icon-folder" />;
      case DOC_TYPE_FILE: return <FontAwesomeIcon icon={faFile} className="ic-icon-file" />;
      case DOC_TYPE_ATTACHMENT: return <FontAwesomeIcon icon={faFilePdf} className="ic-icon-pdf" />;
      default: return null;
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleString() : '—';
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sortIndicator = (field: SortField) => {
    if (sortBy !== field) return '';
    return sortOrder === 'ASC' ? ' ▲' : ' ▼';
  };

  const colCount = isAdmin ? 6 : 5;

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">
          <span className="ic-breadcrumb">
            <a href="#" className="ic-link" onClick={(e) => { e.preventDefault(); setSearchParams({}); }}>
              Root
            </a>
            {breadcrumb.map((b) => (
              <span key={b.id}>
                {' / '}
                <a href="#" className="ic-link" onClick={(e) => { e.preventDefault(); navigateToDir(b.id); }}>
                  {b.name}
                </a>
              </span>
            ))}
          </span>
        </h1>
        {isAdmin && (
          <div className="ic-page-actions">
            <button type="button" className="ic-btn ic-btn-primary" onClick={() => setAddDialogOpen(true)}>
              + Add
            </button>
            <button type="button" className="ic-btn ic-btn-primary" onClick={() => setUploadDialogOpen(true)}>
              Upload
            </button>
            <button type="button" className="ic-btn ic-btn-secondary" onClick={() => setMkdirDialogOpen(true)}>
              Mkdir
            </button>
            <button
              type="button"
              className="ic-btn ic-btn-secondary"
              onClick={() => setDialogOpen(true)}
              disabled={selected.size === 0}
            >
              - Delete
            </button>
          </div>
        )}
      </header>

      {deleteError && <p className="ic-error-block" role="alert">{deleteError}</p>}

      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              {isAdmin && (
                <th className="ic-col-check">
                  <input type="checkbox" aria-label="Select all" checked={documents.length > 0 && selected.size === documents.length} onChange={toggleAll} disabled={documents.length === 0} />
                </th>
              )}
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>Name{sortIndicator('name')}</th>
              <th>Size</th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('createdOn')}>Created On{sortIndicator('createdOn')}</th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('updatedOn')}>Updated On{sortIndicator('updatedOn')}</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="ic-table-empty" colSpan={colCount}>Loading…</td></tr>
            )}
            {error && (
              <tr><td className="ic-table-empty" colSpan={colCount} role="alert">{error}</td></tr>
            )}
            {!loading && !error && documents.length === 0 && (
              <tr><td className="ic-table-empty" colSpan={colCount}>No documents.</td></tr>
            )}
            {!loading && !error && documents.map(doc => (
              <tr key={doc.id}>
                {isAdmin && (
                  <td className="ic-col-check">
                    <input type="checkbox" aria-label={`Select ${doc.name}`} checked={selected.has(doc.id)} onChange={() => toggleRow(doc.id)} />
                  </td>
                )}
                <td>
                  {getIcon(doc.type)}{' '}
                  {doc.type === DOC_TYPE_DIRECTORY ? (
                    <a href="#" className="ic-link" onClick={(e) => { e.preventDefault(); navigateToDir(doc.id); }}>{doc.name}</a>
                  ) : (
                    <Link to={`/knowledge/documents/${doc.id}`}>{doc.name}</Link>
                  )}
                </td>
                <td>{formatSize(doc.size)}</td>
                <td>{formatDate(doc.createdOn)}</td>
                <td>{formatDate(doc.updatedOn)}</td>
                <td>
                  <div className="ic-tag-list">
                    {doc.tags?.tags?.length ? doc.tags.tags.map(t => (
                      <span className="ic-tag" key={t}>{t}</span>
                    )) : <span className="ic-field-hint">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <ConfirmDeleteDialog
          busy={deleting}
          message="Delete selected documents?"
          onCancel={() => { if (!deleting) setDialogOpen(false); }}
          onConfirm={onDelete}
        />
      )}

      {mkdirDialogOpen && <InputDialog title="Create Directory" label="Directory name" onCancel={() => setMkdirDialogOpen(false)} onConfirm={(name) => handleCreateDir(name)} />}

      {addDialogOpen && <CreateDocDialog onCancel={() => setAddDialogOpen(false)} onConfirm={handleCreateDoc} />}

      {uploadDialogOpen && <UploadDialog onCancel={() => setUploadDialogOpen(false)} onConfirm={handleUpload} />}
    </section>
  );
}

// Simple input dialog (modal)
function InputDialog({ title, label, onCancel, onConfirm, defaultValue = '' }: {
  title: string; label: string; onCancel: () => void; onConfirm: (value: string) => void; defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="ic-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="ic-modal" role="dialog" aria-modal="true">
        <h2 className="ic-modal-title">{title}</h2>
        <div className="ic-modal-body">
          <label className="ic-field-label">{label}
            <input type="text" value={value} onChange={e => setValue(e.target.value)} className="ic-input" autoFocus />
          </label>
        </div>
        <div className="ic-modal-actions">
          <button type="button" className="ic-btn ic-btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="ic-btn ic-btn-primary" onClick={() => onConfirm(value)} disabled={!value.trim()}>OK</button>
        </div>
      </div>
    </div>
  );
}

// Create document dialog (modal) with Markdown editor
function CreateDocDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (name: string, content: string) => void }) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  return (
    <div className="ic-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="ic-modal ic-modal-lg" role="dialog" aria-modal="true">
        <h2 className="ic-modal-title">Add Markdown Document</h2>
        <div className="ic-modal-body">
          <div className="ic-field">
            <label className="ic-field-label">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="ic-input" autoFocus />
          </div>
          <div className="ic-field">
            <label className="ic-field-label">Content</label>
            <MDEditor value={content} onChange={(v) => setContent(v || '')} height={300} />
          </div>
        </div>
        <div className="ic-modal-actions">
          <button type="button" className="ic-btn ic-btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="ic-btn ic-btn-primary" onClick={() => onConfirm(name, content)} disabled={!name.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
}

// Upload dialog (modal)
function UploadDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="ic-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="ic-modal" role="dialog" aria-modal="true">
        <h2 className="ic-modal-title">Upload PDF</h2>
        <div className="ic-modal-body">
          <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="ic-modal-actions">
          <button type="button" className="ic-btn ic-btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="ic-btn ic-btn-primary" onClick={() => file && onConfirm(file)} disabled={!file}>Upload</button>
        </div>
      </div>
    </div>
  );
}
