import Link from "next/link";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DisputeEvidenceDTO } from "@/lib/types";

type Props = {
  evidence: DisputeEvidenceDTO[];
  emptyMessage?: string;
};

export default function DisputeEvidenceGallery({
  evidence,
  emptyMessage = "No evidence has been attached to this dispute.",
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evidence</CardTitle>
      </CardHeader>

      <CardContent>
        {evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {evidence.map((item) => (
              <Link
                key={item.id}
                href={item.fileUrl}
                target="_blank"
                className="group overflow-hidden rounded-lg border"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={item.fileUrl}
                    alt={item.type}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                  />
                </div>
                <div className="space-y-1 p-3 text-sm">
                  <p className="font-medium">{item.type.replaceAll("_", " ")}</p>
                  <p className="text-muted-foreground">
                    {item.uploadedByName ?? "Uploaded evidence"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
