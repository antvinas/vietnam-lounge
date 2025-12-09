// apps/web/src/utils/id.ts
import { nanoid as _nanoid, customAlphabet } from "nanoid";

/** 기본 ID */
export const nanoid = (size?: number) => (size ? _nanoid(size) : _nanoid());

/** 숫자만 8자리 */
export const nanoidNumeric = customAlphabet("0123456789", 8);

/** URL-safe 12자리 */
export const nanoidUrlSafe = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_",
  12
);

export default nanoid;
