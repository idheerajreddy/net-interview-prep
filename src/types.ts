export type Difficulty = "easy" | "medium" | "hard";

export type ChoiceId = "a" | "b" | "c" | "d";

export type Choice = {
  id: ChoiceId;
  text: string;
};

export type DiagramNode = {
  id: string;
  label: string;
  detail?: string;
  x: number;
  y: number;
  kind: "switch" | "router" | "server" | "host" | "firewall" | "lb" | "cloud";
};

export type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  state?: "up" | "down" | "degraded";
};

export type TopologyDiagram = {
  kind: "topology";
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  note?: string;
};

export type SequenceStep = {
  from: string;
  to: string;
  label: string;
  bad?: boolean;
};

export type SequenceDiagram = {
  kind: "sequence";
  title: string;
  actors: string[];
  steps: SequenceStep[];
  note?: string;
};

export type Diagram = TopologyDiagram | SequenceDiagram;

export type Question = {
  id: string;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  exhibit?: string;
  diagram?: Diagram;
  choices: Choice[];
  answer: ChoiceId;
  explanation: string;
};

export type DayRecord = {
  date: string;
  questionIds: string[];
  answers: Record<string, string>;
  checked: string[];
  everFinished: boolean;
};

export type Store = {
  days: Record<string, DayRecord>;
};
