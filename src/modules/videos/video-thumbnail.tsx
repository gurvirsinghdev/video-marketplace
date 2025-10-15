"use client";

import React, { useEffect, useRef, useState } from "react";

import BaseLoader from "../base/loader";
import { PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoThumbnailProps {
  thumbnailUrl: string;
  sizeClassName?: string;
}

export function VideoThumbnail({
  thumbnailUrl,
  sizeClassName,
}: VideoThumbnailProps) {
  const [loaded, setLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const invalidUrl = new URL(thumbnailUrl).pathname == "/null";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (invalidUrl) return;

    // Load the image
    const img = new Image();
    img.src = thumbnailUrl;
    img.onload = () => {
      // Set canvas size to image dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0);
      setLoaded(true);
    };

    // Clean up
    return () => {
      setLoaded(false);
    };
    // eslint-disable-next-line
  }, [thumbnailUrl]);

  return (
    <div className="flex items-center space-x-4">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "bg-muted relative flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg",
            sizeClassName,
          )}
        >
          <div className="relative">
            {!invalidUrl && (
              <canvas
                ref={canvasRef}
                className={cn("h-12 w-20 object-cover", sizeClassName)}
                width={80}
                height={48}
              />
            )}
            {loaded && (
              <div className="bg-background/50 absolute -top-1 -right-1 -bottom-1 -left-1"></div>
            )}
          </div>
          <div className="absolute">
            {loaded ? (
              <div className="text-muted-foreground">
                <PlayIcon className="text-mu h-4 w-4" />
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center justify-center">
                <BaseLoader />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
