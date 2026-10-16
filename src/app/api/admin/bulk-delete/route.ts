import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi, writeAudit } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { SOFT_DELETED, type BulkDeleteResource } from "@/lib/soft-delete";
import { deleteAllProductImageFiles } from "@/lib/product-images";

const bodySchema = z.object({
  resource: z.enum([
    "orders",
    "users",
    "categories",
    "products",
    "discounts",
    "reservations",
  ]),
  mode: z.enum(["soft", "hard"]),
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = bodySchema.parse(await req.json());
  const ids = [...new Set(body.ids)];

  try {
    const result = await applyBulkDelete(body.resource, body.mode, ids, admin.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de suppression";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function applyBulkDelete(
  resource: BulkDeleteResource,
  mode: "soft" | "hard",
  ids: string[],
  adminId: string,
) {
  if (resource === "orders") {
    if (mode === "soft") {
      const r = await prisma.order.updateMany({
        where: { id: { in: ids } },
        data: { deletedStatus: SOFT_DELETED },
      });
      await writeAudit({
        userId: adminId,
        action: "orders.soft_delete",
        entity: "Order",
        meta: { ids, count: r.count },
      });
      return { count: r.count };
    }
    const r = await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await writeAudit({
      userId: adminId,
      action: "orders.hard_delete",
      entity: "Order",
      meta: { ids, count: r.count },
    });
    return { count: r.count };
  }

  if (resource === "users") {
    if (ids.includes(adminId)) {
      throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
    }
    if (mode === "soft") {
      const r = await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { deletedStatus: SOFT_DELETED, isActive: false },
      });
      await writeAudit({
        userId: adminId,
        action: "users.soft_delete",
        entity: "User",
        meta: { ids, count: r.count },
      });
      return { count: r.count };
    }
    // Detach orders, then remove user (+ cascaded sessions)
    await prisma.order.updateMany({
      where: { userId: { in: ids } },
      data: { userId: null },
    });
    await prisma.reservation.updateMany({
      where: { userId: { in: ids } },
      data: { userId: null },
    });
    const r = await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await writeAudit({
      userId: adminId,
      action: "users.hard_delete",
      entity: "User",
      meta: { ids, count: r.count },
    });
    return { count: r.count };
  }

  if (resource === "categories") {
    if (mode === "soft") {
      const r = await prisma.category.updateMany({
        where: { id: { in: ids } },
        data: { deletedStatus: SOFT_DELETED, isActive: false },
      });
      await writeAudit({
        userId: adminId,
        action: "categories.soft_delete",
        entity: "Category",
        meta: { ids, count: r.count },
      });
      return { count: r.count };
    }
    const withProducts = await prisma.product.count({
      where: { categoryId: { in: ids } },
    });
    if (withProducts > 0) {
      throw new Error(
        "Impossible de supprimer définitivement: des produits y sont encore liés. Soft-delete la catégorie, ou déplacez / hard-delete les produits d'abord.",
      );
    }
    const r = await prisma.category.deleteMany({ where: { id: { in: ids } } });
    await writeAudit({
      userId: adminId,
      action: "categories.hard_delete",
      entity: "Category",
      meta: { ids, count: r.count },
    });
    return { count: r.count };
  }

  if (resource === "products") {
    if (mode === "soft") {
      const r = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { deletedStatus: SOFT_DELETED, isAvailable: false },
      });
      await writeAudit({
        userId: adminId,
        action: "products.soft_delete",
        entity: "Product",
        meta: { ids, count: r.count },
      });
      return { count: r.count };
    }
    for (const id of ids) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true },
      });
      if (!product) continue;
      await prisma.orderItem.updateMany({
        where: { productId: id },
        data: { productId: null },
      });
      await prisma.cartItem.deleteMany({ where: { productId: id } });
      await deleteAllProductImageFiles([
        product.imageUrl,
        ...product.images.map((img) => img.url),
      ]).catch(() => undefined);
      await prisma.product.delete({ where: { id } }).catch(() => undefined);
    }
    await writeAudit({
      userId: adminId,
      action: "products.hard_delete",
      entity: "Product",
      meta: { ids, count: ids.length },
    });
    return { count: ids.length };
  }

  if (resource === "discounts") {
    if (mode === "soft") {
      const r = await prisma.discount.updateMany({
        where: { id: { in: ids } },
        data: { deletedStatus: SOFT_DELETED, isActive: false },
      });
      await writeAudit({
        userId: adminId,
        action: "discounts.soft_delete",
        entity: "Discount",
        meta: { ids, count: r.count },
      });
      return { count: r.count };
    }
    const r = await prisma.discount.deleteMany({ where: { id: { in: ids } } });
    await writeAudit({
      userId: adminId,
      action: "discounts.hard_delete",
      entity: "Discount",
      meta: { ids, count: r.count },
    });
    return { count: r.count };
  }

  // reservations
  if (mode === "soft") {
    const r = await prisma.reservation.updateMany({
      where: { id: { in: ids } },
      data: { deletedStatus: SOFT_DELETED },
    });
    await writeAudit({
      userId: adminId,
      action: "reservations.soft_delete",
      entity: "Reservation",
      meta: { ids, count: r.count },
    });
    return { count: r.count };
  }
  const r = await prisma.reservation.deleteMany({ where: { id: { in: ids } } });
  await writeAudit({
    userId: adminId,
    action: "reservations.hard_delete",
    entity: "Reservation",
    meta: { ids, count: r.count },
  });
  return { count: r.count };
}
