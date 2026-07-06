import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { RequireAuth } from './auth/require-auth';
import { RequireRole } from './auth/require-role';
import { useApiFetch } from './auth/use-api-fetch';
import { useUser } from './contexts/UserContext';
import { getAllClientTools } from './pages/chat/client-tool-executor';
// Register all client tool definitions (defineClientTool side effects) at startup.
import './pages/chat/tools';
import { DemoPage } from './pages/demo-page';
import { LoginPage } from './pages/login/login-page';
import { ProfilePage } from './pages/profile-page';
import { AllUsersPage } from './pages/settings/users/all-users';
import { UserDetailPage } from './pages/settings/users/user-detail';
import { AddUserPage } from './pages/settings/users/add-user';
import { EditUserPage } from './pages/settings/users/edit-user';
import { AllAgentsPage } from './pages/settings/agents/all-agents';
import { AgentDetailPage } from './pages/settings/agents/agent-detail';
import { AddAgentPage } from './pages/settings/agents/add-agent';
import { EditAgentPage } from './pages/settings/agents/edit-agent';
import { AllToolsPage } from './pages/settings/tools/all-tools';
import { ToolDetailPage } from './pages/settings/tools/tool-detail';
import { AddToolPage } from './pages/settings/tools/add-tool';
import { EditToolPage } from './pages/settings/tools/edit-tool';
import { AllSkillsPage } from './pages/settings/skills/all-skills';
import { SkillDetailPage } from './pages/settings/skills/skill-detail';
import { AddSkillPage } from './pages/settings/skills/add-skill';
import { EditSkillPage } from './pages/settings/skills/edit-skill';
import { SessionListPage } from './pages/chat/session-list';
import { ChatPage } from './pages/chat/chat-page';
import { AppShell } from './shell/app-shell';
import { DocumentListPage } from './pages/knowledge/document-list';
import { DocumentViewPage } from './pages/knowledge/document-view';

export function App() {
  const apiFetch = useApiFetch();
  const user = useUser();

  // Sync the defineClientTool registry to the backend once the user is logged
  // in. The endpoint requires user credentials (X-User-Name header), so calling
  // it before login yields 401; gating on `user` avoids that and re-runs the
  // sync right after login. Errors are caught and logged; sync failure does not
  // block the app.
  useEffect(() => {
    if (!user) return;
    const syncRegistry = async () => {
      try {
        const tools = getAllClientTools();
        await apiFetch('/client-tools/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tools }),
        });
        // eslint-disable-next-line no-console
        console.log(`[ClientTools] Synced ${tools.length} tool(s) to backend`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ClientTools] Sync failed:', err);
      }
    };
    syncRegistry();
  }, [apiFetch, user]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <RequireAuth>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="/dashboard/overview" element={<DemoPage title="Overview" />} />
                <Route path="/dashboard/activity" element={<DemoPage title="Activity" />} />
                <Route path="/maintenance/schedules" element={<DemoPage title="Schedules" />} />
                <Route path="/maintenance/history" element={<DemoPage title="History" />} />
                <Route path="/chat/new" element={<ChatPage />} />
                <Route path="/chat/:id" element={<ChatPage />} />
                <Route path="/chat" element={<SessionListPage />} />
                <Route path="/knowledge/documents" element={<DocumentListPage />} />
                <Route path="/knowledge/documents/:id" element={<DocumentViewPage />} />
                <Route
                  path="/settings/users"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AllUsersPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/users/new"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AddUserPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/users/:id"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <UserDetailPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/users/:id/edit"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <EditUserPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/agents"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AllAgentsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/agents/new"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AddAgentPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/agents/:id"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AgentDetailPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/agents/:id/edit"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <EditAgentPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/tools"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AllToolsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/tools/new"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AddToolPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/tools/:id"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <ToolDetailPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/tools/:id/edit"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <EditToolPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/skills"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AllSkillsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/skills/new"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <AddSkillPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/skills/:id"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <SkillDetailPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/skills/:id/edit"
                  element={
                    <RequireRole role="SYSTEM_ADMIN">
                      <EditSkillPage />
                    </RequireRole>
                  }
                />
                <Route path="/settings/profile" element={<DemoPage title="Profile" />} />
                <Route path="/settings/preferences" element={<DemoPage title="Preferences" />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<DemoPage title="Not Found" />} />
              </Routes>
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
