import { Button } from "@/components/ui/button";
import { logout } from "@/auth/actions";

export default function DashboardPage() {
  return (
    <main className="grid h-screen w-screen place-items-center">
      {" "}
      <p>
        <Button onClick={logout} variant={"destructive"}>
          Logout
        </Button>
      </p>
    </main>
  );
}
