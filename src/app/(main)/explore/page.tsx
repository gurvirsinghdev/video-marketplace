"use client";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import VideoPlayer from "@/modules/videos/video-player";
import { formatPrice } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export default function ExplorePage() {
  const trpc = useTRPC();
  const videos = useQuery(trpc.video.listTopVideos.queryOptions());

  return (
    <section className="bg-card w-full px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl">Stock Videos</h2>
          <p className="text-muted-foreground text-sm">
            {new Intl.NumberFormat("en-US", {
              minimumIntegerDigits: 2,
              maximumFractionDigits: 0,
            }).format((videos.data || []).length)}{" "}
            videos found
          </p>
        </div>

        <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.isLoading &&
            [1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-muted h-full w-full animate-pulse border py-24 shadow-xs"
              ></div>
            ))}
          {(videos.data || []).map((video) => (
            <Card
              key={video.id}
              className="bg-secondary rounded-none border py-0"
            >
              <CardContent className="flex h-full flex-col justify-between p-0">
                <div className="flex items-center justify-center overflow-hidden bg-black">
                  <VideoPlayer
                    playlistUrl={video.m3u8_key}
                    thumbnailUrl={video.thumbnail_key}
                    className="w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div>
                    <h3 className="text-card-foreground truncate font-medium">
                      {video.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">
                      {video.description}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <Badge variant="outline" className="rounded-none py-1.5">
                      {formatPrice(video.price)}
                    </Badge>
                    <Link href={`/explore/${video.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer rounded-none shadow-none"
                      >
                        Request License
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
