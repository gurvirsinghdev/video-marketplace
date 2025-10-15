"use client";

// import "plyr-react/plyr.css";

import "plyr/plyr.scss";

import { useEffect, useRef } from "react";

import Hls from "hls.js";
import Plyr from "plyr";
import { cn } from "@/lib/utils";

interface Props {
  thumbnailUrl: string;
  playlistUrl: string;
  className?: string;
}

export default function VideoPlayer(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(
    function () {
      if (!videoRef.current) return;
      new Plyr(videoRef.current!, {
        controls: ["play", "progress", "current-time"],
      });

      if (Hls.isSupported()) {
        const hls = new Hls();
        console.log(props.playlistUrl);
        hls.loadSource(props.playlistUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current!.poster = props.thumbnailUrl;
          console.log(videoRef.current);
        });

        return () => hls.destroy();
      }
    },
    // eslint-disable-next-line
    [props.playlistUrl],
  );

  return (
    <video
      ref={videoRef}
      controls
      className={cn("aspect-video", props.className)}
    ></video>
  );
}
