import { CalendarSkeleton } from "@/components/calendar/CalendarSkeleton";

export default function CalendarLoading() {
  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-[20px] font-medium">Kalender Ekonomi</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Event ekonomi minggu ini &amp; minggu depan · diperbarui otomatis tiap jam
        </p>
      </div>
      <CalendarSkeleton />
    </div>
  );
}
