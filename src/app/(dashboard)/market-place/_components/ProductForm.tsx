"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { productSchema, productSchemaType } from "@/lib/zodValidation";
import { createProduct } from "@/actions/auth/product";
import { UploadButton } from "@/utils/uploadthing";

const ProductForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<productSchemaType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      quantity: 0,
      images: [],
    },
  });

  const handleSubmit = (values: productSchemaType) => {
    startTransition(async () => {
      try {
        const res = await createProduct(values);
        if (res?.error) setError(res.error);
        else router.push("/market-place/dashboard/seller/products");
      } catch {
        setError("Something went wrong. Please try again!");
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues("images") || [];
    currentImages.splice(index, 1);
    form.setValue("images", [...currentImages], { shouldValidate: true });
  };

  return (
    <main className="w-full bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          New Product
        </h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
            onKeyUp={() => setError("")}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter price"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 100"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>Product Images</FormLabel>
                  <FormControl>
                    <UploadButton
                      endpoint="productImages"
                      onClientUploadComplete={(res) => {
                        const newUrls = res.map((file) => file.url);
                        const allImages = [
                          ...(form.getValues("images") || []),
                          ...newUrls,
                        ];
                        form.setValue("images", allImages, {
                          shouldValidate: true,
                        });
                      }}
                      onUploadError={(error: Error) => console.error(error)}
                    />
                  </FormControl>

                  {form.getValues("images")?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {form.getValues("images")?.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700"
                        >
                          <img
                            src={url}
                            alt={`preview-${idx}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-white dark:bg-zinc-800 rounded-full p-1 shadow hover:bg-red-100 dark:hover:bg-red-800 transition"
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 rounded-lg"
            >
              {isPending ? "Adding Product..." : "Add Product"}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
};

export default ProductForm;
