export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const minutesToHHMM = (min: number) => {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const overlap = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
) => {
  return (
    Math.max(toMinutes(aStart), toMinutes(bStart)) <
    Math.min(toMinutes(aEnd), toMinutes(bEnd))
  );
};
