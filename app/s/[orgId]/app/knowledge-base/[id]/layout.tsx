import { getKnowledgeBaseById } from "@/app/api/knowledge-base/knowledgeBaseActions";
import { Metadata } from "next";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ client_id?: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const { client_id } = await searchParams;
    const knowledgeBase = await getKnowledgeBaseById(id, client_id);
    
    return {
      title: knowledgeBase.name || "Knowledge Base",
    };
  } catch (error) {
    console.error('Failed to generate knowledge base metadata:', error);
    return {
      title: 'Knowledge Base',
    };
  }
}

export default async function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

