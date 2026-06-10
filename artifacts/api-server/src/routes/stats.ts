import { Router } from "express";
import { db } from "@workspace/db";
import { linksTable, poolsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import {
  GetTopLinksQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/stats/overview", async (req, res) => {
  const [totals] = await db
    .select({
      totalLinks: sql<number>`count(*)::int`,
      totalClicks: sql<number>`coalesce(sum(${linksTable.clicks}), 0)::int`,
      activeLinks: sql<number>`count(*) filter (where ${linksTable.isActive})::int`,
    })
    .from(linksTable);

  const [{ totalPools }] = await db
    .select({ totalPools: sql<number>`count(*)::int` })
    .from(poolsTable);

  const recentLinks = await db
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
    .orderBy(desc(linksTable.createdAt))
    .limit(5);

  res.json({
    totalLinks: totals?.totalLinks ?? 0,
    totalPools,
    totalClicks: totals?.totalClicks ?? 0,
    activeLinks: totals?.activeLinks ?? 0,
    recentLinks,
  });
});

router.get("/stats/top-links", async (req, res) => {
  const parsed = GetTopLinksQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  const limit = (parsed.success && parsed.data.limit) ? parsed.data.limit : 10;

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
    .orderBy(desc(linksTable.clicks))
    .limit(limit);

  res.json(links);
});

router.get("/stats/pool-breakdown", async (req, res) => {
  const breakdown = await db
    .select({
      poolId: poolsTable.id,
      poolName: poolsTable.name,
      poolColor: poolsTable.color,
      linkCount: sql<number>`count(${linksTable.id})::int`,
      totalClicks: sql<number>`coalesce(sum(${linksTable.clicks}), 0)::int`,
    })
    .from(poolsTable)
    .leftJoin(linksTable, eq(linksTable.poolId, poolsTable.id))
    .groupBy(poolsTable.id)
    .orderBy(desc(sql`sum(${linksTable.clicks})`));

  res.json(breakdown);
});

export default router;
