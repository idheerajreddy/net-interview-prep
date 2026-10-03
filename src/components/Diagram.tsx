import { useId } from "react";
import type { Diagram, DiagramNode, SequenceDiagram, TopologyDiagram } from "../types";

const WIDTH = 760;
const HEIGHT = 420;

function point(node: DiagramNode) {
  const padX = 78;
  const padY = 58;
  return {
    x: padX + (node.x / 100) * (WIDTH - padX * 2),
    y: padY + (node.y / 100) * (HEIGHT - padY * 2),
  };
}

function nodeRadius(node: DiagramNode) {
  if (node.kind === "cloud") return { rx: 62, ry: 34 };
  if (node.kind === "router") return { rx: 36, ry: 36 };
  if (node.kind === "server") return { rx: 64, ry: 26 };
  if (node.kind === "host") return { rx: 52, ry: 24 };
  if (node.kind === "firewall") return { rx: 54, ry: 26 };
  return { rx: 58, ry: 24 };
}

function Topology({ diagram }: { diagram: TopologyDiagram }) {
  const rawId = useId().replace(/:/g, "");
  const nodes = new Map(diagram.nodes.map((node) => [node.id, node]));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={describeTopology(diagram)}>
      <defs>
        <pattern id={`grid-${rawId}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1b3944" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="#10242b" />
      <rect width={WIDTH} height={HEIGHT} fill={`url(#grid-${rawId})`} />
      {diagram.edges.map((edge, index) => {
        const from = nodes.get(edge.from);
        const to = nodes.get(edge.to);
        if (!from || !to) return null;
        const a = point(from);
        const b = point(to);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const tone = edge.state === "down" ? "#ffb4a2" : edge.state === "degraded" ? "#f0c36a" : "#8fd0c4";
        return (
          <g key={`${edge.from}-${edge.to}-${index}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={tone}
              strokeWidth={edge.state === "down" ? 2.5 : 2}
              strokeDasharray={edge.state === "down" ? "7 6" : undefined}
            />
            {edge.state === "down" && (
              <g>
                <circle cx={mx} cy={my} r="9" fill="#10242b" stroke="#ffb4a2" />
                <path d={`M ${mx - 4} ${my - 4} l 8 8 M ${mx + 4} ${my - 4} l -8 8`} stroke="#ffb4a2" strokeWidth="1.6" />
              </g>
            )}
            {edge.label && (
              <g>
                <rect x={mx - edge.label.length * 3.6 - 8} y={my - 22} width={edge.label.length * 7.2 + 16} height="18" rx="4" fill="#10242b" stroke={tone} />
                <text x={mx} y={my - 9} textAnchor="middle" fill={tone} fontSize="12" fontFamily="IBM Plex Mono, ui-monospace, monospace">
                  {edge.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {diagram.nodes.map((node) => {
        const { x, y } = point(node);
        const { rx, ry } = nodeRadius(node);
        return (
          <g key={node.id}>
            {node.kind === "router" ? (
              <circle cx={x} cy={y} r={rx} fill="#16343c" stroke="#d5efe8" strokeWidth="2" />
            ) : node.kind === "cloud" ? (
              <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#16343c" stroke="#d5efe8" strokeWidth="2" />
            ) : (
              <rect
                x={x - rx}
                y={y - ry}
                width={rx * 2}
                height={ry * 2}
                rx={node.kind === "firewall" ? 4 : 10}
                fill={node.kind === "firewall" ? "#2a241c" : "#16343c"}
                stroke={node.kind === "firewall" ? "#f0c36a" : "#d5efe8"}
                strokeWidth="2"
              />
            )}
            <text x={x} y={y + 4} textAnchor="middle" fill="#f4fffc" fontSize="13" fontFamily="Outfit, sans-serif" fontWeight="600">
              {node.label}
            </text>
            {node.detail && (
              <g>
                <rect
                  x={x - node.detail.length * 3.7 - 8}
                  y={y + ry + 6}
                  width={node.detail.length * 7.4 + 16}
                  height={18}
                  rx={5}
                  fill="#10242b"
                />
                <text
                  x={x}
                  y={y + ry + 19}
                  textAnchor="middle"
                  fill="#b7ddd4"
                  fontSize="12"
                  fontFamily="IBM Plex Mono, ui-monospace, monospace"
                >
                  {node.detail}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Sequence({ diagram }: { diagram: SequenceDiagram }) {
  const width = 760;
  const top = 54;
  const row = 64;
  const height = top + diagram.steps.length * row + 28;
  const column = width / (diagram.actors.length + 1);

  const xOf = (actor: string) => {
    const index = diagram.actors.indexOf(actor);
    return column * (index + 1);
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={describeSequence(diagram)}>
      <rect width={width} height={height} fill="#10242b" />
      {diagram.actors.map((actor) => (
        <g key={actor}>
          <text x={xOf(actor)} y="28" textAnchor="middle" fill="#f4fffc" fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="600">
            {actor}
          </text>
          <line x1={xOf(actor)} y1="40" x2={xOf(actor)} y2={height - 16} stroke="#3e6570" strokeDasharray="4 6" />
        </g>
      ))}
      {diagram.steps.map((step, index) => {
        const y = top + index * row;
        const x1 = xOf(step.from);
        const x2 = xOf(step.to);
        const tone = step.bad ? "#ffb4a2" : "#8fd0c4";
        const direction = x2 >= x1 ? 1 : -1;
        return (
          <g key={`${step.label}-${index}`}>
            <line x1={x1} y1={y} x2={x2 - direction * 10} y2={y} stroke={tone} strokeWidth="2" />
            <polygon
              points={`${x2},${y} ${x2 - direction * 10},${y - 5} ${x2 - direction * 10},${y + 5}`}
              fill={tone}
            />
            <text x={(x1 + x2) / 2} y={y - 10} textAnchor="middle" fill={tone} fontSize="13" fontFamily="IBM Plex Mono, ui-monospace, monospace">
              {step.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function describeTopology(diagram: TopologyDiagram) {
  const nodes = diagram.nodes
    .map((node) => `${node.label}${node.detail ? ` (${node.detail})` : ""}`)
    .join(", ");
  const links = diagram.edges
    .map((edge) => {
      const state = edge.state === "down" ? " down" : edge.state === "degraded" ? " degraded" : "";
      const label = edge.label ? ` labeled ${edge.label}` : "";
      return `${edge.from} to ${edge.to}${label}${state}`;
    })
    .join("; ");
  return `${diagram.title}. Nodes: ${nodes}. Links: ${links}. ${diagram.note ?? ""}`;
}

function describeSequence(diagram: SequenceDiagram) {
  const steps = diagram.steps
    .map((step, index) => `${index + 1}. ${step.from} to ${step.to}: ${step.label}${step.bad ? " (marked wrong)" : ""}`)
    .join(" ");
  return `${diagram.title}. ${steps} ${diagram.note ?? ""}`;
}

export function DiagramFigure({ diagram }: { diagram: Diagram }) {
  return (
    <figure className="diagram">
      <figcaption>{diagram.title}</figcaption>
      {diagram.kind === "topology" ? <Topology diagram={diagram} /> : <Sequence diagram={diagram} />}
      {diagram.note && <p>{diagram.note}</p>}
    </figure>
  );
}
