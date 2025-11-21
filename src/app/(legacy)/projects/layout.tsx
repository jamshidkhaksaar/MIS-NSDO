import type { ReactNode } from "react";
import ProjectsShell from "./(components)/ProjectsShell";

type ProjectsLayoutProps = {
  children: ReactNode;
};

export default function ProjectsLayout({ children }: ProjectsLayoutProps) {
  return <ProjectsShell>{children}</ProjectsShell>;
}
