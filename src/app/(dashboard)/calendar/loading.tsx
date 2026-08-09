import { CalendarSkeleton } from "@/components/calendar/CalendarSkeleton";

export default function CalendarLoading() {
  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight">Kalender Ekonomi</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Event ekonomi minggu ini &amp; minggu depan Â· diperbarui otomatis tiap jam
        </p>
      </div>
      <CalendarSkeleton />
    </div>
  );
}
