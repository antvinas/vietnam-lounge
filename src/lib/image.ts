import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

export async function getSignedUploadUrl(filename: string, contentType: string) {
  const fn = httpsCallable(getFunctions(app), 'signUpload');
  const res:any = await fn({ filename, contentType });
  return res.data as { url: string; key: string; cdnUrl: string | null };
}

export async function uploadToS3(url: string, file: File, contentType: string) {
  const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
  if (!put.ok) throw new Error('Upload failed');
}
