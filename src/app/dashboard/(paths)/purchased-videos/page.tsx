import { getQueryClient, trpc } from "@/trpc/server";
import DashboardPurchasedLicensesView from "@/views/dashboard/purchased-licenses.page";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface Props {
  searchParams: Promise<Partial<{ page: string }>>;
}

export default async function DashboardPurchasedPage({ searchParams }: Props) {
  const queryClient = getQueryClient();
  const page = Number((await searchParams).page) || 1;
  void queryClient.prefetchQuery(
    trpc.license.listUserRequestedLicensesPaginated.queryOptions({ page }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPurchasedLicensesView />
    </HydrationBoundary>
  );
}
