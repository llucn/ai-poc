import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/require-auth';
import { RequireRole } from './auth/require-role';
import { DemoPage } from './pages/demo-page';
import { FieldAddPage } from './pages/field/add-page';
import { FieldDetailPage } from './pages/field/detail-page';
import { FieldEditPage } from './pages/field/edit-page';
import { FieldListPage } from './pages/field/list-page';
import { FormAddPage } from './pages/form/add-page';
import { FormDesignPage } from './pages/form/design-page';
import { FormDetailPage } from './pages/form/detail-page';
import { FormEditPage } from './pages/form/edit-page';
import { FormListPage } from './pages/form/list-page';
import { IssueCategoryAddPage } from './pages/issue-category/add-page';
import { IssueCategoryDetailPage } from './pages/issue-category/detail-page';
import { IssueCategoryEditPage } from './pages/issue-category/edit-page';
import { IssueCategoryListPage } from './pages/issue-category/list-page';
import { LoginPage } from './pages/login/login-page';
import { ProfilePage } from './pages/profile-page';
import { AllUsersPage } from './pages/settings/users/all-users';
import { UserDetailPage } from './pages/settings/users/user-detail';
import { AddUserPage } from './pages/settings/users/add-user';
import { EditUserPage } from './pages/settings/users/edit-user';
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
                <Route path="/work-orders/all" element={<DemoPage title="All Orders" />} />
                <Route path="/work-orders/create" element={<DemoPage title="Create Order" />} />
                <Route path="/assets/equipment" element={<DemoPage title="Equipment" />} />
                <Route path="/assets/locations" element={<DemoPage title="Locations" />} />
                <Route path="/maintenance/schedules" element={<DemoPage title="Schedules" />} />
                <Route path="/maintenance/history" element={<DemoPage title="History" />} />
                <Route
                  path="/settings/issue-category"
                  element={
                    <RequireRole role="ADMIN">
                      <IssueCategoryListPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/issue-category/new"
                  element={
                    <RequireRole role="ADMIN">
                      <IssueCategoryAddPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/issue-category/:id"
                  element={
                    <RequireRole role="ADMIN">
                      <IssueCategoryDetailPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/issue-category/:id/edit"
                  element={
                    <RequireRole role="ADMIN">
                      <IssueCategoryEditPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/field"
                  element={
                    <RequireRole role="ADMIN">
                      <FieldListPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/field/new"
                  element={
                    <RequireRole role="ADMIN">
                      <FieldAddPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/field/:id"
                  element={
                    <RequireRole role="ADMIN">
                      <FieldDetailPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/field/:id/edit"
                  element={
                    <RequireRole role="ADMIN">
                      <FieldEditPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/form"
                  element={
                    <RequireRole role="ADMIN">
                      <FormListPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/form/new"
                  element={
                    <RequireRole role="ADMIN">
                      <FormAddPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/form/:id"
                  element={
                    <RequireRole role="ADMIN">
                      <FormDetailPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/form/:id/edit"
                  element={
                    <RequireRole role="ADMIN">
                      <FormEditPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/settings/form/:id/design"
                  element={
                    <RequireRole role="ADMIN">
                      <FormDesignPage />
                    </RequireRole>
                  }
                />
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
