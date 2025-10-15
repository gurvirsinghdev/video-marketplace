"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppRouter } from "@/trpc/routers/_app";
import { Badge } from "@/components/ui/badge";
import BaseLoader from "../base/loader";
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
            emptyText="No videos to display. It looks like you haven’t uploaded any yet."
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
        onOpenChange={() => {
          setSelectedVideo(null);
        }}
      >
        {selectedVideo && (
          <DialogContent>
            <DialogHeader>
              <DashboardDialogHeader title={"Video Details"} brief={""} />
            </DialogHeader>

            <Card className="border-none bg-transparent py-0">
              <CardContent className="space-y-3 px-0">
                {new URL(selectedVideo.m3u8_key).pathname != "/null" ? (
                  <VideoPlayer
                    thumbnailUrl={selectedVideo.thumbnail_key}
                    playlistUrl={selectedVideo.m3u8_key}
                    className="h-auto w-full"
                  />
                ) : (
                  <div className="bg-card relative aspect-video h-full w-full animate-pulse rounded-lg">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <BaseLoader />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <h3 className="truncate md:text-lg">{selectedVideo.title}</h3>
              <p className="text-muted-foreground line-clamp-3 text-xs md:text-sm">
                {selectedVideo.description}
              </p>
              {selectedVideo.tags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedVideo.tags.split(",").map((tag, idx) => (
                    <Badge variant={"secondary"} key={idx}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </React.Fragment>
  );
}
