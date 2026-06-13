import { useCallback, useEffect, useState } from 'react';
import {
  faCircleCheck,
  faCircleXmark,
  faPen,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import { ConfirmDeleteDialog } from '../../../components/confirm-delete-dialog';
import { SystemPromptEditor } from './system-prompt-editor';
import { McpServerDialog } from './mcp-server-dialog';
import { SkillDialog } from './skill-dialog';
import type { Agent, AgentSkill, AgentTool } from './types';

// Tracks the open dialog (if any) on the detail page.
type DialogState =
  | { kind: 'none' }
  | { kind: 'system-prompt' }
  | { kind: 'tool-add' }
  | { kind: 'tool-remove'; tool: AgentTool }
  | { kind: 'skill-add' }
  | { kind: 'skill-remove'; skill: AgentSkill }
  | { kind: 'agent-delete' };

export function AgentDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  const [busy, setBusy] = useState(false);
  // Per-server reachability status: undefined=unknown, true/false=test result.
  const [serverStatus, setServerStatus] = useState<Record<number, boolean>>({});

  const loadAgent = useCallback(async () => {
    if (id === null) {
      setError('Invalid agent id');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`/agents/${id}`);
      const data: Agent = await res.json();
      setAgent(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, id]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  // PLACEHOLDER_HANDLERS_DONE

  const closeDialog = useCallback(() => {
    if (!busy) setDialog({ kind: 'none' });
  }, [busy]);

  // Save the system prompt, then refresh and close.
  const onSaveSystemPrompt = useCallback(
    async (value: string | null) => {
      if (id === null) return;
      setBusy(true);
      try {
        await apiFetch(`/agents/${id}/system-prompt`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemPrompt: value }),
        });
        await loadAgent();
        setDialog({ kind: 'none' });
      } finally {
        setBusy(false);
      }
    },
    [apiFetch, id, loadAgent]
  );

  const onDeleteAgent = useCallback(async () => {
    if (id === null) return;
    setBusy(true);
    try {
      await apiFetch('/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      navigate('/settings/agents');
    } finally {
      setBusy(false);
    }
  }, [apiFetch, id, navigate]);

  const onUnlinkTool = useCallback(
    async (toolId: number) => {
      if (id === null) return;
      setBusy(true);
      try {
        await apiFetch(`/agents/${id}/tools/${toolId}`, {
          method: 'DELETE',
        });
        await loadAgent();
        setDialog({ kind: 'none' });
      } finally {
        setBusy(false);
      }
    },
    [apiFetch, id, loadAgent]
  );

  const onUnlinkSkill = useCallback(
    async (skillId: number) => {
      if (id === null) return;
      setBusy(true);
      try {
        await apiFetch(`/agents/${id}/skills/${skillId}`, {
          method: 'DELETE',
        });
        await loadAgent();
        setDialog({ kind: 'none' });
      } finally {
        setBusy(false);
      }
    },
    [apiFetch, id, loadAgent]
  );

  // Test each associated Tool's reachability for the Status column.
  const checkServerStatus = useCallback(
    async (toolList: AgentTool[]) => {
      // Client tools run in the browser; only probe MCP tools' servers.
      const mcpTools = toolList.filter((t) => t.kind !== 'client');
      const entries = await Promise.all(
        mcpTools.map(async (t) => {
          try {
            const res = await apiFetch(`/tools/test`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ serverUrl: t.serverUrl }),
            });
            await res.json();
            return [t.id, true] as const;
          } catch {
            return [t.id, false] as const;
          }
        })
      );
      setServerStatus(Object.fromEntries(entries));
    },
    [apiFetch]
  );

  // Refresh server status whenever the tool list changes.
  useEffect(() => {
    if (agent?.tools && agent.tools.length > 0) {
      checkServerStatus(agent.tools);
    } else {
      setServerStatus({});
    }
  }, [agent?.tools, checkServerStatus]);

  if (loading) {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Loading…</h1>
        </header>
      </section>
    );
  }

  if (error || !agent) {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Agent not found</h1>
        </header>
        <p>
          <Link to="/settings/agents">Back to list</Link>
        </p>
      </section>
    );
  }

  const tools = agent.tools ?? [];
  const skills = agent.skills ?? [];

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/agents" />
          <h1 className="ic-page-title">Agent #{agent.id}</h1>
        </div>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate(`/settings/agents/${agent.id}/edit`)}
          >
            Edit
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setDialog({ kind: 'agent-delete' })}
          >
            - Delete
          </button>
        </div>
      </header>

      <dl className="profile-grid">
        <dt>ID</dt>
        <dd>#{agent.id}</dd>
        <dt>Name</dt>
        <dd>{agent.name}</dd>
        <dt>Description</dt>
        <dd>{agent.description ?? '—'}</dd>
        <dt>Model Name</dt>
        <dd>{agent.modelConfig?.modelName ?? '—'}</dd>
        <dt>Base URL</dt>
        <dd>{agent.modelConfig?.baseUrl ?? '—'}</dd>
        <dt>API Key</dt>
        <dd>{agent.hasApiKey ? '••••••••' : '—'}</dd>
        <dt>Default</dt>
        <dd>{agent.isDefault ? 'Yes' : 'No'}</dd>
      </dl>

      {/* System Prompt */}
      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">System Prompt</h2>
          <button
            type="button"
            className="ic-icon-btn"
            aria-label="Edit system prompt"
            title="Edit"
            onClick={() => setDialog({ kind: 'system-prompt' })}
          >
            <FontAwesomeIcon icon={faPen} />
          </button>
        </div>
        {agent.systemPrompt ? (
          <div className="ic-markdown-content">
            <MarkdownPreview source={agent.systemPrompt} />
          </div>
        ) : (
          <p className="ic-field-hint">No system prompt set.</p>
        )}
      </section>

      {/* Tools (associated from the global Tools catalog) */}
      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">Tools</h2>
          <button
            type="button"
            className="ic-icon-btn"
            aria-label="Add tool"
            title="Add"
            onClick={() => setDialog({ kind: 'tool-add' })}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className="ic-table-wrap">
          <table className="ic-table">
            <thead>
              <tr>
                <th className="ic-col-id">ID</th>
                <th>Server Name</th>
                <th>Type</th>
                <th>URL</th>
                <th>Tools</th>
                <th className="ic-col-icon">Status</th>
                <th className="ic-col-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {tools.length === 0 ? (
                <tr>
                  <td className="ic-table-empty" colSpan={7}>
                    No tools associated.
                  </td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool.id}>
                    <td className="ic-col-id">#{tool.id}</td>
                    <td>{tool.serverName}</td>
                    <td>
                      <span
                        className={`ic-badge ${
                          tool.kind === 'client'
                            ? 'ic-badge-green'
                            : 'ic-badge-blue'
                        }`}
                      >
                        {tool.kind === 'client' ? 'Client' : 'MCP'}
                      </span>
                    </td>
                    <td className="ic-col-url">{tool.serverUrl || '—'}</td>
                    <td>
                      <div className="ic-tag-list">
                        {(tool.mcpSchema ?? []).map((t, idx) => (
                          <span className="ic-tag" key={`${t.name}-${idx}`}>
                            {t.name}
                          </span>
                        ))}
                        {(!tool.mcpSchema ||
                          tool.mcpSchema.length === 0) && (
                          <span className="ic-field-hint">—</span>
                        )}
                      </div>
                    </td>
                    <td className="ic-col-icon">
                      {tool.kind === 'client' ? (
                        <span
                          className="ic-field-hint"
                          title="Browser tool — no server check"
                        >
                          N/A
                        </span>
                      ) : serverStatus[tool.id] === undefined ? (
                        <span className="ic-field-hint">…</span>
                      ) : serverStatus[tool.id] ? (
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="ic-icon-yes"
                          title="Reachable"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faCircleXmark}
                          className="ic-icon-no"
                          title="Unreachable"
                        />
                      )}
                    </td>
                    <td className="ic-col-actions">
                      <button
                        type="button"
                        className="ic-icon-btn ic-icon-btn-danger"
                        aria-label={`Remove ${tool.serverName}`}
                        title="Remove"
                        onClick={() => setDialog({ kind: 'tool-remove', tool })}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Skills */}
      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">Skills</h2>
          <button
            type="button"
            className="ic-icon-btn"
            aria-label="Add skill"
            title="Add"
            onClick={() => setDialog({ kind: 'skill-add' })}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className="ic-table-wrap">
          <table className="ic-table">
            <thead>
              <tr>
                <th className="ic-col-id">ID</th>
                <th>Name</th>
                <th>Description</th>
                <th className="ic-col-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {skills.length === 0 ? (
                <tr>
                  <td className="ic-table-empty" colSpan={4}>
                    No skills yet.
                  </td>
                </tr>
              ) : (
                skills.map((skill) => (
                  <tr key={skill.id}>
                    <td className="ic-col-id">#{skill.id}</td>
                    <td>{skill.name}</td>
                    <td>{skill.description || '—'}</td>
                    <td className="ic-col-actions">
                      <button
                        type="button"
                        className="ic-icon-btn ic-icon-btn-danger"
                        aria-label={`Remove ${skill.name}`}
                        title="Remove"
                        onClick={() =>
                          setDialog({ kind: 'skill-remove', skill })
                        }
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dialogs */}
      {dialog.kind === 'system-prompt' && (
        <SystemPromptEditor
          initialValue={agent.systemPrompt}
          busy={busy}
          onSave={onSaveSystemPrompt}
          onCancel={closeDialog}
        />
      )}

      {dialog.kind === 'tool-add' && (
        <McpServerDialog
          agentId={agent.id}
          linkedToolIds={tools.map((t) => t.id)}
          onSaved={() => {
            loadAgent();
            setDialog({ kind: 'none' });
          }}
          onCancel={closeDialog}
        />
      )}

      {dialog.kind === 'tool-remove' && (
        <ConfirmDeleteDialog
          busy={busy}
          message={`Remove tool "${dialog.tool.serverName}" from this agent?`}
          onCancel={closeDialog}
          onConfirm={() => onUnlinkTool(dialog.tool.id)}
        />
      )}

      {dialog.kind === 'skill-add' && (
        <SkillDialog
          agentId={agent.id}
          linkedSkillIds={skills.map((s) => s.id)}
          onSaved={() => {
            loadAgent();
            setDialog({ kind: 'none' });
          }}
          onCancel={closeDialog}
        />
      )}

      {dialog.kind === 'skill-remove' && (
        <ConfirmDeleteDialog
          busy={busy}
          message={`Remove skill "${dialog.skill.name}" from this agent?`}
          onCancel={closeDialog}
          onConfirm={() => onUnlinkSkill(dialog.skill.id)}
        />
      )}

      {dialog.kind === 'agent-delete' && (
        <ConfirmDeleteDialog
          busy={busy}
          message={`Delete Agent #${agent.id}?`}
          onCancel={closeDialog}
          onConfirm={onDeleteAgent}
        />
      )}
    </section>
  );
}
