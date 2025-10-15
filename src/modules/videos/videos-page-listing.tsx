"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import PaginatedList from "../tables/paginated-list";
import VideoItem from "./video-item";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export const dynamic = "force-dynamic";

export default function VideosPageListing() {
  const trpc = useTRPC();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [unprocessedVideos, setUnprocessedVideos] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const listMyVideosPaginatedQuery = useSuspenseQuery(
    trpc.video.listMyVideosPaginated.queryOptions({ page }),
  );
  const authenticatedUser = useSuspenseQuery(
    trpc.auth.getAuthenticatedUser.queryOptions(),
  );

  useEffect(
    function () {
      const unprocessedVideos = listMyVideosPaginatedQuery.data.records.filter(
        (video) => new URL(video.thumbnail_key).pathname == "/null",
      );
      setUnprocessedVideos(unprocessedVideos.map((video) => video.id));
    },
    [listMyVideosPaginatedQuery.data],
  );

  useEffect(
    function () {
      if (unprocessedVideos.length == 0) clearTimeout(timeoutId!);
      else {
        setTimeoutId(setTimeout(listMyVideosPaginatedQuery.refetch, 5000));
      }
    },
    [unprocessedVideos],
  );

  return (
    <Card className="overflow-hidden py-1">
      <CardContent className="px-0">
        <PaginatedList
          currentPage={page}
          gotoPage={(page) => {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set("page", page.toString());
            router.push(`?${newSearchParams.toString()}`);
          }}
          pageSize={listMyVideosPaginatedQuery.data.pageSize}
          totalPages={listMyVideosPaginatedQuery.data.pages}
          className="divide-y"
          items={listMyVideosPaginatedQuery.data.records}
          loading={listMyVideosPaginatedQuery.isLoading}
          renderItem={(video) => (
            <VideoItem author={authenticatedUser.data.name!} video={video} />
          )}
        />
      </CardContent>
    </Card>
  );
}
