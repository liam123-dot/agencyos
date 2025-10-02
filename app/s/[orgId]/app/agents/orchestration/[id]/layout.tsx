import { getWorkflow } from "@/app/api/agents/orchestration/orchestrationActions";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const workflow = await getWorkflow(id);
    
    return {
      title: workflow.name || "Workflow",
    };
  } catch (error) {
    console.error('Failed to generate workflow metadata:', error);
    return {
      title: 'Workflow',
    };
  }
}

export default async function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

