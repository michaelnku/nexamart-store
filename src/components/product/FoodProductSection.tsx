"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Props = {
  control: any;
};

export default function FoodProductSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "foodDetails.ingredients",
  });
  const [dietaryTagsInput, setDietaryTagsInput] = useState("");
  const dietaryTags = useWatch({
    control,
    name: "foodDetails.dietaryTags",
  });

  useEffect(() => {
    setDietaryTagsInput((dietaryTags ?? []).join(", "));
  }, [dietaryTags]);

  return (
    <section className="space-y-6 dark:bg-neutral-950">
      <div className="rounded-2xl border border-orange-200 bg-white/80 dark:bg-neutral-900 p-4 text-sm text-muted-foreground shadow-sm">
        Add a clear restaurant-style info so buyers know what to expect before
        ordering.
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FormLabel>Ingredients</FormLabel>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append("")}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Ingredient
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-2 rounded-2xl border bg-white dark:bg-neutral-900 p-3 shadow-sm"
          >
            <FormField
              control={control}
              name={`foodDetails.ingredients.${index}`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Chicken, Pepper, Olive oil"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
            >
              <Trash className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="foodDetails.preparationTimeMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preparation Time (Minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="foodDetails.portionSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Portion Size</FormLabel>
              <FormControl>
                <Input {...field} placeholder="1 person / Family size" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="foodDetails.spiceLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Spice Level</FormLabel>
            <FormControl>
              <Select
                value={field.value ?? ""}
                onValueChange={(value) =>
                  field.onChange(value === "NONE" ? undefined : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select spice level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Not specified</SelectItem>
                  <SelectItem value="MILD">Mild</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HOT">Hot</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="foodDetails.dietaryTags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dietary Tags (comma separated)</FormLabel>
            <FormControl>
              <Input
                value={dietaryTagsInput}
                placeholder="Halal, Vegan, Gluten-Free"
                onChange={(e) => {
                  const rawValue = e.target.value;
                  setDietaryTagsInput(rawValue);
                  field.onChange(
                    rawValue
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  );
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="foodDetails.isPerishable"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-2xl border bg-white dark:bg-neutral-900 p-4 shadow-sm">
            <div>
              <FormLabel>Perishable Item</FormLabel>
              <p className="text-xs text-muted-foreground">
                Mark dishes that are best consumed quickly after preparation.
              </p>
            </div>
            <FormControl>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="foodDetails.expiresAt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expiry Date (optional)</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={
                  field.value instanceof Date
                    ? field.value.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(
                    value ? new Date(`${value}T00:00:00`) : undefined,
                  );
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
}
