export type FlowNodeType = "start" | "message" | "choices" | "question" | "tag" | "handoff";

export type FlowNodeData = {
  text?: string;
  imageUrl?: string;
  options?: string[];
  buttonText?: string;
  saveAs?: string;
  tag?: string;
};

export type FlowNode = { id: string; type: FlowNodeType; position: { x: number; y: number }; data: FlowNodeData };
export type FlowEdge = { id: string; source: string; target: string; sourceHandle?: string | null };
