type Props = {
  title: string;
};

export function DemoPage({ title }: Props) {
  return (
    <section className="demo-page">
      <h1 className="demo-page-title">{title}</h1>
      <p className="demo-page-subtitle">
        Placeholder page for the <strong>{title}</strong> menu item. Real
        content will land in a future change.
      </p>
    </section>
  );
}
