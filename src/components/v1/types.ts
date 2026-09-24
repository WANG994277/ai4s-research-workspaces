export type Role =
  | "researcher"
  | "analyst"
  | "leader"
  | "manager"
  | "decision"
  | "admin";
export type AssetType = "智能体" | "Skill" | "模型" | "数据集" | "方案模板";
export type TaskStatus =
  | "PLANNING"
  | "RUNNING"
  | "WAITING_HUMAN"
  | "WAITING_RESOURCE"
  | "PAUSED"
  | "FAILED"
  | "COMPLETED"
  | "CANCELLED";
export interface Profile {
  id: string;
  name: string;
  roles: Role[];
  projects: string[];
  managementProjects: string[];
  grants: string[];
}
export interface Share {
  id: string;
  targetSpace?: string;
  targetUser?: string;
  level: "只读" | "可引用" | "可复制" | "可协作";
  validTo: string;
  by: string;
  at: string;
}
export interface Scoped {
  id: string;
  name: string;
  ownerId: string;
  projectId: string;
  spaceId: string;
  visibility:
    | "PRIVATE"
    | "SPACE"
    | "PROJECT"
    | "PUBLIC"
    | "SHARED"
    | "COLLABORATIVE";
  shares: Share[];
  denied?: string[];
  updatedAt: string;
}
export interface Space {
  id: string;
  name: string;
  type: "PERSONAL" | "PROJECT" | "TOPIC";
  projectId: string;
  ownerId: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED" | "CLOSED";
  description: string;
  code: string;
  mapping: string;
  syncStatus: string;
  createdAt: string;
}
export interface Membership {
  id: string;
  userId: string;
  projectId: string;
  spaceId: string;
  role: "Space Admin" | "Topic Leader" | "Member" | "Asset Manager" | "Viewer";
  status: "active" | "removed";
  joinedAt: string;
}
export interface Project {
  id: string;
  name: string;
  code: string;
  owner: string;
  organization: string;
  discipline: string;
  status: string;
  start: string;
  end: string;
  major: boolean;
  syncStatus: string;
  syncTime: string;
}
export interface Version {
  id: string;
  number: string;
  description: string;
  at: string;
  by: string;
  status: string;
}
export interface Asset extends Scoped {
  type: AssetType;
  discipline: string;
  description: string;
  source: string;
  version: string;
  versions: Version[];
  publishStatus: string;
  lifecycle: string;
  availability: string;
  provider: string;
  tags: string[];
  input: string;
  output: string;
  limitations: string;
  validation: string;
  taskId?: string;
  sessionId?: string;
  artifactId?: string;
  stepId?: string;
  externalId?: string;
  dependencies: string[];
  schema: {
    name: string;
    label: string;
    type: "text" | "number" | "file" | "dataset";
    required: boolean;
  }[];
  longRunning?: boolean;
  sourceAssetId?: string;
}
export interface Tool extends Scoped {
  type: string;
  discipline: string;
  description: string;
  source: string;
  version: string;
  provider: string;
  tags: string[];
  availability: string;
  authorization: string;
  method: string;
  input: string;
  output: string;
  limitations: string;
  dependencies: string[];
  longRunning: boolean;
}
export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
}
export interface Session extends Scoped {
  messages: Message[];
  taskId?: string;
  favorite: boolean;
  archived: boolean;
  contextIds: string[];
  capabilityIds: string[];
}
export interface Step {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "waiting";
  resources: string[];
  outputIds: string[];
  reason?: string;
  startedAt?: string;
  completedAt?: string;
}
export interface Task extends Scoped {
  type: string;
  status: TaskStatus;
  progress?: number;
  steps: Step[];
  sessionIds: string[];
  contextIds: string[];
  capabilityIds: string[];
  participants: string[];
  next: string;
  reason: string;
  constraint: string;
  createdAt: string;
  completedAt?: string;
  runAt?: number;
}
export interface Decision {
  id: string;
  taskId: string;
  stepId: string;
  question: string;
  recommendation: string;
  reason: string;
  options: string[];
  assignee: string;
  status: "pending" | "decided";
  choice: string;
  at: string;
  by: string;
  experimentId?: string;
}
export interface Artifact extends Scoped {
  type: string;
  taskId: string;
  sessionId: string;
  stepId: string;
  version: string;
  status: string;
  content: string;
  references: string[];
  assetId?: string;
}
export interface Knowledge extends Scoped {
  type: string;
  discipline: string;
  description: string;
  authors: string;
  organization: string;
  source: string;
  date: string;
  keywords: string[];
  citationCount: number;
  language: string;
  fulltext: boolean;
  metadata: Record<string, string>;
  content: string;
  baseId: string;
  assetId?: string;
}
export interface Instrument {
  id: string;
  name: string;
  code: string;
  type: string;
  manufacturer: string;
  model: string;
  organization: string;
  lab: string;
  location: string;
  ownerId: string;
  contact: string;
  specs: string;
  connection: string;
  online: string;
  runtime: string;
  sharing: boolean;
  approval: boolean;
  rules: string;
  purpose: string;
  discipline: string;
  source: string;
  syncTime: string;
  visibleProjects: string[];
}
export interface Reservation {
  id: string;
  instrumentId: string;
  projectId: string;
  spaceId: string;
  ownerId: string;
  start: string;
  end: string;
  purpose: string;
  experimentId: string;
  note: string;
  status: string;
  records: string[];
}
export interface Experiment extends Scoped {
  taskId: string;
  purpose: string;
  requirements: string;
  content: string;
  executorId: string;
  instrumentId: string;
  priority: string;
  plannedStart: string;
  plannedEnd: string;
  status: string;
  records: string[];
  attachments: string[];
  result: string;
  resultType: string;
  resultAt: string;
  confirmedBy: string;
  exception: string;
  paused: boolean;
  progress: string;
}
export interface Material {
  id: string;
  name: string;
  type: string;
  specification: string;
  quantity: number;
  unit: string;
  location: string;
  threshold: number;
  managerId: string;
  records: {
    id: string;
    quantity: number;
    kind: string;
    experimentId: string;
    spaceId: string;
    userId: string;
    purpose: string;
    at: string;
  }[];
}
export interface Invocation {
  id: string;
  resourceId: string;
  spaceId: string;
  ownerId: string;
  input: string;
  status: string;
  startedAt: number;
  result: string;
  taskId?: string;
  artifactId?: string;
}
export interface State {
  schema: 1;
  userRoles?: Record<string, Role[]>;
  profileKey: string;
  extraRoles: Role[];
  spaceId: string;
  spaces: Space[];
  members: Membership[];
  projects: Project[];
  assets: Asset[];
  tools: Tool[];
  sessions: Session[];
  tasks: Task[];
  decisions: Decision[];
  artifacts: Artifact[];
  knowledge: Knowledge[];
  instruments: Instrument[];
  reservations: Reservation[];
  experiments: Experiment[];
  materials: Material[];
  invocations: Invocation[];
  favorites: Record<string, string[]>;
  drafts: Record<string, string>;
  pendingContext: Record<string, string[]>;
  pendingCapabilities: Record<string, string[]>;
  history: Record<
    string,
    {
      query: string;
      mode: string;
    }[]
  >;
  collections: {
    id: string;
    name: string;
    ids: string[];
    ownerId: string;
    spaceId: string;
  }[];
  audit: {
    id: string;
    action: string;
    objectId: string;
    userId: string;
    at: string;
  }[];
  requests: {
    id: string;
    objectId: string;
    userId: string;
    purpose: string;
    status: string;
  }[];
  rolePermissions: Record<string, string[]>;
}
