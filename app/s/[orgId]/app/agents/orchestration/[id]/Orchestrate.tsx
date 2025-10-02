'use client'

import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Controls, MiniMap, Handle, Position, BaseEdge, EdgeLabelRenderer, getSmoothStepPath, EdgeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, Pencil, Check, Phone, Bot, Workflow, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { saveOrchestration } from "@/app/api/agents/orchestration/orchestrationActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PhoneNumber {
    id: string;
    phone_number: string;
    client_id: string;
    agent_id: string | null;
    workflow_id: string | null;
    created_at: string;
    updated_at: string;
}

interface StartCallNodeData {
    phoneNumbers: PhoneNumber[];
    selectedPhoneNumberId?: string;
    onPhoneNumberChange: (value: string) => void;
}

interface CustomEdgeData {
    description?: string;
    message?: string;
    onSave?: (edgeId: string, description: string, message: string) => void;
}

// Add this new interface
interface AgentNodeData {
    label: string;
    agentId: string;
}

// Create a union type for all node data
type NodeData = StartCallNodeData | AgentNodeData;

// Simple Edge Component (no conditions) for Start Call node
function SimpleEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
}: EdgeProps) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
    });

    return <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 3, stroke: '#10b981' }} />;
}

// Custom Edge Component with Add Button (for conditional transfers)
function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
}: EdgeProps & { data?: CustomEdgeData }) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(data?.description || '');
    const [message, setMessage] = useState(data?.message || '');

    const handleSave = () => {
        if (data?.onSave) {
            data.onSave(id, description, message);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSave();
        } else if (e.key === 'Escape') {
            setDescription(data?.description || '');
            setMessage(data?.message || '');
            setIsEditing(false);
        }
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2.5, stroke: '#6366f1' }} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    {!isEditing && !data?.description ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 rounded-full bg-white hover:bg-indigo-50 border-2 border-indigo-500 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                            onClick={() => setIsEditing(true)}
                        >
                            <Plus className="w-4 h-4 text-indigo-600" />
                        </Button>
                    ) : isEditing ? (
                        <div className="flex flex-col gap-3 bg-white rounded-xl shadow-2xl border-2 border-indigo-500 p-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">When to transfer:</label>
                                <Input
                                    autoFocus
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., if they want to speak to sales"
                                    className="w-[300px] h-9 text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Transfer message:</label>
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., Transferring you to sales"
                                    className="w-[300px] h-9 text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setDescription(data?.description || '');
                                        setMessage(data?.message || '');
                                        setIsEditing(false);
                                    }}
                                    className="h-8 px-3 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    className="h-8 px-4 text-xs bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg border-2 border-indigo-200 px-4 py-3 max-w-[340px] cursor-pointer hover:border-indigo-400 hover:shadow-xl transition-all group relative"
                            onClick={() => setIsEditing(true)}
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">When:</p>
                                </div>
                                <p className="text-sm text-gray-800 font-medium leading-relaxed">{data?.description}</p>
                                {data?.message && (
                                    <>
                                        <div className="flex items-center gap-1.5 mt-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Message:</p>
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed">{data?.message}</p>
                                    </>
                                )}
                            </div>
                            <Pencil className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3" />
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

// Custom Start Node Component
function StartCallNode({ data }: { data: StartCallNodeData }) {
    return (
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-xl border-2 border-emerald-700 min-w-[300px] hover:shadow-2xl transition-shadow">
            <div className="px-5 py-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2.5 text-white">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Phone className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-base tracking-wide">Start Call</span>
                </div>
                
                {/* Phone Number Selector */}
                <div className="bg-white rounded-lg shadow-sm">
                    <Select 
                        value={data.selectedPhoneNumberId} 
                        onValueChange={data.onPhoneNumberChange}
                    >
                        <SelectTrigger className="w-full border-0 focus:ring-2 focus:ring-emerald-300 h-10">
                            <SelectValue placeholder="Select phone number..." />
                        </SelectTrigger>
                        <SelectContent>
                            {data.phoneNumbers && data.phoneNumbers.length > 0 ? (
                                data.phoneNumbers.map((phoneNumber: PhoneNumber) => (
                                    <SelectItem 
                                        key={phoneNumber.id} 
                                        value={phoneNumber.id}
                                    >
                                        {phoneNumber.phone_number}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                    No phone numbers available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className="!bg-emerald-600 !w-4 !h-4 !border-2 !border-white hover:!w-5 hover:!h-5 transition-all cursor-pointer" 
            />
        </div>
    );
}

// Custom Agent Node Component
function AgentNode({ data }: { data: AgentNodeData }) {
    return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 min-w-[260px] hover:shadow-xl hover:border-blue-400 transition-all group relative">
            <Handle 
                type="target" 
                position={Position.Top} 
                className="!bg-blue-500 !w-3.5 !h-3.5 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all" 
            />
            <div className="px-5 py-5 relative">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{data.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">AI Agent</p>
                    </div>
                </div>
                <Link 
                    href={`/app/agents/${data.agentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nodrag nopan absolute top-1/2 -translate-y-1/2 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 flex items-center justify-center bg-blue-50/40 hover:bg-blue-100/70 text-blue-600 border border-blue-200/40 hover:border-blue-300/60 rounded-lg transition-all group/btn"
                    >
                        <ExternalLink className="w-4 h-4 opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
                    </Button>
                </Link>
            </div>
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className="!bg-blue-500 !w-3.5 !h-3.5 !border-2 !border-white hover:!w-4 hover:!h-4 transition-all" 
            />
        </div>
    );
}

const nodeTypes = {
    startCall: StartCallNode,
    agent: AgentNode,
};

const edgeTypes = {
    custom: CustomEdge,
    simple: SimpleEdge,
};

const initialEdges: any[] = [];

interface OrchestrateProps {
    orchestrationId: string;
    agents: any[];
    phoneNumbers: PhoneNumber[];
    workflow: any;
}

export default function Orchestrate({ orchestrationId, agents, phoneNumbers, workflow }: OrchestrateProps) {
    const router = useRouter();
    
    const [orchestrationName, setOrchestrationName] = useState(workflow?.name || "Untitled Orchestration");
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Find the phone number assigned to this workflow (if any)
    const assignedPhoneNumber = phoneNumbers.find(p => p.workflow_id === orchestrationId);
    const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState<string | undefined>(
        assignedPhoneNumber?.id
    );

    // Track initial state for change detection
    const initialStateRef = useRef({
        name: workflow?.name || "Untitled Orchestration",
        phoneNumberId: assignedPhoneNumber?.id,
        nodesCount: 0,
        edgesCount: 0,
        edgesData: [] as any[],
        isInitialized: false
    });

    const handlePhoneNumberChange = useCallback((phoneNumberId: string) => {
        setSelectedPhoneNumberId(phoneNumberId);
        setHasUnsavedChanges(true);
    }, []);

    const handleEdgeDescriptionSave = useCallback((edgeId: string, description: string, message: string) => {
        setEdges((edges) =>
            edges.map((edge) =>
                edge.id === edgeId
                    ? { ...edge, data: { ...edge.data, description, message } }
                    : edge
            )
        );
        // No need to manually set hasUnsavedChanges - the useEffect will detect the edge data change
    }, []);

    // Initialize nodes with phone number data
    const initialNodesWithData = useMemo(() => [
        { 
            id: 'start', 
            position: { x: 250, y: 50 }, 
            data: { 
                phoneNumbers,
                selectedPhoneNumberId,
                onPhoneNumberChange: handlePhoneNumberChange
            },
            type: 'startCall',
        },
    ], [phoneNumbers, selectedPhoneNumberId, handlePhoneNumberChange]);

    const [nodes, setNodes] = useState<any[]>(initialNodesWithData);
    const [edges, setEdges] = useState<any[]>(initialEdges);

    // Function to load and layout workflow data
    const loadWorkflowData = useCallback(() => {
        if (!workflow?.data?.members || workflow.data.members.length === 0) {
            return;
        }

        const loadedNodes: any[] = [initialNodesWithData[0]]; // Keep the start node
        const loadedEdges: any[] = [];
        
        // Build a map of agent platform_id to agent data
        const agentMap = new Map(agents.map(a => [a.platform_id, a]));
        
        // Layout configuration - generous spacing to prevent overlapping!
        const nodeWidth = 280;
        const nodeHeight = 120;
        const verticalSpacing = 350;   // Much more vertical space between levels
        const horizontalSpacing = 450; // Much more horizontal space between nodes
        const startX = 600;            // Start further right
        const startY = 300;            // Start further down
        
        // Build adjacency list (who points to whom)
        const graph = new Map<string, string[]>();
        workflow.data.members.forEach((member: any) => {
            if (!graph.has(member.assistantId)) {
                graph.set(member.assistantId, []);
            }
            if (member.assistantDestinations) {
                member.assistantDestinations.forEach((dest: any) => {
                    const targetAgent = agents.find(a => a.data?.name === dest.assistantName);
                    if (targetAgent) {
                        const targets = graph.get(member.assistantId) || [];
                        targets.push(targetAgent.platform_id);
                        graph.set(member.assistantId, targets);
                    }
                });
            }
        });
        
        // Find the first member (one that should connect to start)
        const allTargets = new Set<string>();
        graph.forEach(targets => targets.forEach(t => allTargets.add(t)));
        const potentialFirstMembers = workflow.data.members.filter(
            (m: any) => !allTargets.has(m.assistantId)
        );
        
        let firstMemberId: string | null = null;
        if (potentialFirstMembers.length > 0) {
            firstMemberId = potentialFirstMembers[0].assistantId;
        }
        
        // Calculate positions using a level-based layout
        const positions = new Map<string, { x: number; y: number }>();
        const levels = new Map<string, number>();
        
        // Assign levels using BFS from first member
        if (firstMemberId) {
            const queue = [{ id: firstMemberId, level: 0 }];
            const visited = new Set<string>();
            
            while (queue.length > 0) {
                const { id, level } = queue.shift()!;
                if (visited.has(id)) continue;
                
                visited.add(id);
                levels.set(id, level);
                
                const targets = graph.get(id) || [];
                targets.forEach(targetId => {
                    if (!visited.has(targetId)) {
                        queue.push({ id: targetId, level: level + 1 });
                    }
                });
            }
        }
        
        // Group nodes by level
        const nodesByLevel = new Map<number, string[]>();
        levels.forEach((level, nodeId) => {
            if (!nodesByLevel.has(level)) {
                nodesByLevel.set(level, []);
            }
            nodesByLevel.get(level)!.push(nodeId);
        });
        
        // Calculate positions for each level - spread nodes out more evenly
        nodesByLevel.forEach((nodesInLevel, level) => {
            // Calculate total width needed for this level
            const totalWidth = nodesInLevel.length * nodeWidth + (nodesInLevel.length - 1) * horizontalSpacing;
            
            // Center the level horizontally
            let startXForLevel;
            if (nodesInLevel.length === 1) {
                // Single node - center it
                startXForLevel = startX - nodeWidth / 2;
            } else {
                // Multiple nodes - spread them out evenly
                startXForLevel = startX - totalWidth / 2;
            }
            
            nodesInLevel.forEach((nodeId, index) => {
                const x = startXForLevel + index * (nodeWidth + horizontalSpacing);
                const y = startY + level * verticalSpacing;
                positions.set(nodeId, { x, y });
            });
        });
        
        // Create nodes with calculated positions
        workflow.data.members.forEach((member: any) => {
            const agent = agentMap.get(member.assistantId);
            if (!agent) return;
            
            const position = positions.get(member.assistantId) || { 
                x: startX, 
                y: startY + loadedNodes.length * verticalSpacing 
            };
            
            loadedNodes.push({
                id: agent.id,
                position,
                type: 'agent',
                data: { 
                    label: agent.data?.name,
                    agentId: agent.id
                },
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
            });
        });
        
        // Create edges
        let hasStartEdge = false;
        workflow.data.members.forEach((member: any) => {
            const agent = agentMap.get(member.assistantId);
            if (!agent) return;
            
            // Create edge from start to first member
            if (!hasStartEdge && member.assistantId === firstMemberId) {
                loadedEdges.push({
                    id: `start-${agent.id}`,
                    source: 'start',
                    target: agent.id,
                    type: 'simple',
                });
                hasStartEdge = true;
            }
            
            // Create edges for destinations
            if (member.assistantDestinations) {
                member.assistantDestinations.forEach((dest: any, destIndex: number) => {
                    const targetAgent = agents.find(a => a.data?.name === dest.assistantName);
                    if (targetAgent) {
                        loadedEdges.push({
                            id: `${agent.id}-${targetAgent.id}-${destIndex}`,
                            source: agent.id,
                            target: targetAgent.id,
                            type: 'custom',
                            data: {
                                description: dest.description || '',
                                message: dest.message || '',
                                onSave: handleEdgeDescriptionSave,
                            }
                        });
                    }
                });
            }
        });
        
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        
        // Update initial state after loading workflow data
        initialStateRef.current = {
            name: workflow?.name || "Untitled Orchestration",
            phoneNumberId: assignedPhoneNumber?.id,
            nodesCount: loadedNodes.length,
            edgesCount: loadedEdges.length,
            edgesData: loadedEdges.map(e => ({ id: e.id, description: e.data?.description || '', message: e.data?.message || '' })),
            isInitialized: true
        };
    }, [workflow, agents, initialNodesWithData, handleEdgeDescriptionSave]);

    // Load existing workflow data on mount
    useEffect(() => {
        loadWorkflowData();
    }, [loadWorkflowData]);

    // Track changes to nodes and edges
    useEffect(() => {
        // Don't track changes until initial state is set
        if (!initialStateRef.current.isInitialized) {
            return;
        }

        // Check if edges data has changed
        const currentEdgesData = edges.map(e => ({ id: e.id, description: e.data?.description || '', message: e.data?.message || '' }));
        const edgesDataChanged = JSON.stringify(currentEdgesData) !== JSON.stringify(initialStateRef.current.edgesData);

        const hasChanges = 
            orchestrationName !== initialStateRef.current.name ||
            selectedPhoneNumberId !== initialStateRef.current.phoneNumberId ||
            nodes.length !== initialStateRef.current.nodesCount ||
            edges.length !== initialStateRef.current.edgesCount ||
            edgesDataChanged;

        setHasUnsavedChanges(hasChanges);
    }, [nodes, edges, orchestrationName, selectedPhoneNumberId]);

    // Update start node when phone number selection changes
    useEffect(() => {
        setNodes((currentNodes) => 
            currentNodes.map((node) => 
                node.id === 'start' 
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            selectedPhoneNumberId,
                            phoneNumbers,
                            onPhoneNumberChange: handlePhoneNumberChange
                        }
                    }
                    : node
            )
        );
    }, [selectedPhoneNumberId, phoneNumbers, handlePhoneNumberChange]);

    // Update edges when their data changes
    useEffect(() => {
        setEdges((currentEdges) =>
            currentEdges.map((edge) => ({
                ...edge,
                data: {
                    ...edge.data,
                    onSave: handleEdgeDescriptionSave,
                }
            }))
        );
    }, [handleEdgeDescriptionSave]);

    const onNodesChange = useCallback(
      (changes: any) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
      [],
    );
    const onEdgesChange = useCallback(
      (changes: any) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
      [],
    );
    const onConnect = useCallback(
      (params: any) => {
        // Check if source is the start node
        if (params.source === 'start') {
          // Check if there's already an edge from the start node
          const existingStartEdge = edges.find((edge) => edge.source === 'start');
          if (existingStartEdge) {
            // Don't allow multiple edges from start node
            return;
          }
          // Create a simple edge (no condition) for start node
          const newEdge = {
            ...params,
            type: 'simple',
          };
          setEdges((edgesSnapshot) => addEdge(newEdge, edgesSnapshot));
        } else {
          // Create a custom edge (with condition) for other nodes
          const newEdge = {
            ...params,
            type: 'custom',
            data: { onSave: handleEdgeDescriptionSave, description: '', message: '' }
          };
          setEdges((edgesSnapshot) => addEdge(newEdge, edgesSnapshot));
        }
        setHasUnsavedChanges(true);
      },
      [handleEdgeDescriptionSave, edges],
    );

    // Get agents that aren't already in the flow
    const availableAgents = useMemo(() => {
      return agents.filter((agent) => !nodes.some((node) => node.id === agent.id));
    }, [agents, nodes]);

    const addNode = useCallback(
      (node: any) => setNodes((nodesSnapshot) => [...nodesSnapshot, node]),
      [],
    );

    const onAddAgent = useCallback(
      (agentId: string) => {
        const agent = agents.find((agent) => agent.id === agentId);
        if (agent) {
          const newNode = { 
            id: agentId, 
            position: { x: 300 + (nodes.length - 1) * 350, y: 500 }, 
            type: 'agent',
            data: { 
              label: agent.data?.name,
              agentId: agent.id
            },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          };
          addNode(newNode);
          setHasUnsavedChanges(true);
        }
      },
      [agents, addNode, nodes],
    );

    const startEditingName = useCallback(() => {
      setTempName(orchestrationName);
      setIsEditingName(true);
    }, [orchestrationName]);

    const confirmNameChange = useCallback(() => {
      if (tempName.trim() && tempName.trim() !== orchestrationName) {
        setOrchestrationName(tempName.trim());
        setHasUnsavedChanges(true);
      }
      setIsEditingName(false);
    }, [tempName, orchestrationName]);

    const cancelNameChange = useCallback(() => {
      setIsEditingName(false);
      setTempName("");
    }, []);

    // Focus input when editing starts
    useEffect(() => {
      if (isEditingName && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditingName]);

    const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        confirmNameChange();
      } else if (e.key === 'Escape') {
        cancelNameChange();
      }
    }, [confirmNameChange, cancelNameChange]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        const toastId = toast.loading('Saving workflow...');
        
        try {
            // Find the selected phone number
            const selectedPhoneNumber = phoneNumbers.find(p => p.id === selectedPhoneNumberId);
            
            // Find the edge from start node to get the first assistant
            const startEdge = edges.find(edge => edge.source === 'start');
            const firstAssistantId = startEdge?.target;

            // Build members array in Vapi squad format
            const members = nodes
                .filter(node => node.id !== 'start') // Exclude the start node
                .map(node => {
                    const agent = agents.find(a => a.id === node.id);
                    // Find all edges where this node is the source
                    const outgoingEdges = edges.filter(edge => edge.source === node.id);
                    
                    // Map to assistantDestinations
                    const assistantDestinations = outgoingEdges.map(edge => {
                        const targetAgent = agents.find(a => a.id === edge.target);
                        return {
                            type: 'assistant' as const,
                            assistantName: targetAgent?.data?.name || '',
                            description: edge.data?.description || '',
                            message: edge.data?.message || ''
                        };
                    });

                    return {
                        assistantId: agent?.platform_id || node.id, // Use Vapi platform_id
                        assistantDestinations
                    };
                });

            // Format the orchestration data in Vapi squad format
            const orchestrationData = {
                id: orchestrationId,
                name: orchestrationName,
                phoneNumber: selectedPhoneNumber?.phone_number || null,
                phoneNumberId: selectedPhoneNumberId || null,
                members
            };
            
            // Call the server action
            const result = await saveOrchestration(orchestrationId, orchestrationData);
            
            if (result.success) {
                toast.success('Workflow saved successfully!', { id: toastId });
                setHasUnsavedChanges(false);
                
                // Update initial state
                initialStateRef.current = {
                    name: orchestrationName,
                    phoneNumberId: selectedPhoneNumberId,
                    nodesCount: nodes.length,
                    edgesCount: edges.length,
                    edgesData: edges.map(e => ({ id: e.id, description: e.data?.description || '', message: e.data?.message || '' })),
                    isInitialized: true
                };
            } else {
                toast.error(result.error || 'Failed to save workflow. Please try again.', { id: toastId });
            }
        } catch (error) {
            console.error('Failed to save orchestration:', error);
            toast.error(
                error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
                { id: toastId }
            );
        } finally {
            setIsSaving(false);
        }
    }, [orchestrationId, orchestrationName, selectedPhoneNumberId, phoneNumbers, nodes, edges, agents]);

    const handleExit = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowExitDialog(true);
        } else {
            router.push('/app/agents');
        }
    }, [hasUnsavedChanges, router]);

    const handleExitWithSave = useCallback(async () => {
        setShowExitDialog(false);
        await handleSave();
        router.push('/app/agents');
    }, [handleSave, router]);

    const handleExitWithoutSave = useCallback(() => {
        setShowExitDialog(false);
        router.push('/app/agents');
    }, [router]);

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-white border-b-2 border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    {/* <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                        <Workflow className="w-6 h-6 text-white" />
                    </div> */}
                    
                    {/* Editable Name */}
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <Input
                                ref={inputRef}
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                                onBlur={confirmNameChange}
                                className="text-2xl font-bold h-11 px-3 border-2 border-blue-500 focus:border-blue-600"
                                placeholder="Enter orchestration name"
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={confirmNameChange}
                                className="h-9 w-9 p-0 hover:bg-green-50"
                            >
                                <Check className="w-5 h-5 text-green-600" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {orchestrationName}
                            </h1>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={startEditingName}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                            >
                                <Pencil className="w-4 h-4 text-gray-500" />
                            </Button>
                        </div>
                    )}
                    
                    {/* Unsaved indicator */}
                    {hasUnsavedChanges && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Add Agent Dropdown */}
                    <Select 
                        value="" 
                        onValueChange={(value) => {
                            if (value) {
                                onAddAgent(value);
                            }
                        }}
                    >
                        <SelectTrigger className="w-[220px] h-10 border-2 hover:border-blue-400 transition-colors">
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <SelectValue placeholder="Add Agent to Flow" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {availableAgents.length > 0 ? (
                                availableAgents.map((agent) => (
                                    <SelectItem 
                                        key={agent.id} 
                                        value={agent.id}
                                    >
                                        {agent.data?.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                    All agents added to flow
                                </div>
                            )}
                        </SelectContent>
                    </Select>

                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-300" />

                    {/* Save Button */}
                    <Button 
                        variant="default" 
                        className="flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Workflow'}
                    </Button>

                    {/* Exit Button */}
                    <Button 
                        variant="outline" 
                        className="flex items-center gap-2 h-10 px-4 border-2 hover:bg-gray-50 transition-all"
                        onClick={handleExit}
                        disabled={isSaving}
                    >
                        <X className="w-4 h-4" />
                        Exit
                    </Button>
                </div>
            </div>

            {/* Flow Canvas */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                    }}
                    minZoom={0.2}
                    maxZoom={1.5}
                    className="bg-gradient-to-br from-gray-50 to-blue-50/30"
                >
                    <Background color="#cbd5e1" gap={20} size={1.5} />
                    <Controls className="!bg-white !border-2 !border-gray-200 !shadow-lg !rounded-lg" />
                    <MiniMap 
                        className="!bg-white !border-2 !border-gray-200 !shadow-lg !rounded-lg" 
                        nodeColor={(node) => {
                            if (node.type === 'startCall') return '#10b981';
                            if (node.type === 'agent') return '#3b82f6';
                            return '#e5e7eb';
                        }}
                        maskColor="rgba(240, 240, 255, 0.6)"
                    />
                </ReactFlow>
                <style jsx global>{`
                    .react-flow__handle {
                        width: 14px !important;
                        height: 14px !important;
                        border-width: 2px !important;
                        background: white !important;
                        transition: all 0.2s ease !important;
                    }
                    .react-flow__handle:hover {
                        width: 18px !important;
                        height: 18px !important;
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
                    }
                    .react-flow__node {
                        cursor: grab;
                    }
                    .react-flow__node:active {
                        cursor: grabbing;
                    }
                    .react-flow__edge-path {
                        transition: stroke 0.2s ease;
                    }
                    .react-flow__edge:hover .react-flow__edge-path {
                        stroke-width: 3 !important;
                    }
                    .react-flow__controls button {
                        border-bottom: 1px solid #e5e7eb !important;
                        transition: all 0.2s ease !important;
                    }
                    .react-flow__controls button:hover {
                        background: #f3f4f6 !important;
                    }
                    .react-flow__minimap {
                        border-radius: 0.5rem !important;
                    }
                `}</style>
            </div>

            {/* Exit Confirmation Dialog */}
            <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Save changes before exiting?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes to your workflow. Would you like to save them before exiting?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleExitWithoutSave}>
                            Exit without saving
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleExitWithSave} className="bg-blue-600 hover:bg-blue-700">
                            Save and exit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
