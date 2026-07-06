import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFile, faFilePdf, faFolder } from '@fortawesome/free-solid-svg-icons';
import { useApiFetch } from '../../auth/use-api-fetch';

interface SearchResultChunk {
  id: number;
  documentId: number;
  documentName: string;
  documentType: number;
  documentPath: string;
  documentTags: { tags: string[] } | null;
  chunkIndex: number;
  chunkContent: string;
  rank: number;
}

interface SearchResponse {
  data: SearchResultChunk[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function SearchPage() {
  const apiFetch = useApiFetch();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'keyword' | 'similarity'>('keyword');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const handleSearch = useCallback(async (searchQuery: string, type: 'keyword' | 'similarity', pageNum: number) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(
        `/knowledge/search?q=${encodeURIComponent(searchQuery)}&type=${type}&page=${pageNum}&pageSize=${pageSize}`
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchType('keyword');
    setPage(1);
    handleSearch(query, 'keyword', 1);
  };

  const handleSimilaritySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchType('similarity');
    setPage(1);
    handleSearch(query, 'similarity', 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleSearch(query, searchType, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIcon = (type: number) => {
    switch (type) {
      case 1: return <FontAwesomeIcon icon={faFolder} className="ic-icon-folder" />;
      case 2: return <FontAwesomeIcon icon={faFile} className="ic-icon-file" />;
      case 3: return <FontAwesomeIcon icon={faFilePdf} className="ic-icon-pdf" />;
      default: return null;
    }
  };

  const highlightSnippet = (content: string) => {
    const maxLen = 200;
    if (content.length <= maxLen) return content;
    return content.substring(0, maxLen) + '...';
  };

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">Knowledge Search</h1>
      </header>

      <form onSubmit={handleKeywordSearch} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '800px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ic-input"
            placeholder="Search documents..."
            autoFocus
            style={{ flex: 1 }}
          />
          <button type="submit" className="ic-btn ic-btn-primary" disabled={loading || !query.trim()}>
            <FontAwesomeIcon icon={faSearch} /> Keyword Search
          </button>
          <button type="button" className="ic-btn ic-btn-secondary" onClick={handleSimilaritySearch} disabled={loading || !query.trim()}>
            <FontAwesomeIcon icon={faSearch} /> Similarity Search
          </button>
        </div>
      </form>

      {error && <p className="ic-error-block" role="alert">{error}</p>}

      {loading && <p>Searching...</p>}

      {results && (
        <div>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Found {results.total} {results.total === 1 ? 'document' : 'documents'} matching "{query}"
            <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>
              ({searchType === 'keyword' ? 'Keyword Search' : 'Similarity Search'})
            </span>
          </p>

          {results.data.length === 0 ? (
            <p className="ic-field-hint">No documents found.</p>
          ) : (
            <div className="ic-table-wrap">
              <table className="ic-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Path</th>
                    <th>Snippet</th>
                    <th style={{ width: '80px' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((chunk) => (
                    <tr key={chunk.id}>
                      <td>
                        {getIcon(chunk.documentType)}{' '}
                        <Link to={`/knowledge/documents/${chunk.documentId}`}>
                          {chunk.documentName}
                        </Link>
                      </td>
                      <td style={{ fontSize: '0.9em', color: '#666' }}>{chunk.documentPath}</td>
                      <td style={{ fontSize: '0.9em', lineHeight: '1.4' }}>{highlightSnippet(chunk.chunkContent)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.85em' }}>{chunk.rank.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {results.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="ic-btn ic-btn-secondary"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9em', color: '#666' }}>
                Page {page} of {results.totalPages}
              </span>
              <button
                type="button"
                className="ic-btn ic-btn-secondary"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === results.totalPages || loading}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
