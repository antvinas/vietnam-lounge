// firebase/functions/src/api/admin/search.router.ts
import * as express from "express";
import {
  normalizeText,
  tokenize,
  scoreForRelevance,
  readRecent,
  trySearchByTokens,
  toMillis,
  extractUserRole,
  extractUserStatus,
  collectionForMode,
} from "./shared";

const router = express.Router();

// (운영용, 대량 조회 방지)
// GET /admin/search?q=...&tab=all|spots|events|users&sort=relevance|recent&mode=all|explorer|nightlife&role=all|admin|superAdmin|member&page=1&limit=20
// 반환: { q, tab, sort, mode, role, page, limit, totals, items, approximate }
// ==========================================
router.get("/", async (req, res) => {
  try {
    const qText = String(req.query.q || "").trim();
    if (!qText || qText.length < 2) {
      return res.status(200).send({
        q: qText,
        tab: String(req.query.tab || "all"),
        sort: String(req.query.sort || "relevance"),
        mode: String(req.query.mode || "all"),
        role: String(req.query.role || "all"),
        page: 1,
        limit: 20,
        totals: { all: 0, spots: 0, events: 0, users: 0 },
        items: { spots: [], events: [], users: [] },
        approximate: false,
      });
    }

    const tab = (String(req.query.tab || "all") as any) as "all" | "spots" | "events" | "users";
    const sort = (String(req.query.sort || "relevance") as any) as "relevance" | "recent";
    const mode = (String(req.query.mode || "all") as any) as "all" | "explorer" | "nightlife";
    const role = String(req.query.role || "all");
    const page = Math.max(1, Math.min(9999, Number(req.query.page || 1)));
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || (tab === "all" ? 8 : 20))));

    const qLower = normalizeText(qText);
    const tokens = tokenize(qText);

    let approximate = false;

    const pickCollections = (kind: "spots" | "events") => {
      if (mode === "explorer") return [collectionForMode("explorer", kind)];
      if (mode === "nightlife") return [collectionForMode("nightlife", kind)];
      return [collectionForMode("explorer", kind), collectionForMode("nightlife", kind)];
    };

    const searchSpots = async () => {
      const colNames = pickCollections("spots");
      const perColMax = tab === "all" ? Math.min(100, Math.max(50, limit * 4)) : Math.min(200, Math.max(80, limit * 6));

      const all: any[] = [];
      let totalApprox = 0;

      for (const colName of colNames) {
        let snap = await trySearchByTokens(colName, tokens, perColMax);

        if (!snap || snap.empty) {
          // fallback: 최근 문서만 제한적으로 읽어서 메모리 필터
          approximate = true;
          snap = await readRecent(colName, Math.min(300, perColMax * 2));
        }

        const modeVal: "explorer" | "nightlife" = colName === "adult_spots" ? "nightlife" : "explorer";

        const docs = snap.docs
          .map((d) => {
            const data: any = d.data() || {};
            const name = String(data.name || "");
            const address = String(data.address || "");
            const city = String(data.city || "");
            const category = String(data.category || "");
            const locationId = String(data.locationId || data.region || "");
            const hay = `${name} ${address} ${city} ${category} ${locationId}`;
            const match = normalizeText(hay).includes(qLower);

            return {
              id: d.id,
              mode: modeVal,
              name,
              category,
              address,
              city,
              locationId: locationId || null,
              createdAt: toMillis(data.createdAt) ?? data.createdAt ?? null,
              updatedAt: toMillis(data.updatedAt) ?? data.updatedAt ?? null,
              _score: scoreForRelevance(`${name} ${address} ${category} ${city}`, qText, tokens) + (match ? 15 : 0),
              _recent: toMillis(data.updatedAt) ?? toMillis(data.createdAt) ?? 0,
              _match: match,
            };
          })
          .filter((x) => x._match);

        totalApprox += docs.length;
        all.push(...docs);
      }

      // sort
      all.sort((a, b) => {
        if (sort === "recent") return (b._recent ?? 0) - (a._recent ?? 0);
        const ds = (b._score ?? 0) - (a._score ?? 0);
        if (ds !== 0) return ds;
        return (b._recent ?? 0) - (a._recent ?? 0);
      });

      const total = totalApprox;
      const start = (page - 1) * limit;
      const items = all.slice(start, start + limit).map(({ _score, _recent, _match, ...rest }) => rest);

      return { total, items };
    };

    const searchEvents = async () => {
      const colNames = pickCollections("events");
      const perColMax = tab === "all" ? Math.min(100, Math.max(50, limit * 4)) : Math.min(200, Math.max(80, limit * 6));

      const all: any[] = [];
      let totalApprox = 0;

      for (const colName of colNames) {
        let snap = await trySearchByTokens(colName, tokens, perColMax);
        if (!snap || snap.empty) {
          approximate = true;
          snap = await readRecent(colName, Math.min(300, perColMax * 2));
        }

        const modeVal: "explorer" | "nightlife" = colName === "adult_events" ? "nightlife" : "explorer";

        const docs = snap.docs
          .map((d) => {
            const data: any = d.data() || {};
            const title = String(data.title ?? data.name ?? "");
            const location = String(data.location || "");
            const city = String(data.city || "");
            const category = String(data.category || "");
            const date = String(data.date || "");
            const endDate = data.endDate ? String(data.endDate) : undefined;

            const hay = `${title} ${location} ${city} ${category} ${date}`;
            const match = normalizeText(hay).includes(qLower);

            return {
              id: d.id,
              mode: modeVal,
              title,
              location,
              city,
              category,
              date,
              endDate,
              createdAt: toMillis(data.createdAt) ?? data.createdAt ?? null,
              updatedAt: toMillis(data.updatedAt) ?? data.updatedAt ?? null,
              _score: scoreForRelevance(`${title} ${location} ${city} ${category}`, qText, tokens) + (match ? 15 : 0),
              _recent: toMillis(data.updatedAt) ?? toMillis(data.createdAt) ?? 0,
              _match: match,
            };
          })
          .filter((x) => x._match);

        totalApprox += docs.length;
        all.push(...docs);
      }

      all.sort((a, b) => {
        if (sort === "recent") return (b._recent ?? 0) - (a._recent ?? 0);
        const ds = (b._score ?? 0) - (a._score ?? 0);
        if (ds !== 0) return ds;
        return (b._recent ?? 0) - (a._recent ?? 0);
      });

      const total = totalApprox;
      const start = (page - 1) * limit;
      const items = all.slice(start, start + limit).map(({ _score, _recent, _match, ...rest }) => rest);

      return { total, items };
    };

    const searchUsers = async () => {
      // users는 보통 규모가 작고, 텍스트 검색 필드가 제각각이라 "최근 N명" 제한 스캔이 운영에서 가장 안전
      const maxScan = tab === "all" ? Math.min(200, Math.max(80, limit * 10)) : Math.min(400, Math.max(150, limit * 12));
      const snap = await readRecent("users", maxScan);

      let list = snap.docs.map((d) => {
        const data: any = d.data() || {};
        const email = String(data.email || "");
        const displayName = String(data.displayName || data.nickname || "");
        const r = extractUserRole(data);
        const st = extractUserStatus(data);

        const hay = `${displayName} ${email} ${r} ${st}`;
        const match = normalizeText(hay).includes(qLower);

        return {
          id: d.id,
          email: email || null,
          displayName: displayName || null,
          role: r,
          status: st,
          createdAt: toMillis(data.createdAt) ?? data.createdAt ?? null,
          updatedAt: toMillis(data.updatedAt) ?? data.updatedAt ?? null,
          _score: scoreForRelevance(`${displayName} ${email} ${r} ${st}`, qText, tokens) + (match ? 10 : 0),
          _recent: toMillis(data.updatedAt) ?? toMillis(data.createdAt) ?? 0,
          _match: match,
        };
      });

      list = list.filter((x) => x._match);

      // role 필터(선택)
      if (role && role !== "all") {
        list = list.filter((u) => String(u.role || "").toLowerCase() === String(role).toLowerCase());
      }

      list.sort((a, b) => {
        if (sort === "recent") return (b._recent ?? 0) - (a._recent ?? 0);
        const ds = (b._score ?? 0) - (a._score ?? 0);
        if (ds !== 0) return ds;
        return (b._recent ?? 0) - (a._recent ?? 0);
      });

      const total = list.length;
      const start = (page - 1) * limit;
      const items = list.slice(start, start + limit).map(({ _score, _recent, _match, ...rest }) => rest);

      return { total, items };
    };

    let spotsTotal = 0;
    let eventsTotal = 0;
    let usersTotal = 0;

    let spotsItems: any[] = [];
    let eventsItems: any[] = [];
    let usersItems: any[] = [];

    if (tab === "spots") {
      const r = await searchSpots();
      spotsTotal = r.total;
      spotsItems = r.items;
    } else if (tab === "events") {
      const r = await searchEvents();
      eventsTotal = r.total;
      eventsItems = r.items;
    } else if (tab === "users") {
      const r = await searchUsers();
      usersTotal = r.total;
      usersItems = r.items;
    } else {
      // all
      const perTypeLimit = Math.min(8, limit);
      const [rs, re, ru] = await Promise.all([
        (async () => {
          const l = perTypeLimit;
          const colNames = pickCollections("spots");
          const all: any[] = [];
          for (const colName of colNames) {
            let snap = await trySearchByTokens(colName, tokens, Math.min(200, l * 10));
            if (!snap || snap.empty) {
              approximate = true;
              snap = await readRecent(colName, Math.min(300, l * 12));
            }
            const modeVal: "explorer" | "nightlife" = colName === "adult_spots" ? "nightlife" : "explorer";
            const docs = snap.docs
              .map((d) => {
                const data: any = d.data() || {};
                const name = String(data.name || "");
                const address = String(data.address || "");
                const city = String(data.city || "");
                const category = String(data.category || "");
                const locationId = String(data.locationId || data.region || "");
                const hay = `${name} ${address} ${city} ${category} ${locationId}`;
                const match = normalizeText(hay).includes(qLower);
                return {
                  id: d.id,
                  mode: modeVal,
                  name,
                  category,
                  address,
                  city,
                  locationId: locationId || null,
                  createdAt: toMillis(data.createdAt) ?? data.createdAt ?? null,
                  updatedAt: toMillis(data.updatedAt) ?? data.updatedAt ?? null,
                  _score: scoreForRelevance(`${name} ${address} ${category} ${city}`, qText, tokens) + (match ? 15 : 0),
                  _recent: toMillis(data.updatedAt) ?? toMillis(data.createdAt) ?? 0,
                  _match: match,
                };
              })
              .filter((x) => x._match);

            all.push(...docs);
          }
          all.sort((a, b) => {
            if (sort === "recent") return (b._recent ?? 0) - (a._recent ?? 0);
            const ds = (b._score ?? 0) - (a._score ?? 0);
            if (ds !== 0) return ds;
            return (b._recent ?? 0) - (a._recent ?? 0);
          });
          const items = all.slice(0, l).map(({ _score, _recent, _match, ...rest }) => rest);
          return { total: all.length, items };
        })(),
        (async () => {
          const l = perTypeLimit;
          const colNames = pickCollections("events");
          const all: any[] = [];
          for (const colName of colNames) {
            let snap = await trySearchByTokens(colName, tokens, Math.min(200, l * 10));
            if (!snap || snap.empty) {
              approximate = true;
              snap = await readRecent(colName, Math.min(300, l * 12));
            }

            const modeVal: "explorer" | "nightlife" = colName === "adult_events" ? "nightlife" : "explorer";

            const docs = snap.docs
              .map((d) => {
                const data: any = d.data() || {};
                const title = String(data.title ?? data.name ?? "");
                const location = String(data.location || "");
                const city = String(data.city || "");
                const category = String(data.category || "");
                const date = String(data.date || "");
                const endDate = data.endDate ? String(data.endDate) : undefined;

                const hay = `${title} ${location} ${city} ${category} ${date}`;
                const match = normalizeText(hay).includes(qLower);

                return {
                  id: d.id,
                  mode: modeVal,
                  title,
                  location,
                  city,
                  category,
                  date,
                  endDate,
                  createdAt: toMillis(data.createdAt) ?? data.createdAt ?? null,
                  updatedAt: toMillis(data.updatedAt) ?? data.updatedAt ?? null,
                  _score: scoreForRelevance(`${title} ${location} ${city} ${category}`, qText, tokens) + (match ? 15 : 0),
                  _recent: toMillis(data.updatedAt) ?? toMillis(data.createdAt) ?? 0,
                  _match: match,
                };
              })
              .filter((x) => x._match);

            all.push(...docs);
          }

          all.sort((a, b) => {
            if (sort === "recent") return (b._recent ?? 0) - (a._recent ?? 0);
            const ds = (b._score ?? 0) - (a._score ?? 0);
            if (ds !== 0) return ds;
            return (b._recent ?? 0) - (a._recent ?? 0);
          });

          const items = all.slice(0, l).map(({ _score, _recent, _match, ...rest }) => rest);
          return { total: all.length, items };
        })(),
        (async () => {
          const l = perTypeLimit;
          const maxScan = Math.min(250, Math.max(120, l * 15));
          const snap = await readRecent("users", maxScan);

          let list = snap.docs.map((d) => {
            const data: any = d.data() || {};
            const email = String(data.email || "");
            const displayName = String(data.displayName || data.nickname || "");
            const r = extractUserRole(data);
            const st = extractUserStatus(data);

            const hay = `${displayName} ${email} ${r} ${st}`;
            const match = normalizeText(hay).includes(qLower);

            return {
              id: d.id,
              email: email || null,
              displayName: displayName || null,
              role: r,
              status: st,
              createdAt: toMillis(data.createdAt) ?? data.createdAt ?? null,
              updatedAt: toMillis(data.updatedAt) ?? data.updatedAt ?? null,
              _score: scoreForRelevance(`${displayName} ${email} ${r} ${st}`, qText, tokens) + (match ? 10 : 0),
              _recent: toMillis(data.updatedAt) ?? toMillis(data.createdAt) ?? 0,
              _match: match,
            };
          });

          list = list.filter((x) => x._match);

          // role 필터(선택)
          if (role && role !== "all") {
            list = list.filter((u) => String(u.role || "").toLowerCase() === String(role).toLowerCase());
          }

          list.sort((a, b) => {
            if (sort === "recent") return (b._recent ?? 0) - (a._recent ?? 0);
            const ds = (b._score ?? 0) - (a._score ?? 0);
            if (ds !== 0) return ds;
            return (b._recent ?? 0) - (a._recent ?? 0);
          });

          const items = list.slice(0, l).map(({ _score, _recent, _match, ...rest }) => rest);
          return { total: list.length, items };
        })(),
      ]);

      spotsTotal = rs.total;
      eventsTotal = re.total;
      usersTotal = ru.total;

      spotsItems = rs.items;
      eventsItems = re.items;
      usersItems = ru.items;
    }

    const totals = {
      spots: spotsTotal,
      events: eventsTotal,
      users: usersTotal,
      all: spotsTotal + eventsTotal + usersTotal,
    };

    return res.status(200).send({
      q: qText,
      tab,
      sort,
      mode,
      role,
      page,
      limit,
      totals,
      items: {
        spots: spotsItems,
        events: eventsItems,
        users: usersItems,
      },
      approximate,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to search" });
  }
});

export default router;
