"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { uploadVerificationDocument } from "@/actions/verification/uploadVerificationDocument";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import Image from "next/image";

import {
  VerificationDocumentInput,
  verificationDocumentSchema,
} from "@/lib/zodValidation";

import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import { Loader2, Trash, Camera } from "lucide-react";
import { deleteFileAction } from "@/actions/actions";
import DocumentScanner from "@/components/verification/DocumentScanner";

const MAX_FILES = 6;

export default function VerificationDocumentForm() {
  const [pending, startTransition] = useTransition();
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const [showScanner, setShowScanner] = useState(false);

  const form = useForm<VerificationDocumentInput>({
    resolver: zodResolver(verificationDocumentSchema),
    defaultValues: {
      type: "NATIONAL_ID",
      files: [],
    },
  });

  const { control, handleSubmit, setValue, getValues } = form;

  const files = form.watch("files");

  const onSubmit = (values: VerificationDocumentInput) => {
    startTransition(async () => {
      const result = await uploadVerificationDocument(values);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Documents uploaded successfully");
      form.reset();
    });
  };

  const deleteSingleFile = async (key: string) => {
    if (deletingKeys.has(key)) return;

    setDeletingKeys((p) => new Set(p).add(key));

    try {
      await deleteFileAction(key);

      const updated = getValues("files").filter((f) => f.key !== key);
      setValue("files", updated);

      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeletingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleCameraCapture = async (blob: Blob) => {
    if (files.length >= MAX_FILES) {
      toast.error(`Maximum of ${MAX_FILES} documents reached`);
      return;
    }

    const file = new File([blob], "document.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("/api/uploadthing", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const uploaded = {
        url: data.url ?? data[0]?.url,
        key: data.key ?? data[0]?.key,
      };

      const existing = getValues("files");

      setValue("files", [...existing, uploaded]);

      toast.success("Document captured and uploaded");

      setShowScanner(false);
    } catch {
      toast.error("Failed to upload photo");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Upload Verification Documents</h2>

      {/* Scanner Overlay */}

      {showScanner && (
        <div className="border rounded-lg p-4 space-y-4">
          <DocumentScanner onCapture={handleCameraCapture} />

          <Button
            variant="outline"
            type="button"
            onClick={() => setShowScanner(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 rounded-lg shadow-md p-6"
        >
          {/* Document Type */}

          <FormField
            control={control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>

                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="DRIVER_LICENSE">
                      Driver License
                    </SelectItem>
                    <SelectItem value="BUSINESS_LICENSE">
                      Business License
                    </SelectItem>
                    <SelectItem value="VEHICLE_REGISTRATION">
                      Vehicle Registration
                    </SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload Section */}

          <section className="space-y-4">
            <span>
              <h2 className="font-semibold text-xl">Upload Documents</h2>

              <p className="text-sm text-muted-foreground">
                Make sure the document is clear and readable.
              </p>
            </span>

            {files.length < MAX_FILES && (
              <div className="flex gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="
                    ut-button:bg-muted
                    ut-button:text-foreground
                    ut-button:border
                    ut-button:border-border
                    ut-button:rounded-md
                    ut-button:px-4
                    ut-button:py-2
                    ut-button:text-sm
                    hover:ut-button:bg-muted/70
                  "
                >
                  <Camera className="mr-2 h-4 w-4" /> Take Photo
                </Button>

                <UploadButton
                  endpoint="verificationFiles"
                  className="
                  ut-button:bg-muted
                  ut-button:text-foreground
                  ut-button:border
                  ut-button:border-border
                  ut-button:rounded-md
                  ut-button:px-4
                  ut-button:py-2
                  ut-button:text-sm
                  hover:ut-button:bg-muted/70
                "
                  onClientUploadComplete={(res) => {
                    const uploaded = res.map((file) => ({
                      url: file.url,
                      key: file.key,
                    }));

                    const existing = getValues("files");

                    setValue("files", [...existing, ...uploaded]);

                    toast.success("Document uploaded");
                  }}
                />
              </div>
            )}

            {files.length >= MAX_FILES && (
              <p className="text-sm text-muted-foreground">
                Maximum of {MAX_FILES} documents reached.
              </p>
            )}

            {/* Preview */}

            <div className="flex flex-wrap gap-4">
              {files.map((file) => (
                <div key={file.key} className="relative w-32 h-32">
                  <Image
                    src={file.url}
                    alt="verification"
                    fill
                    className="object-cover rounded-lg"
                  />

                  <button
                    type="button"
                    onClick={() => deleteSingleFile(file.key)}
                    disabled={deletingKeys.has(file.key)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"
                  >
                    {deletingKeys.has(file.key) ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Trash className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <Button type="submit" disabled={pending || files.length === 0}>
            {pending ? "Uploading..." : "Submit Documents"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
