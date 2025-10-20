"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils";
import BaseLoader from "@/modules/base/loader";
import DashboardPageContents from "@/modules/dashboard/dashboard-page-contents";
import DashboardDialogHeader from "@/modules/dashboard/dialog-header";
import DashboardPageHeader from "@/modules/dashboard/page-header";
import PaginatedList from "@/modules/tables/paginated-list";
import { VideoThumbnail } from "@/modules/videos/video-thumbnail";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function DashboardPurchasedLicensesView() {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const listUserRequestedLicensesPaginated = useSuspenseQuery(
    trpc.license.listUserRequestedLicensesPaginated.queryOptions({ page }),
  );

  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<
    (typeof listUserRequestedLicensesPaginated.data)["requests"][number] | null
  >(null);

  const downloadMutation = useMutation(
    trpc.license.getDownloadUrlForLicense.mutationOptions({
      onMutate() {
        toast.loading("Preparing download...", { id: "download" });
      },
      onError() {
        toast.error("Failed to generate download link.", { id: "download" });
      },
      onSuccess() {
        toast.dismiss("download");
      },
    }),
  );

  if (listUserRequestedLicensesPaginated.isLoading) {
    return <BaseLoader />;
  }

  return (
    <DashboardPageContents>
      <DashboardPageHeader
        title="Approved Video Licenses"
        brief="Videos you have requested and been granted a license to access."
      />
      <Suspense fallback={<BaseLoader />}>
        <Card className="overflow-hidden py-1">
          <CardContent className="px-0">
            <PaginatedList
              currentPage={page}
              gotoPage={(nextPage) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(nextPage));
                router.push(`/dashboard/purchased-videos?${params.toString()}`);
              }}
              emptyText="No purchased or approved licenses to display."
              pageSize={listUserRequestedLicensesPaginated.data.pageSize}
              totalPages={listUserRequestedLicensesPaginated.data.pages}
              className="divide-y"
              items={listUserRequestedLicensesPaginated.data.requests}
              loading={listUserRequestedLicensesPaginated.isLoading}
              renderItem={(item) => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setSelected(item);
                        setOpen(true);
                      }}
                      className="hover:bg-muted/50 block w-full cursor-pointer p-4 text-left transition-colors"
                    >
                      <div className="flex justify-between">
                        <div className="flex w-full flex-row gap-3 sm:items-center sm:space-x-4">
                          <div className="flex-shrink-0">
                            <VideoThumbnail
                              thumbnailUrl={item.vididpro_video.thumbnail_key}
                            />
                          </div>
                          <div className="w-full min-w-0">
                            <div className="max-w-52 truncate text-sm font-medium sm:max-w-full">
                              {item.vididpro_video.title}
                            </div>
                            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1 text-sm">
                              <span className="capitalize">
                                {item.vididpro_license.license_type} License
                              </span>
                              <span>•</span>
                              <span>
                                {moment(
                                  item.vididpro_license.created_at,
                                ).fromNow()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className="capitalize"
                            variant={
                              item.vididpro_license.payment_status === "paid"
                                ? "default"
                                : item.vididpro_license.payment_status ===
                                    "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {item.vididpro_license.payment_status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to open license details.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            />
          </CardContent>
        </Card>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setSelected(null);
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-auto! sm:max-w-lg">
            <DialogHeader>
              <DashboardDialogHeader
                title={""}
                brief={selected?.vididpro_video.title!}
              />
            </DialogHeader>

            {selected?.vididpro_license ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                  <div>
                    <div className="text-muted-foreground text-xs">Type</div>
                    <div className="text-sm font-medium capitalize">
                      {selected.vididpro_license.license_type} License
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Requested
                    </div>
                    <div className="text-sm">
                      {moment(selected.vididpro_license.created_at).format(
                        "LLL",
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Payment Status
                    </div>
                    <div>
                      <Badge
                        className="capitalize"
                        variant={
                          selected?.vididpro_license.payment_status === "paid"
                            ? "default"
                            : selected?.vididpro_license.payment_status ===
                                "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {selected?.vididpro_license.payment_status}
                      </Badge>
                    </div>
                  </div>
                  {selected.vididpro_license.license_type === "custom" &&
                  selected.vididpro_license?.quote_price ? (
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Quoted Price
                      </div>
                      <div className="text-sm">
                        {formatPrice(selected.vididpro_license?.quote_price)}
                      </div>
                    </div>
                  ) : null}
                </div>

                {selected.vididpro_license.purpose ? (
                  <div>
                    <div className="text-muted-foreground text-xs">Purpose</div>
                    <div className="text-sm whitespace-pre-wrap">
                      {selected.vididpro_license.purpose}
                    </div>
                  </div>
                ) : null}

                {selected.vididpro_license.license_type === "custom" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selected.vididpro_license.usage ? (
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Usage
                        </div>
                        <div className="text-sm capitalize">
                          {selected.vididpro_license.usage}
                        </div>
                      </div>
                    ) : null}
                    {selected.vididpro_license.region ? (
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Region
                        </div>
                        <div className="text-sm capitalize">
                          {selected.vididpro_license.region}
                        </div>
                      </div>
                    ) : null}
                    {selected.vididpro_license.platforms ? (
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Platforms
                        </div>
                        <div className="text-sm">
                          {selected.vididpro_license.platforms}
                        </div>
                      </div>
                    ) : null}
                    {selected.vididpro_license.duration ? (
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Duration
                        </div>
                        <div className="text-sm">
                          {selected.vididpro_license.duration}
                        </div>
                      </div>
                    ) : null}
                    {selected.vididpro_license.budget ? (
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Budget Range
                        </div>
                        <div className="text-sm capitalize">
                          {selected.vididpro_license.budget}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {selected.vididpro_video ? (
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground mb-2 text-xs font-medium">
                      Licensed Video
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 flex-shrink-0">
                        <VideoThumbnail
                          thumbnailUrl={selected.vididpro_video.thumbnail_key}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {selected.vididpro_video.title}
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          {formatPrice(selected.vididpro_video.price!)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <Button
                className="cursor-pointer"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              {selected?.vididpro_license?.payment_status === "paid" ? (
                <Button
                  onClick={async () => {
                    if (!selected?.vididpro_license?.id) return;
                    const res = await downloadMutation.mutateAsync({
                      licenseId: selected.vididpro_license.id,
                    });
                    const a = document.createElement("a");
                    a.href = res.url;
                    const fallbackName = (
                      selected?.vididpro_video?.title || "video"
                    ).replace(/\s+/g, "-");
                    a.download = `${fallbackName}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                >
                  Download Video
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Suspense>
    </DashboardPageContents>
  );
}
