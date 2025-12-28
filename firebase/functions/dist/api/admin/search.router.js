"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// firebase/functions/src/api/admin/search.router.ts
const express = __importStar(require("express"));
const shared_1 = require("./shared");
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
        const tab = String(req.query.tab || "all");
        const sort = String(req.query.sort || "relevance");
        const mode = String(req.query.mode || "all");
        const role = String(req.query.role || "all");
        const page = Math.max(1, Math.min(9999, Number(req.query.page || 1)));
        const limit = Math.max(1, Math.min(50, Number(req.query.limit || (tab === "all" ? 8 : 20))));
        const qLower = (0, shared_1.normalizeText)(qText);
        const tokens = (0, shared_1.tokenize)(qText);
        let approximate = false;
        const pickCollections = (kind) => {
            if (mode === "explorer")
                return [(0, shared_1.collectionForMode)("explorer", kind)];
            if (mode === "nightlife")
                return [(0, shared_1.collectionForMode)("nightlife", kind)];
            return [(0, shared_1.collectionForMode)("explorer", kind), (0, shared_1.collectionForMode)("nightlife", kind)];
        };
        const searchSpots = async () => {
            const colNames = pickCollections("spots");
            const perColMax = tab === "all" ? Math.min(100, Math.max(50, limit * 4)) : Math.min(200, Math.max(80, limit * 6));
            const all = [];
            let totalApprox = 0;
            for (const colName of colNames) {
                let snap = await (0, shared_1.trySearchByTokens)(colName, tokens, perColMax);
                if (!snap || snap.empty) {
                    // fallback: 최근 문서만 제한적으로 읽어서 메모리 필터
                    approximate = true;
                    snap = await (0, shared_1.readRecent)(colName, Math.min(300, perColMax * 2));
                }
                const modeVal = colName === "adult_spots" ? "nightlife" : "explorer";
                const docs = snap.docs
                    .map((d) => {
                    var _a, _b, _c, _d, _e, _f;
                    const data = d.data() || {};
                    const name = String(data.name || "");
                    const address = String(data.address || "");
                    const city = String(data.city || "");
                    const category = String(data.category || "");
                    const locationId = String(data.locationId || data.region || "");
                    const hay = `${name} ${address} ${city} ${category} ${locationId}`;
                    const match = (0, shared_1.normalizeText)(hay).includes(qLower);
                    return {
                        id: d.id,
                        mode: modeVal,
                        name,
                        category,
                        address,
                        city,
                        locationId: locationId || null,
                        createdAt: (_b = (_a = (0, shared_1.toMillis)(data.createdAt)) !== null && _a !== void 0 ? _a : data.createdAt) !== null && _b !== void 0 ? _b : null,
                        updatedAt: (_d = (_c = (0, shared_1.toMillis)(data.updatedAt)) !== null && _c !== void 0 ? _c : data.updatedAt) !== null && _d !== void 0 ? _d : null,
                        _score: (0, shared_1.scoreForRelevance)(`${name} ${address} ${category} ${city}`, qText, tokens) + (match ? 15 : 0),
                        _recent: (_f = (_e = (0, shared_1.toMillis)(data.updatedAt)) !== null && _e !== void 0 ? _e : (0, shared_1.toMillis)(data.createdAt)) !== null && _f !== void 0 ? _f : 0,
                        _match: match,
                    };
                })
                    .filter((x) => x._match);
                totalApprox += docs.length;
                all.push(...docs);
            }
            // sort
            all.sort((a, b) => {
                var _a, _b, _c, _d, _e, _f;
                if (sort === "recent")
                    return ((_a = b._recent) !== null && _a !== void 0 ? _a : 0) - ((_b = a._recent) !== null && _b !== void 0 ? _b : 0);
                const ds = ((_c = b._score) !== null && _c !== void 0 ? _c : 0) - ((_d = a._score) !== null && _d !== void 0 ? _d : 0);
                if (ds !== 0)
                    return ds;
                return ((_e = b._recent) !== null && _e !== void 0 ? _e : 0) - ((_f = a._recent) !== null && _f !== void 0 ? _f : 0);
            });
            const total = totalApprox;
            const start = (page - 1) * limit;
            const items = all.slice(start, start + limit).map((_a) => {
                var { _score, _recent, _match } = _a, rest = __rest(_a, ["_score", "_recent", "_match"]);
                return rest;
            });
            return { total, items };
        };
        const searchEvents = async () => {
            const colNames = pickCollections("events");
            const perColMax = tab === "all" ? Math.min(100, Math.max(50, limit * 4)) : Math.min(200, Math.max(80, limit * 6));
            const all = [];
            let totalApprox = 0;
            for (const colName of colNames) {
                let snap = await (0, shared_1.trySearchByTokens)(colName, tokens, perColMax);
                if (!snap || snap.empty) {
                    approximate = true;
                    snap = await (0, shared_1.readRecent)(colName, Math.min(300, perColMax * 2));
                }
                const modeVal = colName === "adult_events" ? "nightlife" : "explorer";
                const docs = snap.docs
                    .map((d) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    const data = d.data() || {};
                    const title = String((_b = (_a = data.title) !== null && _a !== void 0 ? _a : data.name) !== null && _b !== void 0 ? _b : "");
                    const location = String(data.location || "");
                    const city = String(data.city || "");
                    const category = String(data.category || "");
                    const date = String(data.date || "");
                    const endDate = data.endDate ? String(data.endDate) : undefined;
                    const hay = `${title} ${location} ${city} ${category} ${date}`;
                    const match = (0, shared_1.normalizeText)(hay).includes(qLower);
                    return {
                        id: d.id,
                        mode: modeVal,
                        title,
                        location,
                        city,
                        category,
                        date,
                        endDate,
                        createdAt: (_d = (_c = (0, shared_1.toMillis)(data.createdAt)) !== null && _c !== void 0 ? _c : data.createdAt) !== null && _d !== void 0 ? _d : null,
                        updatedAt: (_f = (_e = (0, shared_1.toMillis)(data.updatedAt)) !== null && _e !== void 0 ? _e : data.updatedAt) !== null && _f !== void 0 ? _f : null,
                        _score: (0, shared_1.scoreForRelevance)(`${title} ${location} ${city} ${category}`, qText, tokens) + (match ? 15 : 0),
                        _recent: (_h = (_g = (0, shared_1.toMillis)(data.updatedAt)) !== null && _g !== void 0 ? _g : (0, shared_1.toMillis)(data.createdAt)) !== null && _h !== void 0 ? _h : 0,
                        _match: match,
                    };
                })
                    .filter((x) => x._match);
                totalApprox += docs.length;
                all.push(...docs);
            }
            all.sort((a, b) => {
                var _a, _b, _c, _d, _e, _f;
                if (sort === "recent")
                    return ((_a = b._recent) !== null && _a !== void 0 ? _a : 0) - ((_b = a._recent) !== null && _b !== void 0 ? _b : 0);
                const ds = ((_c = b._score) !== null && _c !== void 0 ? _c : 0) - ((_d = a._score) !== null && _d !== void 0 ? _d : 0);
                if (ds !== 0)
                    return ds;
                return ((_e = b._recent) !== null && _e !== void 0 ? _e : 0) - ((_f = a._recent) !== null && _f !== void 0 ? _f : 0);
            });
            const total = totalApprox;
            const start = (page - 1) * limit;
            const items = all.slice(start, start + limit).map((_a) => {
                var { _score, _recent, _match } = _a, rest = __rest(_a, ["_score", "_recent", "_match"]);
                return rest;
            });
            return { total, items };
        };
        const searchUsers = async () => {
            // users는 보통 규모가 작고, 텍스트 검색 필드가 제각각이라 "최근 N명" 제한 스캔이 운영에서 가장 안전
            const maxScan = tab === "all" ? Math.min(200, Math.max(80, limit * 10)) : Math.min(400, Math.max(150, limit * 12));
            const snap = await (0, shared_1.readRecent)("users", maxScan);
            let list = snap.docs.map((d) => {
                var _a, _b, _c, _d, _e, _f;
                const data = d.data() || {};
                const email = String(data.email || "");
                const displayName = String(data.displayName || data.nickname || "");
                const r = (0, shared_1.extractUserRole)(data);
                const st = (0, shared_1.extractUserStatus)(data);
                const hay = `${displayName} ${email} ${r} ${st}`;
                const match = (0, shared_1.normalizeText)(hay).includes(qLower);
                return {
                    id: d.id,
                    email: email || null,
                    displayName: displayName || null,
                    role: r,
                    status: st,
                    createdAt: (_b = (_a = (0, shared_1.toMillis)(data.createdAt)) !== null && _a !== void 0 ? _a : data.createdAt) !== null && _b !== void 0 ? _b : null,
                    updatedAt: (_d = (_c = (0, shared_1.toMillis)(data.updatedAt)) !== null && _c !== void 0 ? _c : data.updatedAt) !== null && _d !== void 0 ? _d : null,
                    _score: (0, shared_1.scoreForRelevance)(`${displayName} ${email} ${r} ${st}`, qText, tokens) + (match ? 10 : 0),
                    _recent: (_f = (_e = (0, shared_1.toMillis)(data.updatedAt)) !== null && _e !== void 0 ? _e : (0, shared_1.toMillis)(data.createdAt)) !== null && _f !== void 0 ? _f : 0,
                    _match: match,
                };
            });
            list = list.filter((x) => x._match);
            // role 필터(선택)
            if (role && role !== "all") {
                list = list.filter((u) => String(u.role || "").toLowerCase() === String(role).toLowerCase());
            }
            list.sort((a, b) => {
                var _a, _b, _c, _d, _e, _f;
                if (sort === "recent")
                    return ((_a = b._recent) !== null && _a !== void 0 ? _a : 0) - ((_b = a._recent) !== null && _b !== void 0 ? _b : 0);
                const ds = ((_c = b._score) !== null && _c !== void 0 ? _c : 0) - ((_d = a._score) !== null && _d !== void 0 ? _d : 0);
                if (ds !== 0)
                    return ds;
                return ((_e = b._recent) !== null && _e !== void 0 ? _e : 0) - ((_f = a._recent) !== null && _f !== void 0 ? _f : 0);
            });
            const total = list.length;
            const start = (page - 1) * limit;
            const items = list.slice(start, start + limit).map((_a) => {
                var { _score, _recent, _match } = _a, rest = __rest(_a, ["_score", "_recent", "_match"]);
                return rest;
            });
            return { total, items };
        };
        let spotsTotal = 0;
        let eventsTotal = 0;
        let usersTotal = 0;
        let spotsItems = [];
        let eventsItems = [];
        let usersItems = [];
        if (tab === "spots") {
            const r = await searchSpots();
            spotsTotal = r.total;
            spotsItems = r.items;
        }
        else if (tab === "events") {
            const r = await searchEvents();
            eventsTotal = r.total;
            eventsItems = r.items;
        }
        else if (tab === "users") {
            const r = await searchUsers();
            usersTotal = r.total;
            usersItems = r.items;
        }
        else {
            // all
            const perTypeLimit = Math.min(8, limit);
            const [rs, re, ru] = await Promise.all([
                (async () => {
                    const l = perTypeLimit;
                    const colNames = pickCollections("spots");
                    const all = [];
                    for (const colName of colNames) {
                        let snap = await (0, shared_1.trySearchByTokens)(colName, tokens, Math.min(200, l * 10));
                        if (!snap || snap.empty) {
                            approximate = true;
                            snap = await (0, shared_1.readRecent)(colName, Math.min(300, l * 12));
                        }
                        const modeVal = colName === "adult_spots" ? "nightlife" : "explorer";
                        const docs = snap.docs
                            .map((d) => {
                            var _a, _b, _c, _d, _e, _f;
                            const data = d.data() || {};
                            const name = String(data.name || "");
                            const address = String(data.address || "");
                            const city = String(data.city || "");
                            const category = String(data.category || "");
                            const locationId = String(data.locationId || data.region || "");
                            const hay = `${name} ${address} ${city} ${category} ${locationId}`;
                            const match = (0, shared_1.normalizeText)(hay).includes(qLower);
                            return {
                                id: d.id,
                                mode: modeVal,
                                name,
                                category,
                                address,
                                city,
                                locationId: locationId || null,
                                createdAt: (_b = (_a = (0, shared_1.toMillis)(data.createdAt)) !== null && _a !== void 0 ? _a : data.createdAt) !== null && _b !== void 0 ? _b : null,
                                updatedAt: (_d = (_c = (0, shared_1.toMillis)(data.updatedAt)) !== null && _c !== void 0 ? _c : data.updatedAt) !== null && _d !== void 0 ? _d : null,
                                _score: (0, shared_1.scoreForRelevance)(`${name} ${address} ${category} ${city}`, qText, tokens) + (match ? 15 : 0),
                                _recent: (_f = (_e = (0, shared_1.toMillis)(data.updatedAt)) !== null && _e !== void 0 ? _e : (0, shared_1.toMillis)(data.createdAt)) !== null && _f !== void 0 ? _f : 0,
                                _match: match,
                            };
                        })
                            .filter((x) => x._match);
                        all.push(...docs);
                    }
                    all.sort((a, b) => {
                        var _a, _b, _c, _d, _e, _f;
                        if (sort === "recent")
                            return ((_a = b._recent) !== null && _a !== void 0 ? _a : 0) - ((_b = a._recent) !== null && _b !== void 0 ? _b : 0);
                        const ds = ((_c = b._score) !== null && _c !== void 0 ? _c : 0) - ((_d = a._score) !== null && _d !== void 0 ? _d : 0);
                        if (ds !== 0)
                            return ds;
                        return ((_e = b._recent) !== null && _e !== void 0 ? _e : 0) - ((_f = a._recent) !== null && _f !== void 0 ? _f : 0);
                    });
                    const items = all.slice(0, l).map((_a) => {
                        var { _score, _recent, _match } = _a, rest = __rest(_a, ["_score", "_recent", "_match"]);
                        return rest;
                    });
                    return { total: all.length, items };
                })(),
                (async () => {
                    const l = perTypeLimit;
                    const colNames = pickCollections("events");
                    const all = [];
                    for (const colName of colNames) {
                        let snap = await (0, shared_1.trySearchByTokens)(colName, tokens, Math.min(200, l * 10));
                        if (!snap || snap.empty) {
                            approximate = true;
                            snap = await (0, shared_1.readRecent)(colName, Math.min(300, l * 12));
                        }
                        const modeVal = colName === "adult_events" ? "nightlife" : "explorer";
                        const docs = snap.docs
                            .map((d) => {
                            var _a, _b, _c, _d, _e, _f, _g, _h;
                            const data = d.data() || {};
                            const title = String((_b = (_a = data.title) !== null && _a !== void 0 ? _a : data.name) !== null && _b !== void 0 ? _b : "");
                            const location = String(data.location || "");
                            const city = String(data.city || "");
                            const category = String(data.category || "");
                            const date = String(data.date || "");
                            const endDate = data.endDate ? String(data.endDate) : undefined;
                            const hay = `${title} ${location} ${city} ${category} ${date}`;
                            const match = (0, shared_1.normalizeText)(hay).includes(qLower);
                            return {
                                id: d.id,
                                mode: modeVal,
                                title,
                                location,
                                city,
                                category,
                                date,
                                endDate,
                                createdAt: (_d = (_c = (0, shared_1.toMillis)(data.createdAt)) !== null && _c !== void 0 ? _c : data.createdAt) !== null && _d !== void 0 ? _d : null,
                                updatedAt: (_f = (_e = (0, shared_1.toMillis)(data.updatedAt)) !== null && _e !== void 0 ? _e : data.updatedAt) !== null && _f !== void 0 ? _f : null,
                                _score: (0, shared_1.scoreForRelevance)(`${title} ${location} ${city} ${category}`, qText, tokens) + (match ? 15 : 0),
                                _recent: (_h = (_g = (0, shared_1.toMillis)(data.updatedAt)) !== null && _g !== void 0 ? _g : (0, shared_1.toMillis)(data.createdAt)) !== null && _h !== void 0 ? _h : 0,
                                _match: match,
                            };
                        })
                            .filter((x) => x._match);
                        all.push(...docs);
                    }
                    all.sort((a, b) => {
                        var _a, _b, _c, _d, _e, _f;
                        if (sort === "recent")
                            return ((_a = b._recent) !== null && _a !== void 0 ? _a : 0) - ((_b = a._recent) !== null && _b !== void 0 ? _b : 0);
                        const ds = ((_c = b._score) !== null && _c !== void 0 ? _c : 0) - ((_d = a._score) !== null && _d !== void 0 ? _d : 0);
                        if (ds !== 0)
                            return ds;
                        return ((_e = b._recent) !== null && _e !== void 0 ? _e : 0) - ((_f = a._recent) !== null && _f !== void 0 ? _f : 0);
                    });
                    const items = all.slice(0, l).map((_a) => {
                        var { _score, _recent, _match } = _a, rest = __rest(_a, ["_score", "_recent", "_match"]);
                        return rest;
                    });
                    return { total: all.length, items };
                })(),
                (async () => {
                    const l = perTypeLimit;
                    const maxScan = Math.min(250, Math.max(120, l * 15));
                    const snap = await (0, shared_1.readRecent)("users", maxScan);
                    let list = snap.docs.map((d) => {
                        var _a, _b, _c, _d, _e, _f;
                        const data = d.data() || {};
                        const email = String(data.email || "");
                        const displayName = String(data.displayName || data.nickname || "");
                        const r = (0, shared_1.extractUserRole)(data);
                        const st = (0, shared_1.extractUserStatus)(data);
                        const hay = `${displayName} ${email} ${r} ${st}`;
                        const match = (0, shared_1.normalizeText)(hay).includes(qLower);
                        return {
                            id: d.id,
                            email: email || null,
                            displayName: displayName || null,
                            role: r,
                            status: st,
                            createdAt: (_b = (_a = (0, shared_1.toMillis)(data.createdAt)) !== null && _a !== void 0 ? _a : data.createdAt) !== null && _b !== void 0 ? _b : null,
                            updatedAt: (_d = (_c = (0, shared_1.toMillis)(data.updatedAt)) !== null && _c !== void 0 ? _c : data.updatedAt) !== null && _d !== void 0 ? _d : null,
                            _score: (0, shared_1.scoreForRelevance)(`${displayName} ${email} ${r} ${st}`, qText, tokens) + (match ? 10 : 0),
                            _recent: (_f = (_e = (0, shared_1.toMillis)(data.updatedAt)) !== null && _e !== void 0 ? _e : (0, shared_1.toMillis)(data.createdAt)) !== null && _f !== void 0 ? _f : 0,
                            _match: match,
                        };
                    });
                    list = list.filter((x) => x._match);
                    // role 필터(선택)
                    if (role && role !== "all") {
                        list = list.filter((u) => String(u.role || "").toLowerCase() === String(role).toLowerCase());
                    }
                    list.sort((a, b) => {
                        var _a, _b, _c, _d, _e, _f;
                        if (sort === "recent")
                            return ((_a = b._recent) !== null && _a !== void 0 ? _a : 0) - ((_b = a._recent) !== null && _b !== void 0 ? _b : 0);
                        const ds = ((_c = b._score) !== null && _c !== void 0 ? _c : 0) - ((_d = a._score) !== null && _d !== void 0 ? _d : 0);
                        if (ds !== 0)
                            return ds;
                        return ((_e = b._recent) !== null && _e !== void 0 ? _e : 0) - ((_f = a._recent) !== null && _f !== void 0 ? _f : 0);
                    });
                    const items = list.slice(0, l).map((_a) => {
                        var { _score, _recent, _match } = _a, rest = __rest(_a, ["_score", "_recent", "_match"]);
                        return rest;
                    });
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
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to search" });
    }
});
exports.default = router;
//# sourceMappingURL=search.router.js.map