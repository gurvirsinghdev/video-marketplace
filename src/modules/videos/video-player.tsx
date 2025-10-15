"use client";

import "plyr-react/plyr.css";

import { useEffect, useRef } from "react";

import Hls from "hls.js";
import Plyr from "plyr-react";

interface Props {
  thumbnailUrl: string;
  playlistUrl: string;
}

export default function VideoPlayer(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(
    function () {
      if (videoRef.current && Hls.isSupported()) {
        const hls = new Hls();
        console.log(props.playlistUrl);
        hls.loadSource(props.playlistUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("parsed");
          videoRef.current!.poster = props.thumbnailUrl;
        });

        return () => hls.destroy();
      }
    },
    // eslint-disable-next-line
    [props.playlistUrl],
  );

  return <video ref={videoRef} controls className="aspect-video"></video>;
}
