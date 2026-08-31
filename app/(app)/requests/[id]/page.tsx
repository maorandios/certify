"use client";

import { useParams } from "next/navigation";
import { RequestDetails } from "@/components/requests/RequestDetails";

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-3">
      <RequestDetails requestId={params.id} />
    </div>
  );
}
