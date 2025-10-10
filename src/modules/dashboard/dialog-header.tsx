import { DialogDescription, DialogTitle } from "@/components/ui/dialog";

import React from "react";

interface Props {
  title: string;
  brief: string;
}

export default function DashboardDialogHeader(props: Props) {
  return (
    <React.Fragment>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogDescription>{props.brief}</DialogDescription>
    </React.Fragment>
  );
}
