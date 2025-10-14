"use client";

import PaginatedList from "../tables/paginated-list";
import VideoItem from "./video-item";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export const dynamic = "force-dynamic";

export default function VideosPageListing() {
  const trpc = useTRPC();
  const listMyVideosPaginatedQuery = useSuspenseQuery(
    trpc.video.listMyVideosPaginated.queryOptions(),
  );
  const authenticatedUser = useSuspenseQuery(
    trpc.auth.getAuthenticatedUser.queryOptions(),
  );

  return (
    <PaginatedList
      items={listMyVideosPaginatedQuery.data}
      loading={listMyVideosPaginatedQuery.isLoading}
      renderItem={(video) => (
        <VideoItem author={authenticatedUser.data.name!} video={video} />
      )}
    />
  );
}
