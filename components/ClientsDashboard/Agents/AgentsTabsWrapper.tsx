'use client'

import { useState, ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, Workflow, Key } from "lucide-react"

interface AgentsTabsWrapperProps {
    agentsContent: ReactNode
    workflowsContent: ReactNode
    credentialsContent: ReactNode
}

export default function AgentsTabsWrapper({ 
    agentsContent, 
    workflowsContent, 
    credentialsContent 
}: AgentsTabsWrapperProps) {
    const [activeTab, setActiveTab] = useState("agents")

    return (
        <Card className="border-border/60 shadow-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border/60 px-6 pb-4">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="agents" className="gap-2">
                            <Bot className="h-4 w-4" />
                            <span>Agents</span>
                        </TabsTrigger>
                        <TabsTrigger value="workflows" className="gap-2">
                            <Workflow className="h-4 w-4" />
                            <span>Workflows</span>
                        </TabsTrigger>
                        <TabsTrigger value="credentials" className="gap-2">
                            <Key className="h-4 w-4" />
                            <span>Credentials</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <CardContent className="p-0">
                    <TabsContent value="agents" className="m-0">
                        {agentsContent}
                    </TabsContent>

                    <TabsContent value="workflows" className="m-0">
                        {workflowsContent}
                    </TabsContent>

                    <TabsContent value="credentials" className="m-0">
                        {credentialsContent}
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    )
}

