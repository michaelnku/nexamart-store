import { CurrentUser } from "@/lib/currentUser";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const handleAuth = async () => {
  const user = await CurrentUser();
  if (!user) throw new UploadThingError("Unauthorized access");

  return { user };
};

export const ourFileRouter = {
  profileAvatar: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  productImages: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  storeLogo: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  storeBanner: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  heroBanner: f({
    image: {
      maxFileSize: "256KB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  categoryIcon: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  categoryBanner: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  siteLogo: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  verificationFiles: f({
    image: {
      maxFileSize: "256KB",
      maxFileCount: 6,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),

  evidenceFiles: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 6,
    },
    video: {
      maxFileSize: "16MB",
      maxFileCount: 2,
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 4,
    },
  })
    .middleware(() => handleAuth())

    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
