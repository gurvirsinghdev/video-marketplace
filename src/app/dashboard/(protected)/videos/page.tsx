import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";

import DashboardVideosView from "@/views/dashboard/videos.page";

interface Props {
  searchParams: Promise<Partial<{ page: string }>>;
}
export default async function DashboardVideosPage({ searchParams }: Props) {
  const queryClient = getQueryClient();
  const page = Number((await searchParams).page) || 1;
  void queryClient.prefetchQuery(
    trpc.video.listMyVideosPaginated.queryOptions({ page }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardVideosView />
    </HydrationBoundary>
  );
}
