import DashboardPageContents from "@/modules/dashboard/dashboard-page-contents";
import DashboardPageHeader from "@/modules/dashboard/page-header";

export default function DashboardPage() {
  return (
    <DashboardPageContents>
      <DashboardPageHeader
        title="Dashboard"
        brief="Welcome Back! See what's happening with your account."
      />
    </DashboardPageContents>
  );
}
