"use client";

import { AppRouter } from "@/trpc/routers/_app";
import { Checkbox } from "@/components/ui/checkbox";
import { DotIcon } from "lucide-react";
import { VideoThumbnail } from "./video-thumbnail";
import { inferProcedureOutput } from "@trpc/server";
import moment from "moment";

interface Props {
  video: inferProcedureOutput<
    AppRouter["video"]["listMyVideosPaginated"]
  >[number];
  author: string;
}

export default function VideoItem(props: Props) {
  return (
    <div className="hover:bg-muted/50 inline-block w-full cursor-pointer p-4 transition-colors">
      <div className="flex flex-row items-center gap-3 sm:space-x-4">
        {/* <Checkbox /> */}
        <div className="flex-shrink-0">
          <VideoThumbnail thumbnailUrl={props.video.thumbnail_key} />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{props.video.title}</h3>
          <div className="text-muted-foreground flex flex-wrap items-center text-sm">
            <span>{props.author}</span>
            <DotIcon />
            <span>{moment(props.video.created_at).fromNow()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
