
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import AdminLayoutShell from '@/components/admin/AdminLayoutShell';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "admin") {
        redirect("/");
    }

    return (
        <AdminLayoutShell>
            {children}
        </AdminLayoutShell>
    );
}
