import { getQueryClient, trpc } from "@/trpc/server";
import DashboardLicenseRequestsView from "@/views/dashboard/license-request.page";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface Props {
  searchParams: Promise<Partial<{ page: string }>>;
}

export default async function DashbaordLicensePage({ searchParams }: Props) {
  const queryClient = getQueryClient();
  const page = Number((await searchParams).page) || 1;
  void queryClient.prefetchQuery(
    trpc.license.listMyLicensesRequestPagniated.queryOptions({ page }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardLicenseRequestsView />
    </HydrationBoundary>
  );
}
