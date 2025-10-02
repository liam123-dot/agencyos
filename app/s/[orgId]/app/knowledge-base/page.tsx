import { KnowledgeBaseList } from "@/components/knowledge-base/KnowledgeBaseList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Base",
}

export default function KnowledgeBasePage() {
    return (
        <div className="p-4 md:p-6">
            <KnowledgeBaseList />
        </div>
    )
}