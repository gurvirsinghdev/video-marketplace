"use client";

import React, { useEffect, useRef, useState } from "react";

import { Loader2Icon } from "lucide-react";
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
          <canvas
            ref={canvasRef}
            className={cn(
              "absolute inset-0 h-12 w-20 object-cover",
              sizeClassName,
            )}
            width={80}
            height={48}
          />
          {loaded ? (
            <div className="text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center justify-center">
              <Loader2Icon className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
