import ProjectForm from "./(components)/ProjectForm";

export default function AddNewProjectPage() {
  return (
    <section className="space-y-6 rounded-2xl border border-brand bg-white p-6 shadow-brand-soft">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Add New Project</h1>
        <p className="text-sm text-brand-muted">
          Fill out the form below to add a new project to the MEAL MIS.
        </p>
      </div>
      <div>
        <ProjectForm />
      </div>
    </section>
  );
}
