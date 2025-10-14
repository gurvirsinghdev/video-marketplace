import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";

import DashboardVideosView from "@/views/dashboard/videos.page";

export default async function DashboardVideosPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.video.listMyVideosPaginated.queryOptions(),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardVideosView />
    </HydrationBoundary>
  );
}
