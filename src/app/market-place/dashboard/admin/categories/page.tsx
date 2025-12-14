"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  adminAddProductCategoriesAction,
  adminDeleteCategoryAction,
  adminUpdateCategoryAction,
} from "@/actions/category/categories";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";
import Image from "next/image";

type CategoryWithMedia = Category & {
  iconUrl?: string | null;
  bannerUrl?: string | null;
};

type Props = { categories: CategoryWithMedia[] };

export default function CategoryPageClient({
  categories: initialCategories,
}: Props) {
  const [categories, setCategories] =
    useState<CategoryWithMedia[]>(initialCategories);

  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<CategoryWithMedia | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [editIconUrl, setEditIconUrl] = useState<string | null>(null);
  const [editBannerUrl, setEditBannerUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [deleting, setDeleting] = useState<CategoryWithMedia | null>(null);
  const [removing, setRemoving] = useState(false);

  const formatHierarchy = (cat: CategoryWithMedia): string => {
    const path: string[] = [cat.name];
    let current: CategoryWithMedia | undefined = cat;

    while (current?.parentId) {
      const parent = categories.find((c) => c.id === current!.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }
    return path.join(" → ");
  };

  const isDisabledAsParent = (
    potential: CategoryWithMedia,
    current: CategoryWithMedia | null
  ) => {
    if (!current) return false;
    if (potential.id === current.id) return true;

    let parent: CategoryWithMedia | undefined = potential;
    const visited = new Set<string>();

    while (parent?.parentId && !visited.has(parent.parentId)) {
      visited.add(parent.parentId);
      if (parent.parentId === current.id) return true;
      parent = categories.find((c) => c.id === parent!.parentId);
    }

    return false;
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Category name is required");

    setSaving(true);
    const res = await adminAddProductCategoriesAction({ name, parentId });

    if (res?.error) {
      toast.error(res.error);
      setSaving(false);
      return;
    }

    if (res.category) {
      setCategories((prev) => [...prev, res.category as CategoryWithMedia]);
    }

    toast.success("Category added");
    setSaving(false);
    setName("");
    setParentId(null);
  };

  const handleUpdate = async () => {
    if (!editing) return;

    setUpdating(true);
    const res = await adminUpdateCategoryAction(editing.id, {
      name: editName,
      parentId: editParentId,
      iconUrl: editIconUrl,
      bannerUrl: editBannerUrl,
    } as any); // ensure your CategorySchemaType includes these fields

    if (res?.error) {
      toast.error(res.error);
      setUpdating(false);
      return;
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === editing.id
          ? {
              ...c,
              name: editName,
              parentId: editParentId,
              iconUrl: editIconUrl ?? null,
              bannerUrl: editBannerUrl ?? null,
            }
          : c
      )
    );

    toast.success("Category updated");
    setUpdating(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;

    setRemoving(true);
    const res = await adminDeleteCategoryAction(deleting.id);

    if (res?.error) {
      toast.error(res.error);
      setRemoving(false);
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== deleting.id));
    toast.success("Category deleted");
    setRemoving(false);
    setDeleting(null);
  };

  return (
    <main className="space-y-10">
      <h1 className="text-3xl font-bold">Category Management</h1>

      {/* CREATE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Create Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Category name (e.g., Electronics)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="w-full border rounded-md p-2"
            value={parentId || ""}
            onChange={(e) => setParentId(e.target.value || null)}
          >
            <option value="">Top-level category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {formatHierarchy(c)}
              </option>
            ))}
          </select>

          <Button
            onClick={handleCreate}
            disabled={saving}
            className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white font-medium rounded-lg shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Create Category"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* TABLE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Categories (Hierarchy View)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border text-left">Icon</th>
                <th className="p-3 border text-left">Category</th>
                <th className="p-3 border text-left">Hierarchy</th>
                <th className="p-3 border text-left">Banner</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  {/* Icon */}
                  <td className="p-3 border">
                    {cat.iconUrl ? (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border">
                        <Image
                          src={cat.iconUrl}
                          alt={cat.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>

                  {/* Name */}
                  <td className="p-3 border font-medium">{cat.name}</td>

                  {/* Hierarchy */}
                  <td className="p-3 border text-xs md:text-sm">
                    {formatHierarchy(cat)}
                  </td>

                  {/* Banner */}
                  <td className="p-3 border">
                    {cat.bannerUrl ? (
                      <div className="relative w-24 h-10 rounded-md overflow-hidden border">
                        <Image
                          src={cat.bannerUrl}
                          alt={`${cat.name} banner`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3 border text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                          <MoreVertical size={18} />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => {
                            setEditing(cat);
                            setEditName(cat.name);
                            setEditParentId(cat.parentId ?? null);
                            setEditIconUrl(cat.iconUrl ?? null);
                            setEditBannerUrl(cat.bannerUrl ?? null);
                          }}
                        >
                          <Pencil size={15} /> Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-600 cursor-pointer focus:text-red-700"
                          onClick={() => setDeleting(cat)}
                        >
                          <Trash2 size={15} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-gray-500 text-sm"
                  >
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* EDIT MODAL */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            {/* Parent */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Parent Category</label>
              <select
                className="w-full border rounded-md p-2"
                value={editParentId || ""}
                onChange={(e) => setEditParentId(e.target.value || null)}
              >
                <option value="">Top-level</option>
                {categories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={isDisabledAsParent(c, editing)}
                  >
                    {formatHierarchy(c)}
                  </option>
                ))}
              </select>
            </div>

            {/* ICON upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Icon</label>
              <div className="flex items-center gap-4">
                {editIconUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border">
                    <Image
                      src={editIconUrl}
                      alt="Icon preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center text-xs text-gray-400">
                    None
                  </div>
                )}

                <UploadButton
                  endpoint="categoryIcon"
                  onClientUploadComplete={(res) => {
                    const file = res?.[0];
                    if (!file) return;
                    setEditIconUrl(file.url);
                    if (editing) {
                      setCategories((prev) =>
                        prev.map((c) =>
                          c.id === editing.id ? { ...c, iconUrl: file.url } : c
                        )
                      );
                    }
                    toast.success("Icon uploaded");
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(error.message || "Icon upload failed");
                  }}
                  className="ut-button:bg-[var(--brand-blue)] ut-button:text-white ut-button:rounded-lg"
                />
              </div>
            </div>

            {/* BANNER upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Banner</label>
              {editBannerUrl ? (
                <div className="relative w-full h-24 rounded-md overflow-hidden border">
                  <Image
                    src={editBannerUrl}
                    alt="Banner preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-16 rounded-md border flex items-center justify-center text-xs text-gray-400">
                  No banner set
                </div>
              )}

              <UploadButton
                endpoint="categoryBanner"
                onClientUploadComplete={(res) => {
                  const file = res?.[0];
                  if (!file) return;
                  setEditBannerUrl(file.url);
                  if (editing) {
                    setCategories((prev) =>
                      prev.map((c) =>
                        c.id === editing.id ? { ...c, bannerUrl: file.url } : c
                      )
                    );
                  }
                  toast.success("Banner uploaded");
                }}
                onUploadError={(error: Error) => {
                  toast.error(error.message || "Banner upload failed");
                }}
                className="ut-button:bg-[var(--brand-blue)] ut-button:text-white ut-button:rounded-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="bg-[var(--brand-blue)] hover:bg-[var(--brand-blue-hover)] text-white"
            >
              {updating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>

          <p className="text-sm">
            Are you sure you want to delete <b>{deleting?.name}</b>? This cannot
            be undone.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removing ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
