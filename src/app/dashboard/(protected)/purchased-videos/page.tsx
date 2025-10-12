import DashboardPageContents from "@/modules/dashboard/dashboard-page-contents";
import DashboardPageHeader from "@/modules/dashboard/page-header";

export default function DashboardPurchasedPage() {
  return (
    <DashboardPageContents>
      <DashboardPageHeader
        title="Approved Video Licenses"
        brief="Videos you have requested and been granted a license to access."
      />
    </DashboardPageContents>
  );
}
