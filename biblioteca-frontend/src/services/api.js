// src/services/api.js

export async function api(path, options) {
  const res = await fetch(`http://localhost:4000${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // tenta converter pra JSON; se falhar, cria objeto vazio
  const data = await res.json().catch(() => ({}));

  // mensagem amigável (vem do errorHandler do back)
  const msg =
    data?.error?.message ||
    (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
    `Erro ${res.status}`;

  if (!res.ok || data.ok === false) {
    const e = new Error(msg);
    e.type = data?.error?.type || 'UNKNOWN';
    e.status = data?.error?.status || res.status;
    throw e;
  }

  return data;
}
