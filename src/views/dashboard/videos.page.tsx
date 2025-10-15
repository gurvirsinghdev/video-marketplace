"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import DashboardPageContents from "@/modules/dashboard/dashboard-page-contents";
import DashboardPageHeader from "@/modules/dashboard/page-header";
import UploadVideoDialog from "@/modules/videos/upload-video-dialog";
import VideosPageListing from "@/modules/videos/videos-page-listing";

export default function DashboardVideosView() {
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);

  return (
    <DashboardPageContents className="space-y-4">
      <DashboardPageHeader
        title="Upload Video"
        brief="Select a video file to upload and manage."
      >
        <Button
          onClick={() => setIsUploadingVideo(true)}
          variant={"outline"}
          className="flex w-full cursor-pointer flex-row items-center justify-center"
        >
          <PlusIcon />
          <span>Upload Video</span>
        </Button>

        <UploadVideoDialog
          open={isUploadingVideo}
          setOpen={setIsUploadingVideo}
        />
      </DashboardPageHeader>

      <Suspense
        fallback={
          <main className="grid h-full w-full place-items-center">
            <Loader2Icon className="h-4 w-4 animate-spin" />
          </main>
        }
      >
        <VideosPageListing />
      </Suspense>
    </DashboardPageContents>
  );
}
