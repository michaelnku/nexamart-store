import Link from "next/link";
import Image from "next/image";
import { FileText, ShieldAlert, Video } from "lucide-react";

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
  const isRenderableImage = (mimeType?: string | null, fileUrl?: string) =>
    mimeType?.startsWith("image/") ||
    Boolean(fileUrl?.match(/\.(png|jpe?g|webp|gif|heic|heif)$/i));

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
                  {isRenderableImage(item.mimeType, item.fileUrl) ? (
                    <Image
                      src={item.fileUrl}
                      alt={item.fileName ?? item.type}
                      fill
                      className="object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {item.mimeType?.startsWith("video/") ? (
                        <Video className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {(item.deliveryKind ?? item.type).replaceAll("_", " ")}
                    </p>
                    {item.isInternal ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                        <ShieldAlert className="h-3 w-3" />
                        Internal
                      </span>
                    ) : null}
                  </div>
                  {item.caption ? (
                    <p className="line-clamp-2 text-muted-foreground">
                      {item.caption}
                    </p>
                  ) : null}
                  {item.fileName ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.fileName}
                    </p>
                  ) : null}
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
