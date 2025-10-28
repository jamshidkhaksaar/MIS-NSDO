import type { ReactNode } from "react";
import DataEntryShell from "./(components)/DataEntryShell";

type DataEntryLayoutProps = {
  children: ReactNode;
};

export default function DataEntryLayout({ children }: DataEntryLayoutProps) {
  return <DataEntryShell>{children}</DataEntryShell>;
}
