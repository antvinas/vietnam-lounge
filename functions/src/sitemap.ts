import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { SitemapStream, streamToPromise } from "sitemap";
if (!admin.apps.length) admin.initializeApp();

export const sitemap = functions.https.onRequest(async (_req, res) => {
  const db = admin.firestore();
  const spots = await db.collection("spots").where("published", "==", true).limit(5000).get();

  const smStream = new SitemapStream({ hostname: "https://YOUR_DOMAIN" });
  spots.forEach(doc => {
    const data = doc.data();
    smStream.write({
      url: `/spots/${doc.id}`,
      changefreq: "daily",
      priority: 0.7,
      lastmod: (data.updatedAt?.toDate?.() ?? new Date())
    });
  });
  smStream.end();

  const xml = await streamToPromise(smStream);
  res.set("Content-Type", "application/xml");
  res.status(200).send(xml.toString());
});
