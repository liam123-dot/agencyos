'use client'

import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Controls, MiniMap, Handle, Position, BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Save, X, Pencil, Check, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { saveOrchestration } from "@/app/api/agents/orchestration/orchestrationActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2 }} />;
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
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
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
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2 }} />
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
                            className="h-8 w-8 p-0 rounded-full bg-white hover:bg-blue-50 border-2 border-blue-500 shadow-lg"
                            onClick={() => setIsEditing(true)}
                        >
                            <Plus className="w-4 h-4 text-blue-600" />
                        </Button>
                    ) : isEditing ? (
                        <div className="flex flex-col gap-2 bg-white rounded-lg shadow-lg border-2 border-blue-500 p-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600">When to transfer:</label>
                                <Input
                                    autoFocus
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., if they want to speak to sales"
                                    className="w-[280px] h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600">Transfer message:</label>
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., Transferring you to sales"
                                    className="w-[280px] h-8 text-sm"
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
                                    className="h-7 px-2 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    className="h-7 px-3 text-xs"
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2 max-w-[320px] cursor-pointer hover:border-blue-400 transition-colors group relative"
                            onClick={() => setIsEditing(true)}
                        >
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500">When:</p>
                                <p className="text-sm text-gray-700 font-medium">{data?.description}</p>
                                {data?.message && (
                                    <>
                                        <p className="text-xs text-gray-500 mt-2">Message:</p>
                                        <p className="text-sm text-gray-600">{data?.message}</p>
                                    </>
                                )}
                            </div>
                            <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" />
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
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg border-2 border-emerald-700 min-w-[280px]">
            <div className="px-4 py-3 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2 text-white">
                    <Phone className="w-5 h-5" />
                    <span className="font-semibold text-base">Start Call</span>
                </div>
                
                {/* Phone Number Selector */}
                <div className="bg-white rounded-md">
                    <Select 
                        value={data.selectedPhoneNumberId} 
                        onValueChange={data.onPhoneNumberChange}
                    >
                        <SelectTrigger className="w-full border-0 focus:ring-2 focus:ring-emerald-300">
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

const nodeTypes = {
    startCall: StartCallNode,
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
        edgesCount: 0
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
        setHasUnsavedChanges(true);
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
        
        // Layout configuration - generous spacing!
        const nodeWidth = 220;
        const nodeHeight = 100;
        const verticalSpacing = 300;   // Much more vertical space between levels
        const horizontalSpacing = 400; // Much more horizontal space between nodes
        const startX = 600;            // Start further right
        const startY = 250;            // Start further down
        
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
        
        // Calculate positions for each level
        nodesByLevel.forEach((nodesInLevel, level) => {
            const totalWidth = nodesInLevel.length * nodeWidth + (nodesInLevel.length - 1) * horizontalSpacing;
            const startXForLevel = startX - totalWidth / 2;
            
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
                data: { 
                    label: agent.data?.name
                },
                style: {
                    background: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
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
    }, [workflow, agents, initialNodesWithData, handleEdgeDescriptionSave]);

    // Load existing workflow data on mount
    useEffect(() => {
        loadWorkflowData();
    }, [loadWorkflowData]);

    // Track changes to nodes and edges
    useEffect(() => {
        if (initialStateRef.current.nodesCount === 0) {
            // Set initial counts after first load
            initialStateRef.current.nodesCount = nodes.length;
            initialStateRef.current.edgesCount = edges.length;
            return;
        }

        const hasChanges = 
            orchestrationName !== initialStateRef.current.name ||
            selectedPhoneNumberId !== initialStateRef.current.phoneNumberId ||
            nodes.length !== initialStateRef.current.nodesCount ||
            edges.length !== initialStateRef.current.edgesCount;

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
            position: { x: 250, y: 200 + (nodes.length - 1) * 100 }, 
            data: { 
              label: agent.data?.name
            },
            style: {
              background: '#ffffff',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '500',
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
                    edgesCount: edges.length
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
            const confirmExit = window.confirm(
                'You have unsaved changes. Do you want to save before exiting?'
            );
            
            if (confirmExit) {
                // Save first, then exit
                handleSave().then(() => {
                    router.push('/app/agents');
                });
            }
        } else {
            router.push('/app/agents');
        }
    }, [hasUnsavedChanges, handleSave, router]);

    return (
        <div className="w-full h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                    {/* Editable Name */}
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <Input
                                ref={inputRef}
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                                onBlur={confirmNameChange}
                                className="text-2xl font-semibold h-10 px-2"
                                placeholder="Enter orchestration name"
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={confirmNameChange}
                                className="h-8 w-8 p-0"
                            >
                                <Check className="w-4 h-4 text-green-600" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {orchestrationName}
                            </h1>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={startEditingName}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Pencil className="w-4 h-4 text-gray-500" />
                            </Button>
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
                        <SelectTrigger className="w-[200px]">
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <SelectValue placeholder="Add Agent" />
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
                    <div className="h-8 w-px bg-gray-200" />

                    {/* Save Button */}
                    <Button 
                        variant="default" 
                        className="flex items-center gap-2"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>

                    {/* Exit Button */}
                    <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
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
                    className="bg-gray-50"
                >
                    <Background color="#e5e7eb" gap={16} />
                    <Controls />
                    <MiniMap className="!bg-white !border-gray-200" />
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
                `}</style>
            </div>
        </div>
    )
}
