"use client";

import { useFieldArray } from "react-hook-form";
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

  return (
    <section className="space-y-6 border rounded-xl p-6 bg-muted/30">
      <h2 className="text-xl font-semibold">Food Details</h2>

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
          <div key={field.id} className="flex gap-2 items-center">
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
                value={(field.value ?? []).join(", ")}
                placeholder="Halal, Vegan, Gluten-Free"
                onChange={(e) =>
                  field.onChange(
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  )
                }
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="foodDetails.isPerishable"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-md border p-3">
            <FormLabel>Perishable Item</FormLabel>
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
