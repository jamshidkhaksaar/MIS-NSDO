import Link from "next/link";

export default function ProjectsPage() {
  return (
    <section className="space-y-5 rounded-2xl border border-brand bg-white p-6 shadow-brand-soft">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Projects</h1>
        <p className="text-sm text-brand-muted">
          Manage your project pipeline, add new initiatives, and keep clusters and sectors up to date.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/projects/new"
          className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand"
        >
          Add New Project
        </Link>
        <Link
          href="/projects/catalog-modifier"
          className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold chip-brand"
        >
          Cluster &amp; Sector Modifier
        </Link>
      </div>
      <p className="text-xs text-brand-soft">
        Tip: keep your sector and cluster catalog current so project teams can select the right tags during data entry.
      </p>
    </section>
  );
}
