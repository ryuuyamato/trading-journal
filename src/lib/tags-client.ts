"use client";

export interface TagOption {
  id: string;
  name: string;
  color: string;
  tradeCount: number;
}

// Tabel trade merender satu ticket per baris, jadi tanpa cache halaman berisi 50
// baris akan menembak /api/tags 50 kali. Promise-nya dibagi, bukan hasilnya,
// supaya beberapa pemanggil yang berbarengan tetap menghasilkan satu request.
let cache: Promise<TagOption[]> | null = null;

export function loadTags(): Promise<TagOption[]> {
  if (!cache) {
    cache = fetch("/api/tags")
      .then((res) => (res.ok ? res.json() : { tags: [] }))
      .then((body) => (body.tags ?? []) as TagOption[])
      .catch(() => [] as TagOption[]);
  }
  return cache;
}

/** Dipanggil setelah tag dibuat, diubah, atau dihapus. */
export function invalidateTags() {
  cache = null;
}
