import { getAuth, logout } from "@/auth/actions";

export default async function DashboardPage() {
  const auth = (await getAuth())!;

  return (
    <main className="grid h-screen w-screen place-items-center">
      <div>
        <p>{auth.properties.email}</p>
      </div>
    </main>
  );
}
