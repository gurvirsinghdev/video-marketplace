"use client";

import "video.js/dist/video-js.css";
import "videojs-plyr/css/videojs-plyr.css";

import { useEffect, useRef } from "react";

import videojs from "video.js";
import { cn } from "@/lib/utils";

interface Props {
  thumbnailUrl: string;
  playlistUrl: string;
  className?: string;
}

export default function VideoPlayer(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);

  useEffect(
    function () {
      if (!videoRef.current) return;

      if (playerRef.current) {
        // playerRef.current.dispose();
        playerRef.current = null;
      }

      const player = videojs(videoRef.current, {
        controls: true,
        preload: "auto",
        responsive: true,
        fluid: true,
        poster: props.thumbnailUrl,
        sources: [
          {
            src: props.playlistUrl,
            type: "application/x-mpegURL",
          },
        ],
      });

      playerRef.current = player;
      console.log(playerRef.current);

      return () => {
        // playerRef.current?.dispose();
        playerRef.current = null;
      };
    },
    // eslint-disable-next-line
    [props.playlistUrl],
  );

  return (
    <div className={cn("w-full", "aspect-video")}>
      <video
        ref={videoRef}
        className={cn("video-js vjs-theme-plyr", props.className)}
      ></video>
    </div>
  );
}
