type Props = {
  role: string;
};

export function ForbiddenPage({ role }: Props) {
  return (
    <section className="demo-page" role="alert">
      <h1 className="demo-page-title">403 — Access Denied</h1>
      <p className="demo-page-subtitle">
        You need the <code>{role}</code> role to view this page.
      </p>
    </section>
  );
}
