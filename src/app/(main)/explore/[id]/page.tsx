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
              {/* Video Player */}
              <div className="bg-foreground relative w-auto dark:bg-black">
                <VideoPlayer
                  className="h-full max-h-[55vh] w-full object-contain"
                  playlistUrl={dbVideo.m3u8_key}
                  thumbnailUrl={dbVideo.thumbnail_key}
                />
              </div>

              {/* Title and Meta */}
              <div className="space-y-2 px-6 pt-4">
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
          <Card className="bg-secondary border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <h2 className="text-sm font-semibold">Live Chat</h2>
                <span className="text-muted-foreground text-xs">15,986 people</span>
              </div>
              <Separator />
              <div className="h-[420px] space-y-4 overflow-y-auto px-4 py-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 flex-none rounded-full bg-primary/20" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Wijaya Abadi</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-muted-foreground text-sm">Duis aute irure dolor in reprehenderit velit esse cillum.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 flex-none rounded-full bg-primary/20" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Johny Wise</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    </div>
                    <p className="text-muted-foreground text-sm">Tempor incididunt ut labore et dolore magna aliqua.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 flex-none rounded-full bg-primary/20" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Budi Hakim</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-muted-foreground text-sm">Velit esse cillum dolore eu fugiat nulla pariatur.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 flex-none rounded-full bg-primary/20" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Thomas Hope</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-muted-foreground text-sm">Excepteur sint occaecat cupidatat non proident.</p>
                  </div>
                </div>
              </div>
              <Separator />
              <form className="flex items-center gap-2 px-4 py-3">
                <input
                  type="text"
                  placeholder="Write your message"
                  className="bg-background text-foreground w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-3 text-sm"
                >
                  Send
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
