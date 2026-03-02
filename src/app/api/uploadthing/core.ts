import { CurrentUser } from "@/lib/currentUser";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import sharp from "sharp";
import { getPlaiceholder } from "plaiceholder";

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
      // Fetch file buffer
      const response = await fetch(file.ufsUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Resize + Convert to WebP
      const resized = await sharp(buffer)
        .resize(1600) // max width
        .webp({ quality: 80 })
        .toBuffer();

      // Generate blur
      const { base64 } = await getPlaiceholder(resized);

      console.log("Upload complete for userId:", metadata.user.id);

      console.log("file url", file.ufsUrl);

      return {
        uploadedBy: metadata.user.id,
        url: file.url,
        key: file.key,
        width: 1600,
        height: null,
        blurDataURL: base64,
      };
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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
