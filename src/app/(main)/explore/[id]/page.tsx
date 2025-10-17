import { Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import VideoPlayer from "@/modules/videos/video-player";
import { caller } from "@/trpc/server";
import moment from "moment";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VideoListingPage({ params }: Props) {
  const { id } = await params;
  const dbVideo = await caller.video.getVideoById({ id });

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Video Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="bg-secondary overflow-hidden border py-0">
            <CardContent className="space-y-4 p-0">
              {/* Title and Meta */}
              <div className="space-y-2 px-6 pt-6">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {dbVideo.title}
                </h1>
                <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <User className="text-muted-foreground h-4 w-4" />
                    {/* TODO: Replace with user's name */}
                    {dbVideo.user_email}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    {moment(dbVideo.created_at).format("MMM DD, YYYY")}
                  </span>
                </div>
              </div>

              {/* Video Player */}
              <div className="bg-foreground relative w-auto dark:bg-black">
                <VideoPlayer
                  className="h-full max-h-[55vh] w-full object-contain"
                  playlistUrl={dbVideo.m3u8_key}
                  thumbnailUrl={dbVideo.thumbnail_key}
                />
              </div>

              <Separator className="mx-6" />

              {/* Description */}
              <div className="space-y-2 px-6 pb-6">
                <div className="text-sm font-medium">Description</div>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {dbVideo.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request License Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* <RequestLicenseForm
        videoId={videoId}
        price={video.video.price}
        userEmail={session?.user?.email}
        userName={session?.user?.name}
      /> */}
        </div>
      </div>
    </main>
  );
}
