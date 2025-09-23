import { ClientSidebar } from "@/components/clients/ClientSidebar";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params
  return (
    <div className="flex h-full">
      <ClientSidebar id={id} />
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
}