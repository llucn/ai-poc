import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/require-auth';
import { RequireRole } from './auth/require-role';
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
import { SessionListPage } from './pages/chat/session-list';
import { ChatPage } from './pages/chat/chat-page';
import { AppShell } from './shell/app-shell';

export function App() {
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
