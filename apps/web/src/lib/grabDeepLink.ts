export const grabLink = (from?: {lat:number;lng:number}, to?: {lat:number;lng:number}) => {
  const t = to ? `&dropoff=${to.lat},${to.lng}` : '';
  const s = from ? `pickup=${from.lat},${from.lng}` : '';
  return `https://m.grab.com/ride?${s}${t}`;
};
