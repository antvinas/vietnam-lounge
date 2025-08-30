import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Typesense from "typesense";
if (!admin.apps.length) admin.initializeApp();

const client = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || "",
    port: Number(process.env.TYPESENSE_PORT || 443),
    protocol: process.env.TYPESENSE_PROTOCOL || "https"
  }],
  apiKey: process.env.TYPESENSE_ADMIN_KEY || "",
  connectionTimeoutSeconds: 5
});

const COLLECTION = process.env.TYPESENSE_COLLECTION || "spots";

export const onSpotWrite = functions.firestore
  .document("spots/{id}")
  .onWrite(async (change, context) => {
    const id = context.params.id;
    if (!change.after.exists) {
      try { await client.collections(COLLECTION).documents(id).delete(); } catch {}
      return;
    }
    const data = change.after.data()!;
    if (data.published !== true) return;

    const doc: any = {
      id,
      name: data.name,
      city: data.city,
      category: data.category,
      rating: data.rating ?? 0,
      geo_lat: data.location?.latitude ?? null,
      geo_lng: data.location?.longitude ?? null,
      reviewCount: data.reviewCount ?? 0
    };
    await client.collections(COLLECTION).documents().upsert(doc);
  });
