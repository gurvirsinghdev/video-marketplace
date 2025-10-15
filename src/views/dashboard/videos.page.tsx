"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Suspense, useState } from "react";

import BaseLoader from "@/modules/base/loader";
import { Button } from "@/components/ui/button";
import DashboardPageContents from "@/modules/dashboard/dashboard-page-contents";
import DashboardPageHeader from "@/modules/dashboard/page-header";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import UploadVideoDialog from "@/modules/videos/upload-video-dialog";
import VideosPageListing from "@/modules/videos/videos-page-listing";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export default function DashboardVideosView() {
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const trpc = useTRPC();
  const getLinkedServicesQuery = useQuery(
    trpc.user.getLinkedServices.queryOptions(),
  );
  const stripeEnabled = getLinkedServicesQuery.data?.find(
    (service) => service.service === "stripe" && service.active,
  );

  return (
    <DashboardPageContents className="space-y-4">
      <DashboardPageHeader
        title="Videos"
        brief="View and manage your video listings."
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

      {!stripeEnabled && (
        <Alert variant={"destructive"}>
          <AlertTitle>Action Required!</AlertTitle>
          <AlertDescription className="inline">
            Your videos are not visible on the marketplace because your Stripe
            account is not connected. Please connect your Stripe account in your{" "}
            <Link href="/dashboard/settings#integrations" className="underline">
              dashboard settings
            </Link>{" "}
            to enable marketplace visibility.
          </AlertDescription>
        </Alert>
      )}
      <Suspense
        fallback={
          <main className="grid h-full w-full place-items-center">
            <BaseLoader />
          </main>
        }
      >
        <VideosPageListing />
      </Suspense>
    </DashboardPageContents>
  );
}
