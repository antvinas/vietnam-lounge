import * as functions from "firebase-functions";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION || "ap-southeast-1" });

export const signUpload = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login first");
  const key = `spots/${context.auth.uid}/${Date.now()}-${data.filename}`;
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: data.contentType || "image/jpeg",
    ACL: "public-read"
  } as any);
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
  const cdn = (process.env.CLOUDFRONT_URL || "").replace(/\/$/, "");
  return { url, key, cdnUrl: cdn ? `${cdn}/${key}` : null };
});
