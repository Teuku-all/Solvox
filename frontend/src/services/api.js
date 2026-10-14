const API_BASE_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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
