"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash } from "lucide-react";

import {
  createEmptyFoodOption,
  createEmptyFoodOptionGroup,
  createFoodSizeOptionGroup,
  isSizeOptionGroupName,
} from "@/app/marketplace/_components/productFormHelpers";
import { PriceConverter } from "@/components/currency/PriceConverter";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

type WatchedFoodOptionGroup = {
  name?: string | null;
};

const dayOptions = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

function parseCommaSeparatedList(rawValue: string) {
  return rawValue
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function FoodOptionGroupEditor({
  control,
  index,
  onRemove,
}: {
  control: any;
  index: number;
  onRemove: () => void;
}) {
  const { setValue } = useFormContext();
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `foodOptionGroups.${index}.options`,
  });

  return (
    <div className="space-y-4 rounded-[24px] border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Option Group {index + 1}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Use this for drinks, extras, or side selections.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name={`foodOptionGroups.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Choose a drink" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`foodOptionGroups.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Optional guidance for buyers"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name={`foodOptionGroups.${index}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Selection Type</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_SELECT">Single select</SelectItem>
                    <SelectItem value="MULTI_SELECT">Multi select</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <FormField
          control={control}
          name={`foodOptionGroups.${index}.isRequired`}
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div>
                <FormLabel>Required</FormLabel>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Buyer must choose.
                </p>
              </div>
              <FormControl>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`foodOptionGroups.${index}.isActive`}
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div>
                <FormLabel>Active</FormLabel>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Show to buyers.
                </p>
              </div>
              <FormControl>
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`foodOptionGroups.${index}.minSelections`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Selections</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(event) => field.onChange(Number(event.target.value || 0))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`foodOptionGroups.${index}.maxSelections`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Selections</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  placeholder="Unlimited"
                  onChange={(event) =>
                    field.onChange(event.target.value ? Number(event.target.value) : null)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Options
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Each option adds an explicit USD delta.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendOption({
                ...createEmptyFoodOption(),
                displayOrder: optionFields.length,
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Option
          </Button>
        </div>

        {optionFields.map((optionField, optionIndex) => (
          <div
            key={optionField.id}
            className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Option {optionIndex + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={optionFields.length === 1}
                onClick={() => removeOption(optionIndex)}
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={control}
                name={`foodOptionGroups.${index}.options.${optionIndex}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Coke" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`foodOptionGroups.${index}.options.${optionIndex}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="33cl canned drink"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={control}
                name={`foodOptionGroups.${index}.options.${optionIndex}.priceDeltaUSD`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Delta (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value || 0))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`foodOptionGroups.${index}.options.${optionIndex}.stock`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        placeholder="Optional"
                        onChange={(event) =>
                          field.onChange(
                            event.target.value ? Number(event.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`foodOptionGroups.${index}.options.${optionIndex}.isAvailable`}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                    <div>
                      <FormLabel>Available</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Show this option.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`foodOptionGroups.${index}.options.${optionIndex}.isDefault`}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/70">
                    <div>
                      <FormLabel>Default</FormLabel>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Preselect this option.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <PriceConverter
              onUSDChange={(usd) =>
                setValue(
                  `foodOptionGroups.${index}.options.${optionIndex}.priceDeltaUSD`,
                  usd,
                  {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  },
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FoodProductSection({ control }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "foodDetails.ingredients",
  });
  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({
    control,
    name: "foodOptionGroups",
  });
  const [dietaryTagsInput, setDietaryTagsInput] = useState("");
  const dietaryTags = useWatch({
    control,
    name: "foodDetails.dietaryTags",
  });
  const foodOptionGroups = useWatch({
    control,
    name: "foodOptionGroups",
  });
  const availableDays = useWatch({
    control,
    name: "foodConfig.availableDays",
  });
  const inventoryMode = useWatch({
    control,
    name: "foodConfig.inventoryMode",
  });
  const hasSizeGroup = ((foodOptionGroups ?? []) as WatchedFoodOptionGroup[]).some((group) =>
    isSizeOptionGroupName(group?.name),
  );

  useEffect(() => {
    setDietaryTagsInput((dietaryTags ?? []).join(", "));
  }, [dietaryTags]);

  useEffect(() => {
    if (fields.length === 0) {
      append("");
    }
  }, [append, fields.length]);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-orange-200/80 bg-white/80 p-4 text-sm text-muted-foreground shadow-sm dark:border-orange-900/50 dark:bg-zinc-950/60 dark:text-zinc-300">
        Keep menu metadata, ordering rules, and add-on pricing in one place so
        checkout stays deterministic.
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
            Food Configuration
          </h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Define how this item behaves operationally before it reaches cart
            and checkout.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="foodConfig.itemType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Type</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREPARED_MEAL">Prepared meal</SelectItem>
                      <SelectItem value="PACKAGED_FOOD">Packaged food</SelectItem>
                      <SelectItem value="FRESH_DRINK">Fresh drink</SelectItem>
                      <SelectItem value="BAKED_ITEM">Baked item</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="foodConfig.inventoryMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inventory Mode</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inventory mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABILITY_ONLY">
                        Availability only
                      </SelectItem>
                      <SelectItem value="STOCK_TRACKED">Stock tracked</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {inventoryMode === "STOCK_TRACKED"
                    ? "Use this for countable packaged items."
                    : "Use this for prepared meals and menu items that should not decrement variant stock."}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="foodConfig.preparationTimeMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preparation Time (Minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="foodConfig.dailyOrderLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Order Limit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value ?? ""}
                    placeholder="Optional"
                    onChange={(event) =>
                      field.onChange(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">
            Food Details
          </h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Keep the descriptive food metadata already used on product pages.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>Ingredients</FormLabel>
            <Button type="button" size="sm" variant="outline" onClick={() => append("")}>
              <Plus className="mr-1 h-4 w-4" />
              Add Ingredient
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-2 rounded-2xl border border-orange-100/80 bg-white p-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70"
            >
              <FormField
                control={control}
                name={`foodDetails.ingredients.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="e.g. Chicken, Pepper, Olive oil" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash className="h-4 w-4 text-red-500" />
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
                <FormLabel>Display Prep Time (Minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(event) => field.onChange(Number(event.target.value || 0))}
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
                  onChange={(event) => {
                    setDietaryTagsInput(event.target.value);
                  }}
                  onBlur={() => {
                    const normalizedTags = parseCommaSeparatedList(dietaryTagsInput);
                    setDietaryTagsInput(normalizedTags.join(", "));
                    field.onChange(normalizedTags);
                    field.onBlur();
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="foodDetails.isPerishable"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-2xl border border-orange-100/80 bg-white p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
                <div>
                  <FormLabel>Perishable Item</FormLabel>
                  <p className="text-xs text-muted-foreground dark:text-zinc-400">
                    Mark dishes that are best consumed quickly after preparation.
                  </p>
                </div>
                <FormControl>
                  <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
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
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value ? new Date(`${value}T00:00:00`) : undefined);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">
              Add-On Groups and Drink Pricing
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Create auditable option groups that add explicit USD deltas to the
              base item price.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={hasSizeGroup}
              onClick={() =>
                appendGroup({
                  ...createFoodSizeOptionGroup(),
                  displayOrder: groupFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {hasSizeGroup ? "Size Variant Added" : "Add Size Variant"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendGroup({
                  ...createEmptyFoodOptionGroup(),
                  displayOrder: groupFields.length,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          </div>
        </div>

        {groupFields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
            No food add-on groups yet. Add a size chooser, drink selector,
            extras, or protein upsell when needed.
          </div>
        ) : null}

        <div className="space-y-4">
          {groupFields.map((groupField, index) => (
            <FoodOptionGroupEditor
              key={groupField.id}
              control={control}
              index={index}
              onRemove={() => removeGroup(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
