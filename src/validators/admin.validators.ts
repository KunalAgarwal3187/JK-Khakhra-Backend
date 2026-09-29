import { z } from "zod";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers, and hyphens only"
  );

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: slugSchema,
  image: z.string().trim().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  name: z.string().trim().min(1).max(200).optional(),
  slug: slugSchema.optional(),
});

export const categoryStatusSchema = z.object({
  isActive: z.boolean(),
});

export const reorderCategoriesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        displayOrder: z.number().int(),
      })
    )
    .min(1, "At least one item is required"),
});

const nutritionItemSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: slugSchema,
  categoryId: z.number().int().positive("Category is required"),
  shortDescription: z.string().trim().nullable().optional(),
  tagline: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  image: z.string().trim().nullable().optional(),
  ingredients: z.string().trim().nullable().optional(),
  weight: z.string().trim().nullable().optional(),
  foodType: z.string().trim().nullable().optional(),
  shelfLife: z.string().trim().nullable().optional(),
  benefits: z.array(z.string().trim().min(1)).nullable().optional(),
  nutrition: z.array(nutritionItemSchema).nullable().optional(),
  price: z.number().nonnegative("Price must be ≥ 0"),
  stock: z.number().int().nonnegative("Stock must be ≥ 0").optional().default(100),
  isBestSeller: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export const updateProductSchema = createProductSchema.partial().extend({
  name: z.string().trim().min(1).max(200).optional(),
  slug: slugSchema.optional(),
  categoryId: z.number().int().positive().optional(),
  price: z.number().nonnegative("Price must be ≥ 0").optional(),
  stock: z.number().int().nonnegative("Stock must be ≥ 0").optional(),
});

export const productStatusSchema = z.object({
  isActive: z.boolean(),
});

export const productBestSellerSchema = z.object({
  isBestSeller: z.boolean(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
