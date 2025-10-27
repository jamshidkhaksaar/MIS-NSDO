import ProjectForm from "./(components)/ProjectForm";

export default function AddNewProjectPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12 text-brand-strong">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Add New Project</h1>
        <p className="text-sm text-brand-muted">
          Fill out the form below to add a new project to the MEAL MIS.
        </p>
      </div>
      <div className="mt-8">
        <ProjectForm />
      </div>
    </div>
  );
}
