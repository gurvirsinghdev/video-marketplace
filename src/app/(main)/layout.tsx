import Header from "@/modules/base/header";

export default function MainLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  return (
    <main className="bg-card h-full min-h-screen w-full">
      <Header />
      {props.children}
    </main>
  );
}
