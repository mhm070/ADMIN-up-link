import { Router } from "express";
import { db } from "@workspace/db";
import { linksTable, poolsTable } from "@workspace/db";
import { eq, sql, ilike, or, desc, asc } from "drizzle-orm";
import {
  CreateLinkBody,
  UpdateLinkParams,
  UpdateLinkBody,
  DeleteLinkParams,
  GetLinkParams,
  ListLinksQueryParams,
  RecordLinkClickParams,
} from "@workspace/api-zod";

const router = Router();

const withPool = () =>
  db
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
    .leftJoin(poolsTable, eq(poolsTable.id, linksTable.poolId));

router.get("/links", async (req, res) => {
  const parsed = ListLinksQueryParams.safeParse({
    poolId: req.query.poolId ? Number(req.query.poolId) : undefined,
    search: req.query.search,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  let query = withPool();

  const conditions: ReturnType<typeof eq>[] = [];
  if (parsed.data.poolId != null) {
    conditions.push(eq(linksTable.poolId, parsed.data.poolId));
  }
  if (parsed.data.search) {
    conditions.push(
      or(
        ilike(linksTable.title, `%${parsed.data.search}%`),
        ilike(linksTable.url, `%${parsed.data.search}%`),
      ) as ReturnType<typeof eq>,
    );
  }

  const links = await (conditions.length > 0
    ? query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
    : query
  ).orderBy(desc(linksTable.createdAt));

  res.json(links);
});

router.post("/links", async (req, res) => {
  const parsed = CreateLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const [link] = await db.insert(linksTable).values({
    ...parsed.data,
    isActive: parsed.data.isActive ?? true,
  }).returning();

  const [withPoolData] = await withPool().where(eq(linksTable.id, link.id));
  res.status(201).json(withPoolData);
});

router.get("/links/:id", async (req, res) => {
  const parsed = GetLinkParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [link] = await withPool().where(eq(linksTable.id, parsed.data.id));
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  res.json(link);
});

router.patch("/links/:id", async (req, res) => {
  const paramsParsed = UpdateLinkParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateLinkBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid input", details: bodyParsed.error.issues });
    return;
  }
  await db
    .update(linksTable)
    .set(bodyParsed.data)
    .where(eq(linksTable.id, paramsParsed.data.id));

  const [link] = await withPool().where(eq(linksTable.id, paramsParsed.data.id));
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  res.json(link);
});

router.delete("/links/:id", async (req, res) => {
  const parsed = DeleteLinkParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(linksTable).where(eq(linksTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/links/:id/click", async (req, res) => {
  const parsed = RecordLinkClickParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .update(linksTable)
    .set({ clicks: sql`${linksTable.clicks} + 1` })
    .where(eq(linksTable.id, parsed.data.id));

  const [link] = await withPool().where(eq(linksTable.id, parsed.data.id));
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  res.json(link);
});

export default router;
