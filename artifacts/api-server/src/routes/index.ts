import { Router, type IRouter } from "express";
import healthRouter from "./health";
import poolsRouter from "./pools";
import linksRouter from "./links";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(poolsRouter);
router.use(linksRouter);
router.use(statsRouter);

export default router;
