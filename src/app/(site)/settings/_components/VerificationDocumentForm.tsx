"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Trash } from "lucide-react";
import { toast } from "sonner";

import { uploadVerificationDocument } from "@/actions/verification/uploadVerificationDocument";
import { deleteFileAction } from "@/actions/actions";
import DocumentScanner from "@/components/verification/DocumentScanner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VerificationDocumentInput,
  verificationDocumentSchema,
} from "@/lib/zodValidation";
import { UploadButton, uploadFiles } from "@/utils/uploadthing";

const MAX_FILES = 6;

type UploadedFile = VerificationDocumentInput["files"][number];

export default function VerificationDocumentForm() {
  const [pending, startTransition] = useTransition();
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const [showScanner, setShowScanner] = useState(false);
  const [uploadingCameraCapture, setUploadingCameraCapture] = useState(false);

  const form = useForm<VerificationDocumentInput>({
    resolver: zodResolver(verificationDocumentSchema),
    defaultValues: {
      type: "NATIONAL_ID",
      files: [],
    },
  });

  const { control, getValues, handleSubmit, setValue } = form;
  const files = form.watch("files");

  const appendFiles = (nextFiles: UploadedFile[]) => {
    const existing = getValues("files");
    const remainingSlots = Math.max(0, MAX_FILES - existing.length);
    const merged = [...existing, ...nextFiles.slice(0, remainingSlots)];

    setValue("files", merged, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = (values: VerificationDocumentInput) => {
    startTransition(async () => {
      const result = await uploadVerificationDocument(values);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Documents uploaded successfully");
      form.reset({
        type: values.type,
        files: [],
      });
      setShowScanner(false);
    });
  };

  const deleteSingleFile = async (key: string) => {
    if (deletingKeys.has(key)) {
      return;
    }

    setDeletingKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });

    try {
      await deleteFileAction(key);

      const updatedFiles = getValues("files").filter((file) => file.key !== key);

      setValue("files", updatedFiles, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeletingKeys((current) => {
        const next = new Set(current);
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

    setUploadingCameraCapture(true);

    try {
      const file = new File([blob], `verification-${Date.now()}.jpg`, {
        type: blob.type || "image/jpeg",
      });

      const result = await uploadFiles("verificationFiles", {
        files: [file],
      });

      const uploadedFiles: UploadedFile[] = result.map((item) => ({
        url: item.url,
        key: item.key,
      }));

      appendFiles(uploadedFiles);
      setShowScanner(false);
      toast.success("Document captured and uploaded");
    } catch {
      toast.error("Failed to upload captured document");
      throw new Error("Failed to upload captured document.");
    } finally {
      setUploadingCameraCapture(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-xl font-semibold">Upload Verification Documents</h2>

      {showScanner ? (
        <div className="space-y-4 rounded-lg border p-4">
          <DocumentScanner
            disabled={uploadingCameraCapture}
            onCapture={handleCameraCapture}
            onCancel={() => {
              if (!uploadingCameraCapture) {
                setShowScanner(false);
              }
            }}
          />

          <Button
            type="button"
            variant="outline"
            disabled={uploadingCameraCapture}
            onClick={() => setShowScanner(false)}
          >
            {uploadingCameraCapture ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading capture...
              </>
            ) : (
              "Close Camera"
            )}
          </Button>
        </div>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 rounded-lg p-6 shadow-md"
        >
          <FormField
            control={control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>

                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={pending || uploadingCameraCapture}
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

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Upload Documents</h2>
              <p className="text-sm text-muted-foreground">
                Make sure each document is clear and readable.
              </p>
            </div>

            {files.length < MAX_FILES ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || uploadingCameraCapture}
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>

                <UploadButton
                  endpoint="verificationFiles"
                  onClientUploadComplete={(result) => {
                    const uploadedFiles: UploadedFile[] = result.map((file) => ({
                      url: file.url,
                      key: file.key,
                    }));

                    appendFiles(uploadedFiles);
                    toast.success("Document uploaded");
                  }}
                  onUploadError={() => {
                    toast.error("Failed to upload document");
                  }}
                  className="ut-button:rounded-md ut-button:border ut-button:border-border ut-button:bg-muted ut-button:px-4 ut-button:py-2 ut-button:text-sm ut-button:text-foreground hover:ut-button:bg-muted/70"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Maximum of {MAX_FILES} documents reached.
              </p>
            )}

            <div className="flex flex-wrap gap-4">
              {files.map((file) => (
                <div key={file.key} className="relative h-32 w-32 overflow-hidden rounded-lg border">
                  <Image
                    src={file.url}
                    alt="verification document"
                    fill
                    className="object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => deleteSingleFile(file.key)}
                    disabled={deletingKeys.has(file.key)}
                    className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white"
                  >
                    {deletingKeys.has(file.key) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <Button
            type="submit"
            disabled={pending || uploadingCameraCapture || files.length === 0}
          >
            {pending ? "Uploading..." : "Submit Documents"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
