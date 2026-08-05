import { Skeleton } from "@/components/checkin/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-md mx-auto p-5 space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
