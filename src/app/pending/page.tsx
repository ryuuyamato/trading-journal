import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/sign-out-button";
import { Clock, XCircle } from "lucide-react";

export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN" || session.user.status === "APPROVED") redirect("/dashboard");

  const isRejected = session.user.status === "REJECTED";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-2 rounded-lg bg-primary/10">
                {isRejected ? (
                  <XCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <Clock className="h-6 w-6 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="text-xl">
              {isRejected ? "Akses Ditolak" : "Menunggu Persetujuan"}
            </CardTitle>
            <CardDescription>
              {isRejected
                ? "Permintaan akses akun Anda ditolak oleh admin. Hubungi admin jika menurut Anda ini suatu kekeliruan."
                : "Akun Anda sudah terdaftar, tapi belum diaktifkan oleh admin. Mohon tunggu hingga akses Anda disetujui — fitur akan terbuka secara otomatis setelah disetujui."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton className="w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
