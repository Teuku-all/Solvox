// A separate static frontend needs the persistent Node service for API and
// multiplayer. Keep environment overrides for custom deployments, while the
// repository's Render service is the production default.
const DEFAULT_BACKEND_URL = import.meta.env.PROD ? 'https://solvox-game-server.onrender.com' : '';
const trimTrailingSlash = value => String(value || '').replace(/\/$/, '');
const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || DEFAULT_BACKEND_URL);
export const SOCKET_URL = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL);

function resolveApiUrl(url) {
  if (!API_BASE_URL || /^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function apiFetch(url,options={}){
  const headers=new Headers(options.headers||{});
  if(!headers.has('Content-Type') && options.body!==undefined) headers.set('Content-Type','application/json');
  return fetch(resolveApiUrl(url),{...options,headers});
}
export async function apiJson(url,options={}){
  const response=await apiFetch(url,options);
  let data=null;
  try{data=await response.json();}catch{}
  if(!response.ok) throw Object.assign(new Error(data?.message||`Request failed (${response.status})`),{status:response.status,code:data?.code||'REQUEST_FAILED',data});
  return data;
}
