"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DotIcon, VideoIcon } from "lucide-react";

import DashboardPageContents from "@/modules/dashboard/dashboard-page-contents";
import DashboardPageHeader from "@/modules/dashboard/page-header";
import Link from "next/link";
import { VideoThumbnail } from "@/modules/videos/video-thumbnail";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export default function DashboardPage() {
  const trpc = useTRPC();
  const listMyVideosPaginated = useQuery(
    trpc.video.listMyVideosPaginated.queryOptions({ page: 1 }),
  );
  const getAuthenticatedUserQuery = useQuery(
    trpc.auth.getAuthenticatedUser.queryOptions(),
  );
  const getLinkedServicesQuery = useQuery(
    trpc.user.getLinkedServices.queryOptions(),
  );

  const stripeLinked = getLinkedServicesQuery.data?.find(
    (service) => service.service === "stripe" && service.active,
  );

  return (
    <DashboardPageContents>
      <DashboardPageHeader
        title="Dashboard"
        brief="Welcome Back! See what's happening with your account."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="gap-2 py-4">
          <CardHeader className="flex items-center justify-between border-b px-4 pb-4!">
            <CardTitle className="font-semibold">Recent Videos</CardTitle>
            <Link href="/dashboard/videos" className="text-sm underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="mt-2 px-4">
            {!(
              listMyVideosPaginated.data &&
              listMyVideosPaginated.data.records.length > 0
            ) ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <VideoIcon className="h-4 w-4" />
                You haven&apos;t uploaded any videos yet.
              </div>
            ) : (
              <div className="space-y-3">
                {listMyVideosPaginated.data.records.map((record, idx) => (
                  <div className="flex w-full items-center space-x-3" key={idx}>
                    <VideoThumbnail thumbnailUrl={record.thumbnail_key} />
                    <div className="w-auto">
                      <h3 className="truncate font-medium">{record.title}</h3>
                      <div className="text-muted-foreground flex flex-wrap items-center text-sm">
                        <span>{getAuthenticatedUserQuery.data?.name}</span>
                        <DotIcon />
                        <span>{moment(record.created_at).fromNow()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="flex items-center justify-between border-b px-4 pb-4!">
            <CardTitle className="font-semibold">Required Actions</CardTitle>
            {/* <CardDescription>
              Please review the necessary steps and take appropriate action to
              proceed.
            </CardDescription> */}
          </CardHeader>
          <CardContent>
            {!stripeLinked && (
              <Alert variant={"destructive"}>
                <AlertDescription className="inline">
                  Your videos are not visible on the marketplace because your
                  Stripe account is not connected. Please connect your Stripe
                  account in your{" "}
                  <Link
                    href="/dashboard/settings#integrations"
                    className="underline"
                  >
                    dashboard settings
                  </Link>{" "}
                  to enable marketplace visibility.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageContents>
  );
}
