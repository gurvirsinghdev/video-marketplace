"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Props<T> {
  items: T[];
  loading?: boolean;
  className?: string;
  emptyText?: string;
  renderItem: (item: T, idx: number) => React.ReactNode;
}

export default function PaginatedList<T>(props: Props<T>) {
  return (
    <div className={cn(props.className)}>
      {props.loading ? (
        <p className="text-muted-foreground p-6 text-sm">Loading...</p>
      ) : props.items.length === 0 ? (
        <p className="text-muted-foreground p-6 text-sm">{props.emptyText}</p>
      ) : (
        props.items.map((item, idx) => (
          <React.Fragment key={idx}>
            {props.renderItem(item, idx)}
          </React.Fragment>
        ))
      )}
    </div>
  );
}
