import { Router } from "express";
import { db } from "@workspace/db";
import { poolsTable, linksTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreatePoolBody,
  UpdatePoolParams,
  UpdatePoolBody,
  DeletePoolParams,
  GetPoolParams,
  ListPoolLinksParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/pools", async (req, res) => {
  const pools = await db
    .select({
      id: poolsTable.id,
      name: poolsTable.name,
      description: poolsTable.description,
      color: poolsTable.color,
      createdAt: poolsTable.createdAt,
      linkCount: sql<number>`count(${linksTable.id})::int`,
      totalClicks: sql<number>`coalesce(sum(${linksTable.clicks}), 0)::int`,
    })
    .from(poolsTable)
    .leftJoin(linksTable, eq(linksTable.poolId, poolsTable.id))
    .groupBy(poolsTable.id)
    .orderBy(poolsTable.createdAt);

  res.json(pools);
});

router.post("/pools", async (req, res) => {
  const parsed = CreatePoolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [pool] = await db.insert(poolsTable).values(parsed.data).returning();
  res.status(201).json({ ...pool, linkCount: 0, totalClicks: 0 });
});

router.get("/pools/:id", async (req, res) => {
  const parsed = GetPoolParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [pool] = await db
    .select({
      id: poolsTable.id,
      name: poolsTable.name,
      description: poolsTable.description,
      color: poolsTable.color,
      createdAt: poolsTable.createdAt,
      linkCount: sql<number>`count(${linksTable.id})::int`,
      totalClicks: sql<number>`coalesce(sum(${linksTable.clicks}), 0)::int`,
    })
    .from(poolsTable)
    .leftJoin(linksTable, eq(linksTable.poolId, poolsTable.id))
    .where(eq(poolsTable.id, parsed.data.id))
    .groupBy(poolsTable.id);

  if (!pool) {
    res.status(404).json({ error: "Pool not found" });
    return;
  }
  res.json(pool);
});

router.patch("/pools/:id", async (req, res) => {
  const paramsParsed = UpdatePoolParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdatePoolBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid input", details: bodyParsed.error.issues });
    return;
  }
  const [updated] = await db
    .update(poolsTable)
    .set(bodyParsed.data)
    .where(eq(poolsTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Pool not found" });
    return;
  }
  res.json({ ...updated, linkCount: 0, totalClicks: 0 });
});

router.delete("/pools/:id", async (req, res) => {
  const parsed = DeletePoolParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(poolsTable).where(eq(poolsTable.id, parsed.data.id));
  res.status(204).send();
});

router.get("/pools/:id/links", async (req, res) => {
  const parsed = ListPoolLinksParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const links = await db
    .select({
      id: linksTable.id,
      title: linksTable.title,
      url: linksTable.url,
      description: linksTable.description,
      poolId: linksTable.poolId,
      poolName: poolsTable.name,
      poolColor: poolsTable.color,
      clicks: linksTable.clicks,
      isActive: linksTable.isActive,
      createdAt: linksTable.createdAt,
    })
    .from(linksTable)
    .leftJoin(poolsTable, eq(poolsTable.id, linksTable.poolId))
    .where(eq(linksTable.poolId, parsed.data.id))
    .orderBy(linksTable.createdAt);

  res.json(links);
});

export default router;
