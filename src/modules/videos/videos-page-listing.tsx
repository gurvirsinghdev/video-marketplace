"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppRouter } from "@/trpc/routers/_app";
import DashboardDialogHeader from "../dashboard/dialog-header";
import PaginatedList from "../tables/paginated-list";
import VideoItem from "./video-item";
import importDynamic from "next/dynamic";
import { inferProcedureOutput } from "@trpc/server";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const VideoPlayer = importDynamic(
  async () => (await import("./video-player")).default,
  {
    ssr: false,
  },
);

export const dynamic = "force-dynamic";

export default function VideosPageListing() {
  const trpc = useTRPC();
  const searchParams = useSearchParams();

  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;

  const listMyVideosPaginatedQuery = useSuspenseQuery(
    trpc.video.listMyVideosPaginated.queryOptions({ page }),
  );
  const authenticatedUser = useSuspenseQuery(
    trpc.auth.getAuthenticatedUser.queryOptions(),
  );

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [unprocessedVideos, setUnprocessedVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<
    | inferProcedureOutput<
        AppRouter["video"]["listMyVideosPaginated"]
      >["records"][number]
    | null
  >(null);

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
    // eslint-disable-next-line
    [unprocessedVideos],
  );

  return (
    <React.Fragment>
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
              <div onClick={() => setSelectedVideo(video)}>
                <VideoItem
                  author={authenticatedUser.data.name!}
                  video={video}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog
        open={selectedVideo != null}
        onOpenChange={() => setSelectedVideo(null)}
      >
        <DialogContent>
          <DashboardDialogHeader title="" brief="" />
          {selectedVideo ? (
            <VideoPlayer
              thumbnailUrl={selectedVideo.thumbnail_key}
              playlistUrl={selectedVideo.m3u8_key}
            />
          ) : (
            <div className="bg-accent aspect-video h-full w-full animate-pulse"></div>
          )}
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
