"use client";

interface Props {
  children: React.ReactNode;
}
export default function DashboardPageContents(props: Props) {
  return <section className="p-4 py-6 sm:space-y-6">{props.children}</section>;
}
