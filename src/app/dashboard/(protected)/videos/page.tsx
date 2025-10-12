"use client";

import { Button } from "@/components/ui/button";
import DashboardPageContents from "@/modules/dashboard/dashboard-page-contents";
import DashboardPageHeader from "@/modules/dashboard/page-header";
import { PlusIcon } from "lucide-react";
import UploadVideoDialog from "@/modules/videos/upload-video-dialog";
import { useState } from "react";

export default function DashboardVideosPage() {
  const [isUploadingVidoe, setIsUploadingVideo] = useState<boolean>(false);

  return (
    <DashboardPageContents>
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
          open={isUploadingVidoe}
          setOpen={setIsUploadingVideo}
        />
      </DashboardPageHeader>
    </DashboardPageContents>
  );
}
