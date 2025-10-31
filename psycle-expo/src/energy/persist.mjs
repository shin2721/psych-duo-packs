const mem = new Map();
const hasLS = typeof globalThis !== "undefined" && !!globalThis.localStorage;
export function getItem(k){ try{ return hasLS ? localStorage.getItem(k) : mem.get(k) ?? null; }catch{ return mem.get(k) ?? null; } }
export function setItem(k,v){ try{ if(hasLS){ localStorage.setItem(k,String(v)); return; } }catch{} mem.set(k,String(v)); }
