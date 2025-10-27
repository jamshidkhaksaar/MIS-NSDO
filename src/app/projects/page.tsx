import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-start justify-center gap-4 px-6 py-12 text-brand-strong">
      <h1 className="text-3xl font-semibold">Projects</h1>
      <p className="text-sm text-brand-muted">
        This section is for managing projects. You can add a new project by clicking the button below.
      </p>
      <Link href="/projects/new" className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-semibold text-white shadow-brand-soft transition btn-brand">
        Add New Project
      </Link>
    </div>
  );
}
