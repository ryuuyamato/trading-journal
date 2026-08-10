import { prisma } from "@/lib/prisma";

/**
 * Menyaring id tag supaya hanya milik pengguna ini yang lolos.
 *
 * Tanpa ini, klien bisa mengirim id tag milik akun lain dan nama tag orang itu
 * akan tampil di trade-nya sendiri.
 */
export async function filterOwnedTagIds(tagIds: string[], userId: string): Promise<string[]> {
  if (tagIds.length === 0) return [];
  const owned = await prisma.tag.findMany({
    where: { id: { in: tagIds }, userId },
    select: { id: true },
  });
  return owned.map((t) => t.id);
}

/**
 * Lama posisi ditahan, dalam menit.
 *
 * Diturunkan dari waktu buka dan tutup, bukan diinput — angkanya sudah ada di
 * form, jadi memintanya sekali lagi hanya menambah kerja dan peluang salah.
 * Trade yang masih terbuka tidak punya durasi.
 */
export function deriveHoldingMinutes(openTime: Date, closeTime: Date | null): number | null {
  if (!closeTime) return null;
  const minutes = Math.round((closeTime.getTime() - openTime.getTime()) / 60000);
  return minutes >= 0 ? minutes : null;
}
