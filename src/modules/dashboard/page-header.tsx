interface Props {
  title: string;
  brief: string;
  children?: React.ReactNode;
}

export default function DashboardPageHeader(props: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{props.title}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {props.brief}
        </p>
      </div>
      <div className="flex w-full sm:w-auto">{props.children}</div>
    </div>
  );
}
