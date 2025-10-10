import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DashboardPageHeader from "@/modules/dashboard/page-header";

export default function DashboardSettingPage() {
  return (
    <section className="p-4 py-6 sm:space-y-6">
      <DashboardPageHeader
        title="Settings"
        brief="Manage your account settings and preferences"
      />

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account Settings</TabsContent>
      </Tabs>
    </section>
  );
}
