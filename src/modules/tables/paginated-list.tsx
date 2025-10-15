"use client";

import React, { Dispatch, SetStateAction, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { EllipsisIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props<T> {
  items: T[];
  pageSize: number;
  totalPages: number;
  currentPage: number;
  loading?: boolean;
  className?: string;
  emptyText?: string;
  gotoPage: (page: number) => void;
  renderItem: (item: T, idx: number) => React.ReactNode;
}

export default function PaginatedList<T>({
  emptyText = "No records found",
  ...props
}: Props<T>) {
  const getRange = (): React.ReactNode[] => {
    const maxVisbleRange = 5;
    const range: (number | string | React.ReactNode)[] = [];

    if (props.totalPages <= maxVisbleRange) {
      for (let i = 1; i <= props.totalPages; i++) {
        range.push(i);
      }
    } else if (props.currentPage <= 2) {
      range.push(1, 2, 3, <EllipsisIcon />, props.totalPages);
    } else if (props.currentPage + 1 >= props.totalPages) {
      range.push(
        1,
        <EllipsisIcon />,
        props.totalPages - 2,
        props.totalPages - 1,
        props.totalPages,
      );
    } else {
      range.push(
        1,
        <EllipsisIcon />,
        props.currentPage - 1,
        props.currentPage,
        props.currentPage + 1,
        <EllipsisIcon />,
        props.totalPages,
      );
    }

    return range.map((i, idx) =>
      typeof i === "number" ? (
        <Button
          key={idx}
          variant={"outline"}
          onClick={() => props.gotoPage(i)}
          size="sm"
          className={cn(
            props.currentPage === i &&
              "bg-primary text-foreground hover:bg-primary/90",
          )}
        >
          {i}
        </Button>
      ) : (
        <div key={idx} className="text-muted-foreground px-2">
          {i}
        </div>
      ),
    );
  };

  return (
    <div className={cn(props.className)}>
      {props.loading ? (
        <p className="text-muted-foreground p-6 text-sm">Loading...</p>
      ) : props.items.length === 0 ? (
        <p className="text-muted-foreground p-6 text-sm">{emptyText}</p>
      ) : (
        props.items.map((item, idx) => (
          <React.Fragment key={idx}>
            {props.renderItem(item, idx)}
          </React.Fragment>
        ))
      )}

      {props.totalPages > 1 && (
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-foreground-muted text-sm">
            Page {props.currentPage} of {props.totalPages}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={"outline"}
              size={"sm"}
              disabled={props.currentPage <= 1}
              onClick={() => props.gotoPage(props.currentPage - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {getRange().map((item) => item)}
            </div>
            <Button
              size={"sm"}
              variant={"outline"}
              disabled={props.currentPage >= props.totalPages}
              onClick={() => props.gotoPage(props.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
