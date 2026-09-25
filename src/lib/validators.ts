import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  addonIds: z.array(z.string()).default([]),
  cartItemId: z.string().optional(), // when updating existing
});

export const updateCartItemQtySchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const removeCartItemSchema = z.object({
  cartItemId: z.string().min(1),
});

export const checkoutSchema = z.object({
  orderType: z.enum(["TAKEAWAY", "DELIVERY", "DINE_IN"]),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().min(8, "Téléphone requis"),
  notes: z.string().max(500).optional(),
  deliveryStreet: z.string().optional(),
  deliveryComplement: z.string().optional(),
  deliveryPostalCode: z
    .string()
    .regex(/^\d{5}$/, "Code postal français invalide")
    .optional(),
  deliveryCity: z.string().optional(),
  deliveryNotes: z.string().max(500).optional(),
  discountCode: z.string().optional(),
  idempotencyKey: z.string().min(8).max(64),
});
