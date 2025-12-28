// firebase/functions/src/api/admin/index.ts
import * as express from "express";
import { requireAdmin } from "../../middlewares/requireAdmin";

import statsRouter from "./stats.router";
import searchRouter from "./search.router";
import reportsRouter from "./reports.router";
import auditRouter from "./audit.router";
import usersRouter from "./users.router";
import spotsRouter from "./spots.router";
import eventsRouter from "./events.router";
import sponsorsRouter from "./sponsors.router";
import systemRouter from "./system.router";

const router = express.Router();

// ✅ Admin API는 캐시 금지 (운영툴 정석: 화면/데이터 불일치 사고 방지)
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// ✅ auth guard for ALL admin APIs
router.use(requireAdmin);

// sub-routers
router.use("/stats", statsRouter);
router.use("/search", searchRouter);

router.use("/reports", reportsRouter);
router.use("/audit-logs", auditRouter);

router.use("/users", usersRouter);

router.use("/spots", spotsRouter);
router.use("/events", eventsRouter);

router.use("/sponsors", sponsorsRouter);

router.use("/system", systemRouter);

export default router;
