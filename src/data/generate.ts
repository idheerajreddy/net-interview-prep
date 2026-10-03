import type { Difficulty, Question, SequenceDiagram, TopologyDiagram } from "../types";

const TARGET = { easy: 300, medium: 400, hard: 300 } as const;
const DIAGRAM_TARGET = { easy: 100, medium: 100, hard: 100 } as const;

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    throw new Error(`bad ip ${ip}`);
  }
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

function intToIp(value: number): string {
  const n = value >>> 0;
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function prefixMask(prefix: number): number {
  if (prefix < 0 || prefix > 32) throw new Error(`bad prefix ${prefix}`);
  if (prefix === 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

function networkAddress(ip: number, prefix: number): number {
  return (ip & prefixMask(prefix)) >>> 0;
}

function broadcastAddress(ip: number, prefix: number): number {
  if (prefix === 32) return ip >>> 0;
  const host = prefix === 0 ? 0xffffffff : (0xffffffff >>> prefix);
  return (networkAddress(ip, prefix) | host) >>> 0;
}

function usableCount(prefix: number): number {
  if (prefix === 32) return 1;
  if (prefix === 31) return 2;
  return 2 ** (32 - prefix) - 2;
}

function wildcard(prefix: number): string {
  return intToIp((~prefixMask(prefix)) >>> 0);
}

function isPrivate(ip: number): boolean {
  const first = ip >>> 24;
  const second = (ip >>> 16) & 255;
  if (first === 10) return true;
  if (first === 192 && second === 168) return true;
  return first === 172 && second >= 16 && second <= 31;
}

function isAligned(ip: string, prefix: number): boolean {
  const n = ipToInt(ip);
  return networkAddress(n, prefix) === n;
}

function maskToPrefix(mask: string): number {
  const n = ipToInt(mask);
  let bits = 0;
  for (let shift = 31; shift >= 0; shift -= 1) {
    if ((n >>> shift) & 1) bits += 1;
    else break;
  }
  if (prefixMask(bits) !== n) throw new Error(`non-contiguous mask ${mask}`);
  return bits;
}

function gcd(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

function ratioLabel(down: number, up: number): string {
  const divisor = gcd(down, up);
  return `${down / divisor}:${up / divisor}`;
}

function prefixForHosts(hosts: number): number {
  for (let prefix = 30; prefix >= 8; prefix -= 1) {
    if (usableCount(prefix) >= hosts) return prefix;
  }
  throw new Error(`no prefix fits ${hosts}`);
}

function overlaps(cidrA: string, cidrB: string): boolean {
  const a = parseCidr(cidrA);
  const b = parseCidr(cidrB);
  const len = Math.min(a.len, b.len);
  return networkAddress(a.net, len) === networkAddress(b.net, len);
}

function parseCidr(cidr: string): { net: number; len: number; text: string } {
  const [ip, lenText] = cidr.split("/");
  const len = Number(lenText);
  const net = networkAddress(ipToInt(ip), len);
  return { net, len, text: `${intToIp(net)}/${len}` };
}

function coveringPrefix(cidrA: string, cidrB: string): string {
  const a = parseCidr(cidrA);
  const b = parseCidr(cidrB);
  const start = Math.min(a.net, b.net);
  const end = Math.max(broadcastAddress(a.net, a.len), broadcastAddress(b.net, b.len));
  for (let len = 32; len >= 0; len -= 1) {
    const net = networkAddress(start, len);
    const bc = broadcastAddress(net, len);
    if (net <= start && bc >= end) return `${intToIp(net)}/${len}`;
  }
  throw new Error(`no cover for ${cidrA} ${cidrB}`);
}

function onLink(owner: string, peer: string): boolean {
  const [addr, lenText] = owner.split("/");
  const prefix = Number(lenText);
  return networkAddress(ipToInt(addr), prefix) === networkAddress(ipToInt(peer.split("/")[0]), prefix);
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function pickWrongs(id: string, correct: string, candidates: string[]): [string, string, string] {
  const wrongs: string[] = [];
  for (const candidate of candidates) {
    if (!candidate || candidate === correct || wrongs.includes(candidate)) continue;
    wrongs.push(candidate);
    if (wrongs.length === 3) return [wrongs[0], wrongs[1], wrongs[2]];
  }
  throw new Error(`${id} needs 3 distractors. correct=${correct}. have=${wrongs.join(" || ")}`);
}

function q(input: {
  id: string;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  correct: string;
  wrong: string[];
  explanation: string;
  exhibit?: string;
  diagram?: Question["diagram"];
}): Question {
  if (input.explanation.trim().length < 40) throw new Error(`short explanation ${input.id}`);
  const wrong = pickWrongs(input.id, input.correct, input.wrong);
  return {
    id: input.id,
    topic: input.topic,
    difficulty: input.difficulty,
    prompt: input.prompt,
    exhibit: input.exhibit,
    diagram: input.diagram,
    explanation: input.explanation,
    choices: [
      { id: "a", text: input.correct },
      { id: "b", text: wrong[0] },
      { id: "c", text: wrong[1] },
      { id: "d", text: wrong[2] },
    ],
    answer: "a",
  };
}

function fact(
  id: string,
  topic: string,
  difficulty: Difficulty,
  prompt: string,
  correct: string,
  wrong: [string, string, string],
  explanation: string,
  exhibit?: string,
): Question {
  return q({ id, topic, difficulty, prompt, correct, wrong: [...wrong], explanation, exhibit });
}

function selfTest() {
  const expect = (label: string, actual: string | number | boolean, wanted: string | number | boolean) => {
    if (actual !== wanted) throw new Error(`${label}: ${String(actual)} !== ${String(wanted)}`);
  };
  expect("usable24", usableCount(24), 254);
  expect("usable26", usableCount(26), 62);
  expect("usable30", usableCount(30), 2);
  expect("usable31", usableCount(31), 2);
  expect("net20", intToIp(networkAddress(ipToInt("172.16.5.40"), 20)), "172.16.0.0");
  expect("bc20", intToIp(broadcastAddress(ipToInt("172.16.5.40"), 20)), "172.16.15.255");
  expect("net26", intToIp(networkAddress(ipToInt("10.1.5.20"), 26)), "10.1.5.0");
  expect("bc26", intToIp(broadcastAddress(ipToInt("10.1.5.20"), 26)), "10.1.5.63");
  expect("net25", intToIp(networkAddress(ipToInt("192.168.1.130"), 25)), "192.168.1.128");
  expect("wild20", wildcard(20), "0.0.15.255");
  expect("wild26", wildcard(26), "0.0.0.63");
  expect("sum23", coveringPrefix("10.1.4.0/24", "10.1.5.0/24"), "10.1.4.0/23");
  expect("sum22", coveringPrefix("10.1.5.0/24", "10.1.6.0/24"), "10.1.4.0/22");
  expect("mask22", maskToPrefix("255.255.252.0"), 22);
  expect("hosts300", prefixForHosts(300), 23);
  expect("hosts50", prefixForHosts(50), 26);
  expect("ov1", overlaps("10.0.0.0/8", "10.1.0.0/24"), true);
  expect("ov0", overlaps("10.1.0.0/24", "10.2.0.0/24"), false);
  expect("align", isAligned("10.4.0.64", 26), true);
  expect("unalign", isAligned("10.4.0.50", 26), false);
  expect("priv", isPrivate(ipToInt("172.31.255.255")), true);
  expect("pub", isPrivate(ipToInt("172.32.0.1")), false);
  expect("vxlan", 20 + 8 + 8 + 14 + 1500, 1550);
}

function boundaryQuestion(
  id: string,
  difficulty: Difficulty,
  ip: string,
  prefix: number,
  kind: "network" | "broadcast" | "first" | "last",
): Question {
  const addr = ipToInt(ip);
  const net = networkAddress(addr, prefix);
  const bc = broadcastAddress(addr, prefix);
  const first = (net + 1) >>> 0;
  const last = (bc - 1) >>> 0;
  const values = {
    network: intToIp(net),
    broadcast: intToIp(bc),
    first: intToIp(first),
    last: intToIp(last),
  };
  const labels = {
    network: "network address",
    broadcast: "broadcast address",
    first: "first usable host",
    last: "last usable host",
  };
  return q({
    id,
    topic: "Subnetting",
    difficulty,
    prompt: `What is the ${labels[kind]} of ${ip}/${prefix}?`,
    correct: values[kind],
    wrong: [values.network, values.broadcast, values.first, values.last, ip, intToIp((net + 2) >>> 0)],
    explanation: `${ip}/${prefix} covers ${intToIp(net)} through ${intToIp(bc)}. A /${prefix} contains ${fmt(2 ** (32 - prefix))} addresses. The network address has the host bits cleared (${intToIp(net)}), and the broadcast has them set (${intToIp(bc)}). Usable hosts are ${intToIp(first)} through ${intToIp(last)}.`,
  });
}

function easyTextPool(): Question[] {
  const out: Question[] = [];
  const facts: Question[] = [
    fact("g-e-bits-v4", "Addressing", "easy", "How many bits are in an IPv4 address?", "32", ["16", "48", "128"], "An IPv4 address is 32 bits, written as four octets. An IPv6 address is 128 bits. A MAC address is 48 bits."),
    fact("g-e-bits-v6", "Addressing", "easy", "How many bits are in an IPv6 address?", "128", ["32", "64", "48"], "IPv6 addresses are 128 bits. That is why a /64, the usual subnet size, still leaves 64 bits for the interface identifier."),
    fact("g-e-bits-mac", "Ethernet", "easy", "How many bits are in a MAC address?", "48", ["32", "64", "128"], "A MAC address is 48 bits, usually written as six octets. The first 24 bits are often the vendor OUI. It is rewritten at every router hop."),
    fact("g-e-v4-header", "IP", "easy", "What is the minimum size of an IPv4 header, with no options?", "20 bytes", ["8 bytes", "40 bytes", "14 bytes"], "The base IPv4 header is 20 bytes. Options can extend it. An Ethernet header is 14 bytes before the payload, and a minimum TCP header is also 20 bytes."),
    fact("g-e-tcp-header", "TCP", "easy", "What is the minimum size of a TCP header, with no options?", "20 bytes", ["8 bytes", "40 bytes", "14 bytes"], "A TCP header is 20 bytes before options. UDP is 8 bytes. Together with the 20-byte IPv4 header, that is why a 1500-byte MTU usually yields a 1460-byte MSS."),
    fact("g-e-udp-header", "UDP", "easy", "How big is a UDP header?", "8 bytes", ["20 bytes", "14 bytes", "40 bytes"], "UDP is source port, destination port, length, and checksum: 8 bytes. It adds no handshake, retransmission, or congestion control."),
    fact("g-e-mtu-1500", "MTU", "easy", "What is the usual IP MTU on a standard Ethernet interface?", "1500 bytes", ["1518 bytes", "9000 bytes", "576 bytes"], "1500 is the largest IP packet a standard Ethernet interface sends. 1518 is the frame on the wire including the Ethernet header and FCS. 9000 is a common jumbo MTU, not the default."),
    fact("g-e-port-bits", "Transport", "easy", "How many bits wide is a TCP or UDP port number?", "16", ["8", "32", "12"], "Port numbers are 16 bits, so they run from 0 to 65535. That is independent of the IPv4 or IPv6 address beside them."),
    fact("g-e-vlan-bits", "VLANs", "easy", "How many bits wide is an 802.1Q VLAN ID?", "12", ["8", "16", "24"], "The VLAN ID is 12 bits. 0 and 4095 are reserved, leaving 4094 usable VLANs. A VXLAN VNI is 24 bits, which is why overlays scale past 4094."),
    fact("g-e-vni-bits", "VXLAN", "easy", "How many bits is a VXLAN network identifier (VNI)?", "24", ["12", "16", "32"], "A VNI is 24 bits, about 16 million segments. A VLAN ID is only 12 bits. VXLAN carries the VNI in the overlay header, not in an 802.1Q tag on the underlay."),
    fact("g-e-ping", "ICMP", "easy", "What protocol does the ping command use?", "ICMP echo request and echo reply", ["TCP port 7", "UDP port 53", "ARP"], "Ping is ICMP. It does not use a TCP or UDP port. A failure of ping does not by itself prove that TCP to the host is broken, because ICMP is often filtered."),
    fact("g-e-loopback", "Addressing", "easy", "Which prefix is the IPv4 loopback range?", "127.0.0.0/8", ["169.254.0.0/16", "10.0.0.0/8", "224.0.0.0/4"], "127.0.0.0/8 stays on the host. 169.254.0.0/16 is link-local. 10.0.0.0/8 is RFC 1918 private space. 224.0.0.0/4 is multicast."),
    fact("g-e-link-local", "Addressing", "easy", "Which prefix is IPv4 link-local, used when a host has no DHCP address?", "169.254.0.0/16", ["127.0.0.0/8", "192.168.0.0/16", "100.64.0.0/10"], "169.254.0.0/16 is IPv4 link-local (APIPA). It is not RFC 1918 and it is not routed. 192.168.0.0/16 is private. 100.64.0.0/10 is carrier-grade NAT space."),
    fact("g-e-mcast", "Addressing", "easy", "Which IPv4 prefix is multicast?", "224.0.0.0/4", ["192.168.0.0/16", "127.0.0.0/8", "169.254.0.0/16"], "224.0.0.0 through 239.255.255.255 is IPv4 multicast. 224.0.0.0/24 is link-local multicast and is not forwarded by routers. Unicast private space is a different set of ranges."),
    fact("g-e-default", "Forwarding", "easy", "What prefix is the IPv4 default route?", "0.0.0.0/0", ["127.0.0.0/8", "255.255.255.255/32", "224.0.0.0/4"], "0.0.0.0/0 matches every address, but it is the shortest possible prefix, so any more specific route beats it. It is where packets go when nothing else matches."),
    fact("g-e-host-route", "Forwarding", "easy", "What does an IPv4 /32 route mean?", "A route to exactly one host address", ["A normal LAN with 254 usable hosts", "The default route", "A multicast group"], "A /32 has a single address and no separate network or broadcast. Loopbacks and BGP host routes are commonly /32. A normal LAN is wider, such as a /24."),
    fact("g-e-ttl", "IP", "easy", "What does a router do to the IPv4 TTL of a packet it forwards?", "Decrements it, and drops the packet if it hits zero", ["Leaves it unchanged end to end", "Sets it to the MTU", "Rewrites it to the destination port"], "TTL is a hop limit. Each router decrements it and sends ICMP Time Exceeded if it reaches zero. That is what traceroute uses. The IP addresses stay the same unless NAT changes them."),
    fact("g-e-arp-bcast", "ARP", "easy", "How is an ARP request delivered on a LAN?", "As a broadcast, asking who owns an IPv4 address", ["As a unicast to the default gateway only", "As a TCP connection to port 67", "As a DNS query"], "The sender does not yet know the MAC, so the ARP request is a broadcast on the local VLAN. The owner answers unicast. Hosts off the subnet are not ARPed for directly; the gateway is."),
    fact("g-e-tcp-conn", "TCP", "easy", "Which statement describes TCP?", "It is connection-oriented and retransmits lost data.", ["It is a best-effort datagram protocol with no handshake.", "It discovers MAC addresses.", "It selects BGP routes."], "TCP sets up a connection, acknowledges data, retransmits losses, and controls congestion. UDP does not. Interviews want that contrast, not 'TCP is faster.'"),
    fact("g-e-udp-conn", "UDP", "easy", "Which statement describes UDP?", "It sends datagrams with no handshake and no retransmission.", ["It guarantees in-order delivery.", "It is the protocol BGP uses for its session.", "It fragments Ethernet frames."], "UDP is connectionless. The application has to decide what to do about loss and ordering. BGP rides on TCP, not UDP. DNS queries and many real-time flows use UDP."),
    fact("g-e-port-22", "Ports", "easy", "SSH uses which well-known TCP port?", "22", ["23", "443", "3389"], "SSH is TCP 22. Telnet is 23. HTTPS is 443. RDP is 3389. Knowing the port matters when you read an ACL or a packet capture."),
    fact("g-e-port-53", "Ports", "easy", "DNS queries are typically sent to which port?", "53", ["67", "123", "179"], "DNS uses port 53, UDP for ordinary queries and TCP when the response is large or for zone transfers. DHCP is 67/68. NTP is 123. BGP is 179."),
    fact("g-e-port-80", "Ports", "easy", "Unencrypted HTTP uses which TCP port?", "80", ["443", "8080 only", "22"], "HTTP is TCP 80. HTTPS is 443. 8080 is a common alternate, not the well-known port. An interview ACL question will use this without defining it."),
    fact("g-e-port-179", "Ports", "easy", "BGP sessions use which TCP port?", "179", ["89", "520", "4789"], "BGP is TCP 179. OSPF is IP protocol 89, not a TCP port. RIP is UDP 520. VXLAN is UDP 4789. The TCP session is why BGP can carry a large table without its own retransmission."),
    fact("g-e-port-4789", "Ports", "easy", "The IANA UDP port for VXLAN is:", "4789", ["8472, which is the only legal port", "179", "4788"], "IANA assigned UDP 4789. Some early implementations used 8472, so you may still see it, but 4789 is the standard. Both ends must agree or the overlay never comes up."),
    fact("g-e-cgnat", "Addressing", "easy", "100.64.0.0/10 is which kind of address space?", "Shared address space for carrier-grade NAT, not RFC 1918", ["RFC 1918 private space, like 10.0.0.0/8", "IPv4 multicast", "Documentation space, like 192.0.2.0/24"], "RFC 6598 reserved 100.64.0.0/10 for carrier-grade NAT. It is not one of the three RFC 1918 ranges, and it is not a range you should announce on the public internet."),
    fact("g-e-doc-prefix", "Addressing", "easy", "Which prefix is reserved for documentation examples?", "192.0.2.0/24", ["192.168.0.0/24", "172.16.0.0/24", "10.0.0.0/24"], "192.0.2.0/24, 198.51.100.0/24, and 203.0.113.0/24 are TEST-NET documentation prefixes (RFC 5737). 192.168.0.0/24 is ordinary private space and is used in real networks."),
    fact("g-e-full-duplex", "Ethernet", "easy", "On full-duplex Ethernet, which statement is true?", "A link can send and receive at the same time, and CSMA/CD is not used.", ["Collisions are how the two ends share the wire.", "Only one VLAN is allowed.", "The MTU is forced to 576."], "Full duplex gives each direction its own path, so there is no collision domain to manage. CSMA/CD belongs to half-duplex shared media. Modern switch ports are full duplex."),
    fact("g-e-unknown-unicast", "Switching", "easy", "What does a switch do with a unicast frame whose destination MAC is not in the table?", "Floods it out of the other ports in the VLAN", ["Drops it until the host sends a gratuitous ARP", "Sends it to the default gateway", "Returns it to the sender as ICMP"], "Unknown unicast is flooded in the VLAN. The switch learns the source MAC as frames arrive, so the next frame to that host can be forwarded out one port. A router does not do this; it uses IP."),
  ];

  out.push(...facts);

  for (const prefix of [8, 9, 10, 12, 16, 18, 20, 21, 22, 23, 25, 27, 28, 29, 30]) {
    const good = usableCount(prefix);
    const total = 2 ** (32 - prefix);
    out.push(q({
      id: `g-e-usable-${prefix}`,
      topic: "Subnetting",
      difficulty: "easy",
      prompt: `How many usable host addresses are in a normal IPv4 /${prefix}?`,
      correct: fmt(good),
      wrong: [fmt(total), fmt(total - 1), fmt(usableCount(prefix === 30 ? 29 : prefix + 1)), fmt(Math.floor(good / 2))],
      explanation: `A /${prefix} has 2^(32−${prefix}) = ${fmt(total)} addresses. The network and broadcast addresses are reserved on a normal subnet, so ${fmt(good)} remain for hosts. A /31 is the exception used on point-to-point links, where both addresses are hosts.`,
    }));
  }

  const easyBoundaries: [string, number][] = [
    ["10.5.6.7", 24], ["10.5.6.7", 16], ["172.16.8.9", 16], ["192.168.4.20", 24],
    ["10.20.30.40", 8], ["192.168.50.2", 24], ["10.9.8.7", 24], ["172.20.1.1", 16],
    ["10.1.2.3", 8], ["192.168.100.100", 24], ["10.40.1.9", 16], ["172.18.2.2", 16],
    ["10.7.7.7", 24], ["192.168.2.250", 24], ["10.12.13.14", 16], ["172.25.9.9", 24],
  ];
  easyBoundaries.forEach(([ip, prefix], index) => {
    out.push(boundaryQuestion(`g-e-net-${index}`, "easy", ip, prefix, "network"));
    if (index < 8) out.push(boundaryQuestion(`g-e-bc-${index}`, "easy", ip, prefix, "broadcast"));
  });

  const inside: [string, number, string][] = [
    ["10.4.0.0", 16, "10.4.9.9"],
    ["10.8.0.0", 16, "10.8.255.10"],
    ["172.16.0.0", 16, "172.16.40.2"],
    ["192.168.10.0", 24, "192.168.10.50"],
    ["10.1.1.0", 24, "10.1.1.200"],
    ["10.50.0.0", 16, "10.50.1.1"],
    ["172.20.5.0", 24, "172.20.5.5"],
    ["10.9.9.0", 24, "10.9.9.90"],
  ];
  inside.forEach(([net, prefix, host], index) => {
    const netInt = ipToInt(net);
    const bc = broadcastAddress(netInt, prefix);
    out.push(q({
      id: `g-e-inside-${index}`,
      topic: "Subnetting",
      difficulty: "easy",
      prompt: `Which address is inside ${net}/${prefix}?`,
      correct: host,
      wrong: [intToIp((bc + 1) >>> 0), intToIp((netInt - 1) >>> 0), intToIp(netInt ^ 0x01000000)],
      explanation: `${net}/${prefix} runs from ${net} through ${intToIp(bc)}. ${host} sits in that range. The other choices fall in the next block, the previous block, or a different leading octet, so they need a router.`,
    }));
  });

  const privateSets = [
    ["10.1.1.1", "1.1.1.1", "8.8.8.8", "172.32.1.1"],
    ["192.168.0.1", "172.32.0.1", "11.0.0.1", "9.9.9.9"],
    ["172.16.0.1", "172.32.5.5", "1.2.3.4", "100.64.0.1"],
    ["172.31.255.255", "172.32.0.1", "192.0.2.1", "198.51.100.1"],
    ["10.255.255.255", "11.0.0.1", "172.15.255.255", "192.169.0.1"],
    ["192.168.255.255", "172.32.255.255", "8.8.4.4", "1.0.0.1"],
    ["172.20.1.1", "172.15.1.1", "192.0.2.10", "203.0.113.5"],
    ["10.0.0.1", "11.1.1.1", "172.32.0.5", "192.169.1.1"],
  ];
  privateSets.forEach((set, index) => {
    const correct = set.find((ip) => isPrivate(ipToInt(ip)));
    const wrong = set.filter((ip) => ip !== correct);
    if (!correct || wrong.length !== 3 || wrong.some((ip) => isPrivate(ipToInt(ip)))) {
      throw new Error(`private set ${index}`);
    }
    out.push(q({
      id: `g-e-rfc1918-${index}`,
      topic: "Addressing",
      difficulty: "easy",
      prompt: `Which of these addresses is inside RFC 1918 private space: ${set.join(", ")}?`,
      correct,
      wrong,
      explanation: `RFC 1918 is 10.0.0.0/8, 172.16.0.0/12 (172.16 through 172.31), and 192.168.0.0/16. ${correct} is inside that space. 172.32.0.0 and above is not. 100.64.0.0/10 is CGNAT space, and 192.0.2.0/24 is documentation space.`,
    }));
  });

  const ports: [string, string, string, string, string][] = [
    ["HTTPS", "443", "80", "22", "8443"],
    ["SMTP", "25", "110", "143", "587 only"],
    ["NTP", "123", "161", "53", "179"],
    ["SNMP", "161", "162 only", "514", "123"],
    ["LDAP", "389", "636 only", "443", "53"],
    ["RDP", "3389", "22", "5900", "3388"],
    ["MySQL", "3306", "5432", "1433", "1521"],
    ["PostgreSQL", "5432", "3306", "6379", "27017"],
  ];
  ports.forEach(([name, correct, ...wrong], index) => {
    out.push(q({
      id: `g-e-svc-${index}`,
      topic: "Ports",
      difficulty: "easy",
      prompt: `Which port is the well-known port for ${name}?`,
      correct,
      wrong,
      explanation: `${name} is associated with port ${correct}. The others are real services too: knowing which is which is what lets you read an ACL or a flow log without looking each one up.`,
    }));
  });

  const splits: [number, number][] = [[24, 25], [24, 26], [24, 27], [24, 28], [24, 30], [16, 24], [16, 20], [20, 24], [22, 24], [8, 16], [23, 24], [25, 27]];
  splits.forEach(([parent, child], index) => {
    const count = 2 ** (child - parent);
    out.push(q({
      id: `g-e-split-${index}`,
      topic: "Subnetting",
      difficulty: "easy",
      prompt: `How many /${child} subnets fit in one /${parent}?`,
      correct: fmt(count),
      wrong: [fmt(count * 2), fmt(Math.max(1, count / 2)), fmt(count + 1), String(parent), String(child), fmt(child - parent)],
      explanation: `Each extra host bit you give to the prefix doubles the number of subnets. /${parent} to /${child} is ${child - parent} bits, so 2^${child - parent} = ${fmt(count)} subnets. This does not change how many hosts each smaller subnet has.`,
    }));
  });

  for (const hosts of [2, 6, 14, 20, 30, 50, 100, 200, 500, 1000]) {
    const prefix = prefixForHosts(hosts);
    out.push(q({
      id: `g-e-fit-${hosts}`,
      topic: "Subnetting",
      difficulty: "easy",
      prompt: `What is the smallest normal IPv4 prefix (largest prefix length) that has at least ${hosts} usable hosts? Reserve the network and broadcast addresses.`,
      correct: `/${prefix}`,
      wrong: [`/${prefix - 1}`, `/${prefix + 1}`, `/${prefix + 2}`, "/32"],
      explanation: `A /${prefix} has ${fmt(usableCount(prefix))} usable hosts, which covers ${hosts}. The next longer prefix is too small. Count 2^(32−prefix)−2, not the raw power of two. On a point-to-point link, a /31 can hold two hosts without a broadcast address, but that is not the normal reservation this question asks for.`,
    }));
  }

  const masks = ["255.255.255.0", "255.255.0.0", "255.0.0.0", "255.255.255.128", "255.255.255.192", "255.255.255.240", "255.255.254.0", "255.255.252.0"];
  masks.forEach((mask) => {
    const prefix = maskToPrefix(mask);
    out.push(q({
      id: `g-e-mask-${prefix}`,
      topic: "Subnetting",
      difficulty: "easy",
      prompt: `What prefix length is the subnet mask ${mask}?`,
      correct: `/${prefix}`,
      wrong: [`/${prefix - 1}`, `/${prefix + 1}`, `/${prefix + 2}`],
      explanation: `${mask} has ${prefix} leading one-bits, so it is a /${prefix}. Count the 255 octets as 8 bits each, then the leftover octet: 128 is one more bit, 192 is two, 240 is four, 252 is six, 254 is seven.`,
    }));
  });

  for (const prefix of [8, 12, 16, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]) {
    const hostBits = 32 - prefix;
    out.push(q({
      id: `g-e-hostbits-${prefix}`,
      topic: "Subnetting",
      difficulty: "easy",
      prompt: `How many host bits are in an IPv4 /${prefix}?`,
      correct: String(hostBits),
      wrong: [String(prefix), String(hostBits + 1), String(Math.max(1, hostBits - 1)), "32"],
      explanation: `The prefix length is the network bits. Host bits are 32 minus that length, so a /${prefix} has ${hostBits} host bits and ${fmt(2 ** hostBits)} addresses before you reserve network and broadcast.`,
    }));
    out.push(q({
      id: `g-e-total-${prefix}`,
      topic: "Subnetting",
      difficulty: "easy",
      prompt: `How many IPv4 addresses are in a /${prefix}, counting the network and broadcast addresses?`,
      correct: fmt(2 ** hostBits),
      wrong: [fmt(usableCount(prefix)), fmt(2 ** (hostBits + 1)), fmt(2 ** Math.max(1, hostBits - 1)), String(prefix), String(hostBits), "256"],
      explanation: `A /${prefix} has ${hostBits} host bits, so it contains 2^${hostBits} = ${fmt(2 ** hostBits)} addresses. Usable hosts are two fewer on a normal subnet. Interviews often want you to say which of those two numbers you mean.`,
    }));
  }

  const publicSets = [
    ["8.8.8.8", "10.1.1.1", "192.168.1.1", "172.16.1.1"],
    ["1.1.1.1", "10.255.0.1", "172.31.0.1", "192.168.255.1"],
    ["172.32.1.1", "172.16.1.1", "172.20.1.1", "172.31.9.9"],
    ["11.0.0.1", "10.0.0.1", "10.1.0.1", "10.255.255.1"],
    ["192.0.2.1", "192.168.0.1", "192.168.1.1", "10.2.2.2"],
    ["203.0.113.10", "10.9.9.9", "172.18.1.1", "192.168.9.9"],
    ["198.51.100.20", "172.25.1.1", "10.50.1.1", "192.168.50.1"],
    ["9.9.9.9", "10.9.9.9", "172.19.9.9", "192.168.9.1"],
  ];
  const morePorts: [string, string, string, string, string][] = [
    ["FTP control", "21", "20 only", "22", "23"],
    ["Telnet", "23", "22", "21", "25"],
    ["DNS", "53", "123", "161", "67"],
    ["DHCP server", "67", "68 only", "53", "123"],
    ["TFTP", "69", "21", "22", "161"],
    ["POP3", "110", "143", "25", "993"],
    ["IMAP", "143", "110", "993 only", "25"],
    ["Syslog", "514", "161", "123", "179"],
    ["LDAPS", "636", "389 only", "443", "993"],
    ["Microsoft SQL Server", "1433", "3306", "1521", "5432"],
    ["Redis", "6379", "27017", "5432", "3306"],
    ["BGP", "179", "89", "646", "4789"],
  ];
  morePorts.forEach(([name, correct, ...wrong], index) => {
    out.push(q({
      id: `g-e-svc2-${index}`,
      topic: "Ports",
      difficulty: "easy",
      prompt: `Which port is the well-known port for ${name}?`,
      correct,
      wrong,
      explanation: `${name} uses port ${correct}. The distractors are neighboring services you will see in the same ACL or capture: mixing them up is a common way to permit the wrong traffic.`,
    }));
  });

  for (const prefix of [8, 12, 16, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]) {
    out.push(q({
      id: `g-e-netbits-${prefix}`,
      topic: "Subnetting",
      difficulty: "easy",
      prompt: `How many network bits does an IPv4 /${prefix} have?`,
      correct: String(prefix),
      wrong: [String(32 - prefix), String(prefix + 1), String(Math.max(0, prefix - 1)), "32", String(prefix + 8)],
      explanation: `The number after the slash is the network-bit count. A /${prefix} has ${prefix} network bits and ${32 - prefix} host bits. Usable-host math starts from the host bits, not from the prefix length itself.`,
    }));
  }

  publicSets.forEach((set, index) => {
    const correct = set.find((ip) => !isPrivate(ipToInt(ip)));
    const wrong = set.filter((ip) => ip !== correct);
    if (!correct || wrong.length !== 3 || wrong.some((ip) => !isPrivate(ipToInt(ip)))) {
      throw new Error(`public set ${index}`);
    }
    out.push(q({
      id: `g-e-public-${index}`,
      topic: "Addressing",
      difficulty: "easy",
      prompt: `Which of these addresses is not RFC 1918 private space: ${set.join(", ")}?`,
      correct,
      wrong,
      explanation: `${correct} is outside 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. The others are private and will not be routed on the public internet. 172.32.0.0/16 looks close to the private block, but 172.16.0.0/12 stops at 172.31.255.255.`,
    }));
  });

  return out;
}

function threeHostDiagram(h1: string, h2: string, h3: string): TopologyDiagram {
  return {
    kind: "topology",
    title: "One VLAN, three hosts",
    nodes: [
      { id: "sw", label: "Switch", x: 50, y: 48, kind: "switch" },
      { id: "h1", label: "H1", detail: h1, x: 16, y: 14, kind: "host" },
      { id: "h2", label: "H2", detail: h2, x: 84, y: 14, kind: "host" },
      { id: "h3", label: "H3", detail: h3, x: 50, y: 86, kind: "host" },
    ],
    edges: [
      { from: "h1", to: "sw" },
      { from: "h2", to: "sw" },
      { from: "h3", to: "sw" },
    ],
  };
}

function pairQuestion(id: string, difficulty: Difficulty, hosts: [string, string, string]): Question {
  const [h1, h2, h3] = hosts;
  const odd = [
    onLink(h1, h2.split("/")[0]) && onLink(h2, h1.split("/")[0]) ? 0 : 3,
  ];
  const links = {
    "H1 and H2": onLink(h1, h2.split("/")[0]) && onLink(h2, h1.split("/")[0]),
    "H1 and H3": onLink(h1, h3.split("/")[0]) && onLink(h3, h1.split("/")[0]),
    "H2 and H3": onLink(h2, h3.split("/")[0]) && onLink(h3, h2.split("/")[0]),
  };
  const winners = Object.entries(links).filter(([, ok]) => ok).map(([name]) => name);
  if (winners.length !== 1) throw new Error(`${id} pair count ${winners.join(",")} ${odd.join()}`);
  const correct = `${winners[0]}. The other host is in a different subnet and has no router.`;
  const losers = Object.keys(links).filter((name) => name !== winners[0]);
  return q({
    id,
    topic: "Subnetting",
    difficulty,
    prompt: `H1 is ${h1}, H2 is ${h2}, and H3 is ${h3}. They are on one switch in the same VLAN. There is no router. Which pair can exchange packets?`,
    diagram: threeHostDiagram(h1, h2, h3),
    correct,
    wrong: [
      `${losers[0]}.`,
      `${losers[1]}.`,
      "All three. Sharing a switch means every IP can talk.",
    ],
    explanation: `Sharing a VLAN means they share a broadcast domain, not a subnet. ${winners[0]} number each other as on-link and can ARP directly. The remaining host is outside that prefix, so it looks for a gateway and there isn't one.`,
  });
}

function arpDiagram(onNet: boolean, sender: string, other: string, gateway: string): TopologyDiagram {
  if (onNet) {
    return {
      kind: "topology",
      title: "Same subnet as the gateway",
      nodes: [
        { id: "gw", label: "Gateway", detail: gateway, x: 50, y: 12, kind: "router" },
        { id: "sw", label: "Switch", x: 50, y: 48, kind: "switch" },
        { id: "src", label: "Sender", detail: sender, x: 18, y: 84, kind: "host" },
        { id: "dst", label: "Dest", detail: other, x: 82, y: 84, kind: "host" },
      ],
      edges: [
        { from: "gw", to: "sw" },
        { from: "src", to: "sw" },
        { from: "dst", to: "sw" },
      ],
    };
  }
  return {
    kind: "topology",
    title: "Destination past the gateway",
    nodes: [
      { id: "src", label: "Sender", detail: sender, x: 16, y: 70, kind: "host" },
      { id: "sw", label: "Switch", x: 42, y: 40, kind: "switch" },
      { id: "gw", label: "Gateway", detail: gateway, x: 68, y: 18, kind: "router" },
      { id: "dst", label: "Dest", detail: other, x: 88, y: 70, kind: "cloud" },
    ],
    edges: [
      { from: "src", to: "sw" },
      { from: "sw", to: "gw" },
      { from: "gw", to: "dst" },
    ],
    note: "The destination is not on the sender's subnet.",
  };
}

function spineDiagram(spines: number, down: number | null): TopologyDiagram {
  const nodes: TopologyDiagram["nodes"] = [];
  for (let index = 0; index < spines; index += 1) {
    const x = spines === 2 ? (index === 0 ? 28 : 72) : 8 + (84 / (spines - 1)) * index;
    nodes.push({ id: `s${index}`, label: `Spine ${index + 1}`, x, y: 12, kind: "switch" });
  }
  nodes.push(
    { id: "la", label: "Leaf A", x: 28, y: 70, kind: "switch" },
    { id: "lb", label: "Leaf B", x: 72, y: 70, kind: "switch" },
  );
  const edges: TopologyDiagram["edges"] = [];
  for (let index = 0; index < spines; index += 1) {
    edges.push({ from: "la", to: `s${index}`, state: down === index ? "down" : "up" });
    edges.push({ from: "lb", to: `s${index}` });
  }
  return {
    kind: "topology",
    title: down === null ? `${spines} equal spines` : `Spine ${down + 1} link down`,
    nodes,
    edges,
    note: down === null ? "Both leaves connect to every spine." : "The marked link is physically down.",
  };
}

function easyDiagramPool(): Question[] {
  const out: Question[] = [];
  for (let index = 0; index < 40; index += 1) {
    const third = 10 + index;
    const odd = (index % 3) + 1;
    const shared = `10.${third}.1`;
    const other = `10.${third}.2`;
    const hosts: [string, string, string] = [
      odd === 1 ? `${other}.4/24` : `${shared}.4/24`,
      odd === 2 ? `${other}.8/24` : `${shared}.8/24`,
      odd === 3 ? `${other}.12/24` : `${shared}.12/24`,
    ];
    out.push(pairQuestion(`g-e-pair-${index}`, "easy", hosts));
  }

  for (let index = 0; index < 24; index += 1) {
    const sender = `10.${index}.0.10/24`;
    const dest = `10.${index}.0.40/24`;
    const gateway = `10.${index}.0.1/24`;
    out.push(q({
      id: `g-e-arp-on-${index}`,
      topic: "ARP",
      difficulty: "easy",
      prompt: `The sender ${sender} is about to IP-packet ${dest}. The gateway is ${gateway}. Whose IP does the sender resolve with ARP?`,
      diagram: arpDiagram(true, sender, dest, gateway),
      correct: dest.split("/")[0],
      wrong: [gateway.split("/")[0], "Both the gateway and the destination", "Neither. DNS resolves on-link addresses."],
      explanation: `${sender} and ${dest} are in the same /24, so the destination is on-link. The sender ARPs for ${dest.split("/")[0]} and frames the packet to that MAC. It ARPs for the gateway only when the destination IP is outside its subnet.`,
    }));
  }

  for (let index = 0; index < 20; index += 1) {
    const sender = `10.${index}.0.10/24`;
    const dest = `10.${index}.1.10/24`;
    const gateway = `10.${index}.0.1/24`;
    out.push(q({
      id: `g-e-arp-off-${index}`,
      topic: "ARP",
      difficulty: "easy",
      prompt: `The sender ${sender} is about to IP-packet ${dest}. The gateway on its subnet is ${gateway}. Whose IP does the sender resolve with ARP?`,
      diagram: arpDiagram(false, sender, dest, gateway),
      correct: gateway.split("/")[0],
      wrong: [dest.split("/")[0], "Both, and it uses whichever answer arrives first", "Neither. The router rewrites the packet without an ARP."],
      explanation: `${dest} is outside ${sender}'s /24, so it is not on-link. The host ARPs for its gateway, ${gateway.split("/")[0]}, and the router forwards from there. ARPing for the remote host would not cross the router.`,
    }));
  }

  for (let index = 0; index < 8; index += 1) {
    const third = 80 + index;
    const odd = (index % 3) + 1;
    const shared = `10.${third}.4`;
    const other = `10.${third}.5`;
    const hosts: [string, string, string] = [
      odd === 1 ? `${other}.4/24` : `${shared}.4/24`,
      odd === 2 ? `${other}.8/24` : `${shared}.8/24`,
      odd === 3 ? `${other}.12/24` : `${shared}.12/24`,
    ];
    out.push(pairQuestion(`g-e-pairb-${index}`, "easy", hosts));
  }

  for (const spines of [2, 3, 4]) {
    out.push(q({
      id: `g-e-paths-${spines}`,
      topic: "Leaf-spine",
      difficulty: "easy",
      prompt: `Leaf A and Leaf B both connect to the same ${spines} spines. How many equal-cost paths does one flow have to choose from between the leaves?`,
      diagram: spineDiagram(spines, null),
      correct: String(spines),
      wrong: [String(spines - 1), String(spines + 1), "1, because STP blocks the extras"],
      explanation: `Each spine is an equal-cost next hop, so there are ${spines} ECMP paths. One flow is hashed onto one of them; it is not striped across all of them. A routed leaf-spine does not use STP to pick the path.`,
    }));
    if (spines > 2) {
      out.push(q({
        id: `g-e-paths-down-${spines}`,
        topic: "Leaf-spine",
        difficulty: "easy",
        prompt: `There are ${spines} spines, and one leaf-to-spine link is down, as marked. How many equal-cost paths remain between the two leaves?`,
        diagram: spineDiagram(spines, 0),
        correct: String(spines - 1),
        wrong: [String(spines), "0, until STP reconverges", "1, regardless of how many spines are left"],
        explanation: `The down interface is removed from the ECMP group immediately. ${spines - 1} spines are still up, so ${spines - 1} paths remain. This is a routed fabric: spanning tree is not what restores the path.`,
      }));
    }
  }

  return out;
}

function mediumTextPool(): Question[] {
  const out: Question[] = [];
  out.push(
    fact("g-m-mss-v4", "TCP", "medium", "A host uses a 1500-byte IPv4 MTU and no IP or TCP options. What TCP MSS does it advertise?", "1460", ["1500", "1480", "1440"], "MSS is the largest TCP payload. Subtract the 20-byte IPv4 header and the 20-byte TCP header from the MTU: 1500 − 40 = 1460. 1440 would be the IPv6 equivalent, because the IPv6 header is 40 bytes."),
    fact("g-m-mss-v6", "TCP", "medium", "A host uses a 1500-byte IPv6 MTU and no extension headers or TCP options. What TCP MSS does it advertise?", "1440", ["1460", "1500", "1280"], "The IPv6 header is 40 bytes and the TCP header is 20, so the MSS is 1500 − 60 = 1440. 1460 is the IPv4 number. 1280 is the minimum IPv6 MTU, not the MSS."),
    fact("g-m-mss-jumbo", "TCP", "medium", "A storage VLAN uses a 9000-byte IPv4 MTU with no options. What is the TCP MSS?", "8960", ["9000", "8940", "1460"], "9000 − 20 (IPv4) − 20 (TCP) = 8960. If any hop in the path is still at 1500, large segments stall unless PMTUD or MSS clamping fixes it. This is a common data-center foot-gun."),
    fact("g-m-ad-static-ospf", "Administrative distance", "medium", "On Cisco IOS, the same prefix is learned by a static route and by OSPF. Which one is installed?", "The static route. Its administrative distance is 1, and OSPF's is 110.", ["OSPF, because a dynamic protocol is preferred to a static route.", "Both, and the router load-balances them.", "Neither, until BGP also agrees."], "Administrative distance breaks a tie for one prefix length. Cisco static is 1 and OSPF is 110, so the static route wins and the OSPF route is not installed for that prefix. This is different from longest-prefix match, which compares different lengths."),
    fact("g-m-ad-ebgp-ospf", "Administrative distance", "medium", "On Cisco IOS, the identical prefix arrives by eBGP and by OSPF. Which is installed?", "eBGP. Its administrative distance is 20, which beats OSPF at 110.", ["OSPF, because 110 is a higher number.", "iBGP would win, but eBGP loses to OSPF.", "Whichever advertisement is newer."], "Cisco eBGP is distance 20. OSPF is 110. Lower distance wins when the prefix lengths are equal. iBGP is 200, so OSPF beats iBGP — that one surprises people who think BGP always wins."),
    fact("g-m-ad-ibgp-ospf", "Administrative distance", "medium", "On Cisco IOS, OSPF and iBGP both offer 10.1.0.0/24. Which route is used?", "OSPF. Distance 110 beats iBGP distance 200.", ["iBGP, because BGP is the edge protocol.", "eBGP rules apply to iBGP, so BGP wins at distance 20.", "The route with the shorter AS path, ignoring OSPF."], "iBGP is not eBGP. On Cisco, iBGP's distance is 200, worse than OSPF's 110, so OSPF is installed for that exact prefix. People get burned by this when an IGP route hides an iBGP route of the same length."),
    fact("g-m-ad-rip", "Administrative distance", "medium", "On Cisco IOS, RIP and OSPF both offer the same prefix. Which is preferred?", "OSPF, distance 110, over RIP, distance 120.", ["RIP, because distance-vector protocols converge first.", "They are equal and ECMP across protocols.", "RIP wins because 120 is higher."], "Lower administrative distance wins. OSPF 110 beats RIP 120. The numbers are Cisco's. Another vendor's route preference table is different, so say 'on Cisco' in the interview."),
    fact("g-m-l4-l7", "Load balancing", "medium", "What can a layer-7 load balancer do that a layer-4 load balancer cannot?", "Choose a backend from the HTTP host header or URL path.", ["Rewrite the client's MAC address.", "Open a TCP connection.", "Hash a 5-tuple."], "Layer 4 sees IP addresses and ports. Layer 7 terminates or inspects HTTP, so it can route on the host header, path, or cookie. Both can spread TCP connections. The layer-7 device is in the application conversation, which costs more and lets it do smarter things."),
    fact("g-m-igmp", "Multicast", "medium", "What does IGMP snooping do on a switch?", "Forwards multicast only to ports that asked for the group, instead of flooding the VLAN.", ["Builds the OSPF shortest path.", "Encrypts multicast.", "Turns multicast into broadcast so every host must receive it."], "Without snooping, multicast is flooded like broadcast. IGMP snooping watches joins and reports and prunes the rest of the VLAN. In a VXLAN fabric the same idea reduces how much multicast becomes BUM."),
    fact("g-m-vrrp", "First hop", "medium", "How is VRRP different from an EVPN anycast gateway?", "VRRP elects one active router for the virtual IP. An anycast gateway is answered by every leaf.", ["They are the same protocol.", "VRRP load-balances each packet across every router.", "Anycast gateway requires STP."], "VRRP (and HSRP) elect a single forwarder for the virtual IP; the others wait. An EVPN anycast gateway puts the same gateway IP and MAC on every leaf, and the local leaf answers. Traffic does not hairpin to a central pair."),
    fact("g-m-mlag", "Link aggregation", "medium", "What does MLAG (or vPC) give a dual-homed server?", "The two upstream switches look like one LACP peer, so both links forward and STP does not block one.", ["It stripes one TCP flow across both links packet by packet.", "It replaces the server's IP with the VIP.", "It is a layer-3 ECMP feature and does not involve LACP."], "The server speaks LACP to what looks like one switch. Both uplinks forward, and a link failure is a bundle member failure, not an STP event. One flow is still hashed to one member. The two switches have to sync MAC and protocol state with each other."),
    fact("g-m-cut", "Switching", "medium", "What is the tradeoff of cut-through switching?", "The switch starts forwarding before the whole frame arrives, so latency drops and a bad FCS may be forwarded.", ["It checks the FCS and then forwards, adding hop latency.", "It disables ECMP.", "It forces every frame through the CPU."], "Cut-through begins transmission after the destination MAC (or a bit more) is known. Latency falls by most of a frame time. The switch may not yet know the CRC is bad, so errored frames can leave the port. Store-and-forward waits for the whole frame and can drop those."),
    fact("g-m-dscp", "QoS", "medium", "What is the DSCP value named EF, used for voice?", "46", ["0", "48", "8"], "Expedited Forwarding is DSCP 46. 0 is best effort. CS6 is 48 and is often used for network control. The number matters when you mark at the trust boundary and schedule that class in a priority queue."),
    fact("g-m-ipv6-mtu", "IPv6", "medium", "What is the minimum MTU IPv6 requires on every link?", "1280 bytes", ["1500 bytes", "576 bytes", "68 bytes"], "IPv6 will not fragment in the network, and every link must support at least 1280 bytes. IPv4's practical floor is much smaller. Tunnel overhead that pushes the path under 1280 breaks IPv6 even when IPv4 through the same tunnel still works."),
    fact("g-m-sack", "TCP", "medium", "What does TCP selective acknowledgment (SACK) let the sender do?", "Retransmit only the missing segments, not everything after the first hole.", ["Advertise a window larger than 64 KB without scaling.", "Skip the handshake.", "Turn off congestion control."], "With only cumulative ACKs, a sender that sees one hole may resend data the receiver already has. SACK names the blocks that arrived, so the retransmission fills the gap. Window scaling is a different option."),
    fact("g-m-wscale", "TCP", "medium", "What problem does the TCP window scale option solve?", "The 16-bit window field tops out at 64 KB, which is too small for a fast long path.", ["It retransmits lost segments faster.", "It lets UDP carry TCP.", "It removes TIME_WAIT."], "A 64 KB window on a high bandwidth-delay path leaves the pipe empty. Window scale shifts the 16-bit field so each count means more bytes. Both ends negotiate it in the handshake. Without it, throughput stalls far below the link rate."),
    fact("g-m-quic", "HTTP", "medium", "What does HTTP/3 use as its transport?", "QUIC over UDP", ["TCP port 443 with TLS 1.2 only", "SCTP", "Raw IP protocol 443"], "HTTP/3 runs on QUIC, and QUIC runs on UDP. QUIC has its own loss recovery and encryption, so it does not inherit TCP head-of-line blocking across streams. Firewalls that only understand TCP HTTP miss it."),
    fact("g-m-frame-1518", "Ethernet", "medium", "A 1500-byte IPv4 packet is sent untagged. How many bytes are in the Ethernet frame, including the header and FCS?", "1518", ["1500", "1522", "1514"], "Ethernet header is 14 bytes and the FCS is 4, so 1500 + 18 = 1518. 1514 is the frame without the FCS, which is what captures often show. An 802.1Q tag adds 4 more bytes and makes a 1522-byte frame."),
    fact("g-m-frame-1522", "Ethernet", "medium", "A 1500-byte IP packet carries one 802.1Q tag. What is the frame size including the FCS?", "1522", ["1518", "1526", "1504"], "The tag adds 4 bytes to the untagged 1518-byte frame, so the wire size is 1522. QinQ, a second tag, adds another 4 and makes 1526. Forgetting the tag is how 'baby giant' drops appear on a strict 1518-byte port."),
  );

  const mediumBoundaries: [string, number][] = [
    ["10.1.5.20", 26], ["10.1.5.70", 26], ["172.16.5.40", 20], ["172.16.20.1", 20],
    ["192.168.1.130", 25], ["192.168.1.10", 25], ["10.8.3.200", 22], ["10.8.7.1", 22],
    ["10.50.9.9", 23], ["10.50.11.9", 23], ["192.168.10.77", 27], ["192.168.10.100", 28],
    ["10.2.2.20", 28], ["172.31.4.4", 21], ["10.9.9.9", 29], ["10.16.40.1", 18],
    ["172.18.90.10", 19], ["10.100.40.50", 21], ["192.168.8.140", 26], ["10.3.100.20", 22],
  ];
  mediumBoundaries.forEach(([ip, prefix], index) => {
    out.push(boundaryQuestion(`g-m-net-${index}`, "medium", ip, prefix, index % 2 === 0 ? "network" : "broadcast"));
    if (prefix <= 29) {
      out.push(boundaryQuestion(`g-m-host-${index}`, "medium", ip, prefix, index % 2 === 0 ? "first" : "last"));
    }
  });

  for (const prefix of [12, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30]) {
    out.push(q({
      id: `g-m-wild-${prefix}`,
      topic: "Wildcard masks",
      difficulty: "medium",
      prompt: `What is the Cisco wildcard mask for a /${prefix}?`,
      correct: wildcard(prefix),
      wrong: [wildcard(prefix - 1), wildcard(prefix + 1), intToIp(prefixMask(prefix))],
      explanation: `A wildcard is the inverse of the subnet mask. A /${prefix} mask is ${intToIp(prefixMask(prefix))}, so the wildcard is ${wildcard(prefix)}. OSPF network statements and many ACLs use the wildcard, not the mask. People invert the wrong octet and match a much wider range.`,
    }));
  }

  const lpmCases: [string, [string, string][]][] = [];
  for (let index = 0; index < 16; index += 1) {
    const mid = index + 2;
    lpmCases.push([
      `10.${mid}.8.20`,
      [
        [`10.${mid}.0.0/16`, "R1"],
        [`10.${mid}.8.0/24`, "R2"],
        [`10.${mid}.9.0/24`, "R3"],
        ["0.0.0.0/0", "R4"],
      ],
    ]);
  }
  lpmCases.forEach(([dest, routes], index) => {
    const destInt = ipToInt(dest);
    const hits = routes.map(([cidr, via]) => ({ ...parseCidr(cidr), via, cidr }))
      .filter((route) => networkAddress(destInt, route.len) === route.net)
      .sort((a, b) => b.len - a.len);
    if (hits.length < 2 || hits[0].len === hits[1].len) throw new Error(`lpm ${index}`);
    const winner = hits[0];
    out.push(q({
      id: `g-m-lpm-${index}`,
      topic: "Longest prefix match",
      difficulty: "medium",
      prompt: `A packet arrives for ${dest}. Which next hop is used?`,
      exhibit: routes.map(([cidr, via]) => `${cidr.padEnd(16)} via ${via}`).join("\n"),
      correct: `${winner.via}, because ${winner.cidr} is the longest match`,
      wrong: routes.filter(([, via]) => via !== winner.via).map(([cidr, via]) => `${via}, because ${cidr} is in the table`),
      explanation: `${dest} matches more than one route. Forwarding uses the longest prefix, which is ${winner.cidr} via ${winner.via}. A default route and a covering aggregate stay in the table for other destinations. Administrative distance is not involved, because these are different prefix lengths.`,
    }));
  });

  for (let third = 0; third < 16; third += 2) {
    const a = `10.2.${third}.0/24`;
    const b = `10.2.${third + 1}.0/24`;
    const cover = coveringPrefix(a, b);
    out.push(q({
      id: `g-m-sum-${third}`,
      topic: "Summarization",
      difficulty: "medium",
      prompt: `What is the longest prefix that covers both ${a} and ${b}?`,
      correct: cover,
      wrong: [a, b, "10.2.0.0/16", coveringPrefix(`10.2.${third}.0/24`, `10.2.${third + 3}.0/24`)],
      explanation: `${a} and ${b} are adjacent and aligned, so they collapse to ${cover} with nothing extra. A summary has to be a power-of-two block on a matching boundary. Advertising either /24 alone does not cover the other one.`,
    }));
  }

  const ospfCases: [number, number][] = [
    [10000, 10000], [10000, 1000], [10000, 100000], [100000, 10000], [100000, 100000],
    [100, 10000], [40000, 10000], [100000, 25000], [100000, 40000], [100000, 50000],
    [10000, 40000], [20000, 10000],
  ];
  ospfCases.forEach(([ref, link], index) => {
    const cost = Math.max(1, Math.floor(ref / link));
    out.push(q({
      id: `g-m-ospf-cost-${index}`,
      topic: "OSPF cost",
      difficulty: "medium",
      prompt: `Cisco OSPF reference bandwidth is ${fmt(ref)} Mbps. What is the OSPF cost of a ${fmt(link)} Mbps link?`,
      correct: String(cost),
      wrong: [String(Math.max(1, Math.floor(link / ref))), String(ref / link > 1 ? Math.floor(ref / link) + 1 : 10), String(cost + 1), "0"],
      explanation: `Cost is reference bandwidth divided by link bandwidth, as an integer, with a floor of 1. ${fmt(ref)} / ${fmt(link)} = ${cost === 1 && ref / link < 1 ? "less than 1, so the cost is clamped to 1" : String(cost)}. If the reference stays at the old 100 Mbps default, every link of 100 Mbps or faster costs 1 and OSPF cannot tell 10G from 100G.`,
    }));
  });

  const oversub = [
    [16, 25, 2, 100], [32, 25, 4, 100], [48, 10, 4, 40], [48, 10, 2, 40],
    [40, 10, 4, 100], [24, 25, 2, 100], [32, 10, 2, 40], [64, 10, 4, 40],
    [32, 25, 2, 100], [48, 25, 4, 100], [48, 10, 6, 40], [16, 10, 2, 100],
  ] as const;
  oversub.forEach(([servers, serverSpeed, uplinks, uplinkSpeed], index) => {
    const down = servers * serverSpeed;
    const up = uplinks * uplinkSpeed;
    const label = ratioLabel(down, up);
    const parts = label.split(":").map(Number);
    if (parts[0] > 8 || parts[1] > 8) return;
    out.push(q({
      id: `g-m-over-${index}`,
      topic: "Oversubscription",
      difficulty: "medium",
      prompt: `A leaf has ${servers} server ports at ${serverSpeed} Gbps and ${uplinks} uplinks at ${uplinkSpeed} Gbps. What is the oversubscription, downlink bandwidth divided by uplink bandwidth?`,
      correct: label,
      wrong: [
        ratioLabel(up, down),
        ratioLabel(servers, uplinks),
        ratioLabel(down, uplinkSpeed),
        ratioLabel(down * 2, up),
        ratioLabel(down, up * 2),
        "2:1",
        "4:1",
        "8:1",
      ],
      explanation: `Downlink bandwidth is ${servers} × ${serverSpeed} = ${down} Gbps. Uplink bandwidth is ${uplinks} × ${uplinkSpeed} = ${up} Gbps. ${down}:${up} reduces to ${label}. Counting ports instead of gigabits, or forgetting all but one uplink, is the usual miss.`,
    }));
  });

  for (let index = 0; index < 12; index += 1) {
    const client = 1000 + index * 37;
    const server = 8000 + index * 53;
    out.push(q({
      id: `g-m-ack-${index}`,
      topic: "TCP handshake",
      difficulty: "medium",
      prompt: `A client sends SYN with seq ${client}. The server answers SYN-ACK with seq ${server} and ack ${client + 1}. What ack number must the client's final ACK carry?`,
      correct: String(server + 1),
      wrong: [String(server), String(server + 2), String(client + 1)],
      explanation: `A SYN consumes one sequence number. The server's SYN used ${server}, so the client must acknowledge ${server + 1}, the next byte it expects. Acknowledging ${server} is off by one and the handshake does not complete. The client's own sequence is ${client + 1} after its SYN; that is the seq field, not the ack.`,
    }));
  }

  const mtuCases: [number, number, "df" | "clear"][] = [
    [2000, 1500, "df"], [800, 1500, "df"], [2000, 1500, "clear"], [9000, 1500, "df"], [1200, 1500, "df"],
  ];
  mtuCases.forEach(([size, mtu, df], index) => {
    const fits = size <= mtu;
    const correct = fits
      ? "Forward the packet unchanged."
      : df === "df"
        ? "Drop it and, if allowed, send ICMP Fragmentation Needed."
        : "Fragment it, because DF is clear.";
    out.push(q({
      id: `g-m-mtu-${index}`,
      topic: "MTU",
      difficulty: "medium",
      prompt: `An IPv4 packet of ${size} bytes arrives at a link whose MTU is ${mtu}. The Don't Fragment bit is ${df === "df" ? "set" : "clear"}. What should the router do?`,
      correct,
      wrong: [
        "Forward the packet unchanged.",
        "Drop it and, if allowed, send ICMP Fragmentation Needed.",
        "Fragment it, because DF is clear.",
        "Rewrite the packet to 576 bytes and keep going.",
      ],
      explanation: fits
        ? `${size} fits in an MTU of ${mtu}, so the router forwards it. Fragmentation and ICMP only come up when the packet is larger than the link.`
        : df === "df"
          ? `${size} does not fit in ${mtu}, and DF forbids fragmentation. The router drops the packet and should send ICMP type 3 code 4 back to the sender. If that ICMP is filtered, the sender never reduces its size. This is a PMTUD black hole.`
          : `${size} does not fit, but DF is clear, so an IPv4 router may fragment. IPv6 routers do not have this option. Fragmentation is still something to avoid: it is CPU work and it breaks ECMP and firewalls.`,
    }));
  });

  const extraPrefixes = [20, 21, 22, 23, 25, 26, 27, 28, 29];
  for (let index = 0; index < 50; index += 1) {
    const prefix = extraPrefixes[index % extraPrefixes.length];
    const ip = `172.16.${index + 1}.${(index * 13) % 200 + 10}`;
    const kind = index % 2 === 0 ? "network" : "broadcast";
    const other = index % 2 === 0 ? "first" : "last";
    out.push(boundaryQuestion(`g-m-bx-${index}`, "medium", ip, prefix, kind));
    out.push(boundaryQuestion(`g-m-by-${index}`, "medium", ip, prefix, other));
  }

  for (let index = 0; index < 24; index += 1) {
    const mid = index + 20;
    const dest = `172.16.${mid}.20`;
    const routes: [string, string][] = [
      ["172.16.0.0/16", "R1"],
      [`172.16.${mid}.0/24`, "R2"],
      [`172.16.${mid + 1}.0/24`, "R3"],
      ["0.0.0.0/0", "R4"],
    ];
    const destInt = ipToInt(dest);
    const hits = routes.map(([cidr, via]) => ({ ...parseCidr(cidr), via, cidr }))
      .filter((route) => networkAddress(destInt, route.len) === route.net)
      .sort((a, b) => b.len - a.len);
    if (hits.length < 2 || hits[0].len === hits[1].len) throw new Error(`lpm extra ${index}`);
    const winner = hits[0];
    out.push(q({
      id: `g-m-lpm2-${index}`,
      topic: "Longest prefix match",
      difficulty: "medium",
      prompt: `A packet arrives for ${dest}. Which next hop is used?`,
      exhibit: routes.map(([cidr, via]) => `${cidr.padEnd(18)} via ${via}`).join("\n"),
      correct: `${winner.via}, because ${winner.cidr} is the longest match`,
      wrong: routes.filter(([, via]) => via !== winner.via).map(([cidr, via]) => `${via}, because ${cidr} is in the table`),
      explanation: `${dest} matches more than one route. Forwarding uses the longest prefix, which is ${winner.cidr} via ${winner.via}. The /16 and the default stay in the table for destinations that miss the /24. Administrative distance does not apply, because the prefix lengths differ.`,
    }));
  }

  for (let third = 0; third < 32; third += 2) {
    const a = `10.40.${third}.0/24`;
    const b = `10.40.${third + 1}.0/24`;
    const cover = coveringPrefix(a, b);
    const wider = coveringPrefix(a, `10.40.${third + 3}.0/24`);
    out.push(q({
      id: `g-m-sum2-${third}`,
      topic: "Summarization",
      difficulty: "medium",
      prompt: `What is the longest prefix that covers both ${a} and ${b}?`,
      correct: cover,
      wrong: [a, b, "10.40.0.0/16", wider],
      explanation: `${a} and ${b} are adjacent /24s on a matching boundary, so the longest cover is ${cover}. ${wider} also covers them, but it covers extra space and is not the longest summary. Advertising one of the /24s leaves the other uncovered.`,
    }));
  }

  for (let index = 0; index < 16; index += 1) {
    const seq = 5000 + index * 250;
    const bytes = [100, 536, 1000, 1460][index % 4];
    out.push(q({
      id: `g-m-data-ack-${index}`,
      topic: "TCP",
      difficulty: "medium",
      prompt: `After the handshake, a client sends ${bytes} bytes of payload starting at sequence ${seq}. Every byte arrives. What acknowledgement number does the server send?`,
      correct: String(seq + bytes),
      wrong: [String(seq), String(seq + bytes - 1), String(seq + bytes + 1), String(bytes)],
      explanation: `The acknowledgement is the next sequence number the receiver expects. ${bytes} bytes starting at ${seq} occupy ${seq} through ${seq + bytes - 1}, so the ack is ${seq + bytes}. Acknowledging the last received byte, rather than the next one, is the usual off-by-one.`,
    }));
  }

  return out;
}

function oversubDiagram(serversLabel: string, uplinks: { name: string; speed: string; down?: boolean }[]): TopologyDiagram {
  const nodes: TopologyDiagram["nodes"] = [
    { id: "srv", label: "Servers", detail: serversLabel, x: 50, y: 84, kind: "server" },
    { id: "leaf", label: "Leaf", x: 50, y: 48, kind: "switch" },
  ];
  uplinks.forEach((uplink, index) => {
    const x = uplinks.length === 1 ? 50 : 12 + (76 / (uplinks.length - 1)) * index;
    nodes.push({ id: `u${index}`, label: uplink.name, x, y: 12, kind: "switch" });
  });
  const edges: TopologyDiagram["edges"] = [{ from: "srv", to: "leaf", label: serversLabel }];
  uplinks.forEach((uplink, index) => {
    edges.push({
      from: "leaf",
      to: `u${index}`,
      label: uplink.speed,
      state: uplink.down ? "down" : "up",
    });
  });
  return {
    kind: "topology",
    title: "Leaf bandwidth",
    nodes,
    edges,
    note: "Count gigabits, not the number of cables.",
  };
}

function trunkDiagram(vlanA: number, vlanC: number, native?: number): TopologyDiagram {
  return {
    kind: "topology",
    title: native ? `Trunk, native VLAN ${native}` : "Access ports and a trunk",
    nodes: [
      { id: "ha", label: "Host A", detail: `VLAN ${vlanA}`, x: 10, y: 46, kind: "host" },
      { id: "sw1", label: "Switch 1", x: 36, y: 46, kind: "switch" },
      { id: "sw2", label: "Switch 2", x: 64, y: 46, kind: "switch" },
      { id: "hb", label: "Host B", detail: `VLAN ${vlanA}`, x: 90, y: 16, kind: "host" },
      { id: "hc", label: "Host C", detail: `VLAN ${vlanC}`, x: 90, y: 78, kind: "host" },
    ],
    edges: [
      { from: "ha", to: "sw1", label: "access" },
      { from: "sw1", to: "sw2", label: native ? `trunk native ${native}` : "trunk" },
      { from: "sw2", to: "hb", label: "access" },
      { from: "sw2", to: "hc", label: "access" },
    ],
  };
}

function handshakeDiagram(client: number, server: number): SequenceDiagram {
  return {
    kind: "sequence",
    title: "Three-way handshake",
    actors: ["Client", "Server"],
    steps: [
      { from: "Client", to: "Server", label: `SYN seq=${client}` },
      { from: "Server", to: "Client", label: `SYN-ACK seq=${server} ack=${client + 1}` },
      { from: "Client", to: "Server", label: `ACK seq=${client + 1} ack=${server}`, bad: true },
    ],
    note: "The highlighted acknowledgement is wrong.",
  };
}

function mediumDiagramPool(): Question[] {
  const out: Question[] = [];
  const drawn = [
    [16, 25, 2, 100], [24, 25, 2, 100], [32, 25, 2, 100], [48, 10, 2, 40],
    [32, 10, 2, 40], [40, 10, 2, 100], [8, 25, 2, 100], [16, 10, 2, 40],
    [24, 10, 2, 40], [48, 10, 4, 40], [16, 25, 4, 100], [32, 25, 4, 100],
    [8, 100, 2, 400], [20, 10, 2, 100], [12, 25, 2, 50], [48, 25, 4, 100],
  ] as const;
  drawn.forEach(([servers, serverSpeed, uplinks, uplinkSpeed], index) => {
    if (uplinks > 4) return;
    const label = ratioLabel(servers * serverSpeed, uplinks * uplinkSpeed);
    const parts = label.split(":").map(Number);
    if (parts[0] > 8 || parts[1] > 8) return;
    const ups = Array.from({ length: uplinks }, (_, uplink) => ({
      name: `Up ${uplink + 1}`,
      speed: `${uplinkSpeed}G`,
    }));
    out.push(q({
      id: `g-m-over-d-${index}`,
      topic: "Oversubscription",
      difficulty: "medium",
      prompt: `The leaf has ${servers} server ports at ${serverSpeed} Gbps and ${uplinks} uplinks at ${uplinkSpeed} Gbps, as drawn. What is the oversubscription (downlink bandwidth : uplink bandwidth)?`,
      diagram: oversubDiagram(`${servers}×${serverSpeed}G`, ups),
      correct: label,
      wrong: [
        ratioLabel(uplinks * uplinkSpeed, servers * serverSpeed),
        ratioLabel(servers, uplinks),
        ratioLabel(servers * serverSpeed, uplinkSpeed),
        ratioLabel(servers * serverSpeed * 2, uplinks * uplinkSpeed),
        ratioLabel(servers * serverSpeed, uplinks * uplinkSpeed * 2),
        "2:1",
        "4:1",
        "8:1",
      ],
      explanation: `${servers} × ${serverSpeed}G is ${servers * serverSpeed}G of server bandwidth. ${uplinks} × ${uplinkSpeed}G is ${uplinks * uplinkSpeed}G of uplink. The ratio is ${label}. One TCP flow still cannot exceed a single uplink; the ratio describes the whole leaf.`,
    }));
  });

  [10, 20, 30, 40, 50, 60, 70, 80, 100, 200, 300, 15, 25, 35, 45, 55, 65, 75, 110, 120].forEach((vlan, index) => {
    const other = vlan + 7;
    out.push(q({
      id: `g-m-trunk-${index}`,
      topic: "Trunks",
      difficulty: "medium",
      prompt: `Host A and Host B are in VLAN ${vlan}. Host C is in VLAN ${other}. How does a frame from Host A to Host B look on the trunk?`,
      diagram: trunkDiagram(vlan, other),
      correct: `Tagged with VLAN ${vlan}. The access ports toward the hosts are untagged.`,
      wrong: [
        "Untagged. Trunks strip every VLAN tag.",
        `Tagged with VLAN ${other}, because Host C is on Switch 2.`,
        `Tagged with both VLAN ${vlan} and VLAN ${other}.`,
      ],
      explanation: `Host A is an access port in VLAN ${vlan}, so the switch associates the untagged frame with that VLAN and tags it on the trunk. Switch 2 removes the tag before Host B's access port. Host C's VLAN ${other} is a different frame.`,
    }));
  });

  for (let index = 0; index < 18; index += 1) {
    const client = 2000 + index * 41;
    const server = 9000 + index * 29;
    out.push(q({
      id: `g-m-hs-${index}`,
      topic: "TCP handshake",
      difficulty: "medium",
      prompt: `Client ISN ${client}, server ISN ${server}. The third segment's acknowledgement number is wrong. What should it be?`,
      diagram: handshakeDiagram(client, server),
      correct: String(server + 1),
      wrong: [String(server), String(server + 2), String(client)],
      explanation: `The server SYN used sequence ${server}, and a SYN consumes one number, so the client acknowledges ${server + 1}. The diagram shows ack ${server}. The server's ack of ${client + 1} is already right, because the client SYN used ${client}.`,
    }));
  }

  for (const spines of [2, 3, 4]) {
    out.push(q({
      id: `g-m-ecmp-${spines}`,
      topic: "ECMP",
      difficulty: "medium",
      prompt: `Leaf A and Leaf B connect to ${spines} spines. One TCP flow goes from a server on Leaf A to a server on Leaf B. How many spines does that one flow use at a time?`,
      diagram: spineDiagram(spines, null),
      correct: "1. ECMP hashes the flow onto a single spine.",
      wrong: [
        `All ${spines}. ECMP stripes packets of one flow across every spine.`,
        "0. East-west traffic stays on the leaf.",
        "2, but only if STP is disabled.",
      ],
      explanation: `There are ${spines} equal-cost paths, and the hash picks one for this 5-tuple so TCP stays in order. The other spines carry other flows. Per-packet striping would reorder the connection and is not what normal ECMP does.`,
    }));
  }

  for (let index = 1; index <= 8; index += 1) {
    const isp = `203.0.113.${index}`;
    out.push(q({
      id: `g-m-nh-${index}`,
      topic: "iBGP next hop",
      difficulty: "medium",
      prompt: `The edge learns a default route and advertises it to the leaf with iBGP, without next-hop-self. The next hop remains ${isp}, and the leaf has no route to ${isp}. What happens?`,
      diagram: {
        kind: "topology",
        title: "iBGP without next-hop-self",
        nodes: [
          { id: "isp", label: "ISP", detail: isp, x: 14, y: 50, kind: "cloud" },
          { id: "edge", label: "Edge", x: 48, y: 50, kind: "router" },
          { id: "leaf", label: "Leaf", x: 84, y: 50, kind: "switch" },
        ],
        edges: [
          { from: "isp", to: "edge", label: "eBGP" },
          { from: "edge", to: "leaf", label: "iBGP" },
        ],
        note: "The next hop is not rewritten.",
      },
      correct: `The default is not installed in the FIB. ${isp} does not resolve.`,
      wrong: [
        "The leaf forwards to the edge. iBGP always rewrites the next hop.",
        `The leaf ARPs for ${isp} on the server VLAN.`,
        "The route works, because iBGP next hops are recursive via the peer address by default.",
      ],
      explanation: `iBGP leaves the next hop unchanged. The leaf's default points at ${isp}, which is not in the IGP, so the route cannot be used for forwarding. next-hop-self on the edge, or an IGP route to the edge-ISP link, fixes it. 'BGP shows a default' and 'traffic can leave' are not the same fact.`,
    }));
  }

  for (let index = 0; index < 36; index += 1) {
    const third = index + 1;
    const odd = index % 3;
    const low = `10.${third}.1.10/26`;
    const mid = `10.${third}.1.40/26`;
    const high = `10.${third}.1.80/26`;
    const hosts: [string, string, string] = odd === 0
      ? [high, low, mid]
      : odd === 1
        ? [low, high, mid]
        : [low, mid, high];
    out.push(pairQuestion(`g-m-pair-${index}`, "medium", hosts));
  }

  return out;
}

function hardTextPool(): Question[] {
  const out: Question[] = [];
  out.push(
    fact("g-h-irb", "EVPN", "hard", "Why do large EVPN fabrics prefer symmetric IRB to asymmetric IRB?", "A leaf only needs the subnets where it has local hosts, plus the L3 VNI. Asymmetric IRB routes only on ingress, so every leaf must know every subnet.", ["Symmetric IRB bridges on egress only, so it uses less routing state.", "Asymmetric IRB uses an L3 VNI and therefore scales further.", "Symmetric IRB cannot route between two VNIs."], "Asymmetric IRB routes at the ingress VTEP straight into the destination subnet's L2 VNI, and the egress VTEP only bridges. That forces every VTEP to hold every subnet. Symmetric IRB routes at both ends through an L3 VNI, so a leaf only configures subnets for its own hosts. Say that scaling difference out loud."),
    fact("g-h-entropy", "VXLAN", "hard", "Why does a VTEP set the outer UDP source port from a hash of the inner headers?", "So underlay ECMP, which often hashes UDP ports, spreads flows that would otherwise look identical.", ["The source port carries the VNI.", "So the destination VTEP can put the packets back in order.", "BGP will not advertise the VTEP unless the port is unique."], "The outer IP addresses are the VTEPs, so they are the same for every flow between that pair. If the UDP source port is also constant, every inner flow hashes to the same spine. Varying the source port is the entropy the underlay needs. The VNI is in the VXLAN header, not the port."),
    fact("g-h-rpki", "BGP security", "hard", "What does RPKI route origin validation actually check?", "That a ROA authorizes this AS to originate this prefix. It does not validate the rest of the AS path.", ["That every AS in the path is authorized to transit the route.", "That the MED is consistent.", "That the prefix is not RFC 1918."], "A ROA says which origin AS may announce a prefix and how long the prefix may be. Validation compares the advertisement's origin and length to that. A path can still be hijacked or leaked after a valid origin. Path validation is a different, heavier problem."),
    fact("g-h-dsr", "Load balancing", "hard", "In direct server return, the load balancer sees the request and the server answers the client directly, using the VIP as the source. What must be true?", "The server must own the VIP, and the return path does not have to pass back through the load balancer.", ["The server must pick a new source address or the client drops the response.", "The client opens a second connection for the bytes coming back.", "Return traffic is discarded unless it hairpins through the load balancer."], "The client sent the request to the VIP and expects the response from the VIP. The server accepts the VIP, usually on a loopback, and replies straight out. The load balancer does not see the return bytes, so it cannot do things that require them. State and health checking have to be designed for that."),
    fact("g-h-frag-ecmp", "ECMP", "hard", "Why can fragments of one IP datagram take different ECMP paths?", "Later fragments often have no TCP or UDP ports, so a 5-tuple hash sees different fields than the first fragment.", ["ECMP is required to stripe fragments.", "The More Fragments bit is the hash key and alternates on purpose.", "Fragments are process-switched one per link."], "The first fragment carries the L4 header. The rest often do not, so a hash that includes ports changes, and the fragment picks another link. Reassembly then depends on all of them arriving. This is one reason to avoid fragmentation inside a fabric."),
    fact("g-h-vxlan-mtu", "VXLAN", "hard", "A virtual machine uses a 1500-byte IPv4 MTU. What underlay IP MTU is required to carry its frames in IPv4 VXLAN without fragmentation? Count the inner Ethernet header and no outer VLAN tag.", "1550", ["1500", "1600", "1450"], "Add outer IPv4 (20), UDP (8), VXLAN (8), and the inner Ethernet header (14) to the 1500-byte guest packet: 1550. The underlay must be at least that, or you lower the guest MTU. 50 bytes is the usual overhead people quote when they also fold in an outer Ethernet header; the IP MTU the underlay router looks at is 1550."),
    fact("g-h-vxlan-v6", "VXLAN", "hard", "Same 1500-byte guest, but the VXLAN underlay is IPv6. What underlay MTU do you need, with no extension headers and no outer VLAN?", "1570", ["1550", "1500", "1610"], "The outer IPv6 header is 40 bytes instead of 20. 40 + UDP 8 + VXLAN 8 + inner Ethernet 14 + 1500 = 1570. Copying an IPv4 'set the fabric to 1550' design onto an IPv6 underlay silently fragments or drops."),
    fact("g-h-ipv6-64", "IPv6", "hard", "How many /64 subnets are in a /56?", "256", ["64", "56", "65536"], "A /56 to a /64 is 8 bits, and 2^8 = 256 subnets. A /48 gives 2^16 = 65536 /64s. A /60 gives 16. This is the allocation math behind 'a customer gets a /56 so they can have more than one LAN.'"),
    fact("g-h-ipv6-48", "IPv6", "hard", "How many /64 subnets are in a /48?", "65536", ["256", "48", "2^48"], "64 − 48 = 16 bits of subnet space, so 2^16 = 65536 /64s. The /64 itself still has 64 bits of interface identifier. People mix up the subnet count with the host count."),
    fact("g-h-ipv6-usable", "IPv6", "hard", "How should you think about 'usable hosts' in an IPv6 /64?", "There is no broadcast address to reserve. The subnet is 2^64 addresses, and SLAAC uses the whole prefix.", ["Subtract 2, the same way as IPv4, leaving 2^64 − 2.", "A /64 has 254 usable hosts.", "Only the first /120 is usable."], "IPv6 has no broadcast, so you do not subtract a network and broadcast the way IPv4 does. A /64 is the normal LAN and is intentionally huge. Neighbor Discovery replaces ARP. Carving a /64 into tiny subnets breaks SLAAC."),
    fact("g-h-ula", "IPv6", "hard", "Which prefix is IPv6 unique local addressing, the rough equivalent of private space?", "fc00::/7", ["fe80::/10", "2001:db8::/32", "ff00::/8"], "fc00::/7 is unique local (the fd00::/8 half is what operators actually use). fe80::/10 is link-local. 2001:db8::/32 is documentation. ff00::/8 is multicast. Unique local is not routed on the global internet."),
    fact("g-h-ndp", "IPv6", "hard", "What replaces ARP in IPv6?", "Neighbor Discovery, using ICMPv6 solicited-node multicasts rather than broadcast.", ["ARP, unchanged, because MAC addresses did not change.", "DHCPv6 for every resolution.", "A TCP handshake to the neighbor."], "Neighbor Solicitation and Neighbor Advertisement resolve a neighbor's MAC. They go to a solicited-node multicast group, not to the all-ones broadcast. Router Advertisements also come from this family and carry prefixes and the default router."),
    fact("g-h-rd-rt", "EVPN", "hard", "In EVPN or MPLS L3VPN, what is the difference between a route distinguisher and a route target?", "The RD makes overlapping customer prefixes unique in BGP. The RT controls which VRFs import the route.", ["They are two names for the VNI.", "The RT is prepended to the AS path. The RD sets local preference.", "The RD is the MAC address and the RT is the VLAN."], "Customers can both use 10.0.0.0/8. The route distinguisher is prepended so BGP treats those as different NLRI. The route target is an extended community the receiving PE matches against its import policy. Mixing them up means either collisions or routes that land in every VRF."),
    fact("g-h-php", "MPLS", "hard", "What is penultimate hop popping?", "The router before the egress removes the MPLS label, so the egress does one lookup instead of two.", ["The ingress pushes two labels and the egress pops both.", "PHP is the TTL copied from IP into the label.", "The egress advertises a label of 3 to ask the previous hop to pop."], "The egress can advertise implicit-null (label 3). The previous hop pops the label and sends a plain IP packet. The egress then does a single IP lookup. Explicit-null keeps a label so QoS bits survive, at the cost of that extra lookup."),
    fact("g-h-urpf", "Security", "hard", "What is the difference between strict and loose unicast RPF?", "Strict requires the route back to the source to point out the interface the packet arrived on. Loose only requires that some route to the source exists.", ["Loose drops more packets than strict.", "Strict checks the TCP checksum. Loose checks the IP checksum.", "They are the same check with different names on different vendors."], "Strict uRPF stops spoofing on a stub interface where the return path is symmetric. On a multi-homed edge it drops legitimate traffic that came back a different way, so operators use loose mode, or feasible-path uRPF, there. Say which mode you mean."),
    fact("g-h-hot-potato", "Peering", "hard", "What is hot-potato routing?", "A network hands traffic to the peer at the closest exit, instead of carrying it across its own backbone.", ["The receiver keeps the traffic until the last possible exit.", "MED is ignored and local preference is copied from the IGP cost.", "It is another name for anycast."], "Hot potato exits early. The peer then carries the bits. Cold potato carries them yourself and exits near the destination. MED and the peer's local preference are how the two sides negotiate this. Closest exit is an IGP-cost-to-next-hop decision inside your AS."),
    fact("g-h-no-export", "BGP communities", "hard", "What does the well-known BGP community no-export mean?", "Do not advertise this route to eBGP peers. iBGP is still allowed.", ["Do not advertise this route to any peer, including iBGP.", "Strip the AS path.", "Set local preference to 0."], "no-export stops at the AS border. no-advertise is stricter: do not advertise it to any BGP peer. no-export-subconfed stops at the confederation boundary. These are how a peer asks you not to re-announce a route, and they only work if you honor communities."),
    fact("g-h-addpath", "BGP", "hard", "What problem does BGP ADD-PATH solve?", "A router can advertise more than one path for the same prefix, instead of only the single best path.", ["It adds the IGP metric to the AS path length.", "It lets iBGP peers skip the route reflector.", "It validates the origin with RPKI."], "Ordinary BGP advertises one best path, so a route reflector hides alternate paths that would have been useful for multipath or for fast failover. ADD-PATH lets those additional paths be sent. It does not replace the best-path decision on the receiver."),
    fact("g-h-syn-cookie", "TCP", "hard", "What do TCP SYN cookies let a server do under a SYN flood?", "Avoid storing state for a half-open connection until the client's ACK proves the handshake is real.", ["Close every established connection.", "Move the service to UDP.", "Disable sequence numbers."], "A SYN flood fills the backlog with half-open connections. SYN cookies encode the state in the sequence number of the SYN-ACK, so the server can rebuild the handshake from a valid ACK and drop the rest. This is a defense, not something you tune to make an attack worse."),
    fact("g-h-nagle", "TCP", "hard", "Why do Nagle's algorithm and delayed ACKs interact badly?", "Nagle waits for an ACK before sending a small segment, and delayed ACK waits for a second segment before acknowledging, so a small write stalls.", ["Nagle disables delayed ACKs.", "They only interact on UDP.", "The combination doubles the congestion window."], "Each side waits for the other. A latency-sensitive protocol that sends small writes (a database session, an old RPC) sees a delay of one delayed-ACK timer, often 40 to 200 ms. The usual fix is TCP_NODELAY on that socket, and to know why you are setting it."),
    fact("g-h-lsa5", "OSPF", "hard", "Which OSPF LSA advertises an external route injected by an ASBR?", "Type 5", ["Type 1", "Type 2", "Type 3"], "Type 1 is the router LSA. Type 2 is the network LSA from a DR. Type 3 is a summary between areas. Type 5 is external, flooded through the areas that accept externals. A stub area blocks type 5s, which is why a default is injected instead."),
    fact("g-h-dr", "OSPF", "hard", "On which OSPF network type is a DR/BDR elected?", "Broadcast and non-broadcast multi-access. Not on a point-to-point link.", ["Every network type, including /31 leaf-spine links.", "Only on point-to-point links.", "Only inside area 0."], "A DR exists so a LAN full of routers is not a full mesh of adjacencies. A point-to-point link has only two routers, so there is nothing to elect. Leaf-spine fabrics configured as point-to-point do not elect DRs, and you do not want them to."),
    fact("g-h-ipv6-udp-csum", "IPv6", "hard", "How does the UDP checksum rule change from IPv4 to IPv6?", "In IPv4 the UDP checksum may be zero, meaning 'no checksum'. In IPv6 it is mandatory.", ["Both allow a zero checksum.", "IPv6 removed the checksum because the header has one.", "Only IPv4 requires it."], "IPv6 has no header checksum of its own. UDP, TCP, and ICMP include a pseudo-header checksum, and a UDP checksum of zero is not allowed. Tunnel encapsulations that assumed a zero UDP checksum have to be configured explicitly."),
    fact("g-h-window-flight", "TCP", "hard", "A capture shows rwnd = 256 KB and cwnd = 32 KB on a lossy path. What limits bytes in flight?", "32 KB. The congestion window is smaller, and loss is what keeps it there.", ["256 KB, because the receiver advertised that much.", "288 KB, the sum.", "224 KB, the difference."], "Bytes in flight are capped by the minimum of cwnd and rwnd. The receiver has plenty of buffer. The path is lossy, so congestion control is the limiter. Raising the socket buffer would not speed this transfer up."),
  );

  for (let index = 0; index < 12; index += 1) {
    const mid = index + 1;
    const dest = `10.${mid}.5.5`;
    out.push(q({
      id: `g-h-lpm-ad-${index}`,
      topic: "RIB and FIB",
      difficulty: "hard",
      prompt: `A Cisco router has a static route for 10.0.0.0/8 (distance 1) and an OSPF route for 10.${mid}.0.0/16 (distance 110). A packet goes to ${dest}. Which route forwards it?`,
      exhibit: `S   10.0.0.0/8        via 192.0.2.1   AD 1\nO   10.${mid}.0.0/16     via 192.0.2.2   AD 110`,
      correct: `The OSPF /16. Longest prefix match beats a better administrative distance.`,
      wrong: [
        "The static /8, because distance 1 beats distance 110.",
        "Neither. The distances conflict, so the packet is dropped.",
        "Whichever route was installed first.",
      ],
      explanation: `Administrative distance chooses between sources of the same prefix. These are different lengths. ${dest} matches both, and /16 is more specific, so the FIB uses OSPF even though 110 is a worse distance than 1. The trap is treating distance as a global priority.`,
    }));
  }

  for (let index = 0; index < 8; index += 1) {
    const mid = 20 + index;
    out.push(q({
      id: `g-h-ad-same-${index}`,
      topic: "Administrative distance",
      difficulty: "hard",
      prompt: `On Cisco IOS, a static route and OSPF both offer exactly 10.${mid}.0.0/16. Which one is installed, and which rule is this?`,
      correct: "The static route, because the prefix lengths are equal and distance 1 beats OSPF's 110.",
      wrong: [
        "OSPF, because a longer protocol name wins.",
        "Both, because equal prefixes load-balance across protocols.",
        "OSPF, because distance only applies to BGP.",
      ],
      explanation: `Same prefix, so longest-prefix match cannot choose. Cisco administrative distance does: static 1, OSPF 110. The static route is installed and OSPF's copy is not. If the static route disappears, OSPF's can take over. Say 'same length, so AD' so you don't mix this up with the more-specific-prefix case.`,
    }));
  }

  for (let third = 1; third < 20; third += 2) {
    const a = `10.3.${third}.0/24`;
    const b = `10.3.${third + 1}.0/24`;
    const cover = coveringPrefix(a, b);
    out.push(q({
      id: `g-h-sum-${third}`,
      topic: "Summarization",
      difficulty: "hard",
      prompt: `What is the longest prefix that covers both ${a} and ${b}?`,
      correct: cover,
      wrong: [`10.3.${third}.0/23`, a, b, "10.3.0.0/16"],
      explanation: `${a} and ${b} are neighbors but they do not sit on one /23 boundary. /23 blocks are aligned pairs such as .0–.1 and .2–.3. The longest legal block that covers both is ${cover}, and it also includes the neighboring /24s. Advertising that summary attracts traffic for prefixes you may not have, so only summarize what you can actually reach.`,
    }));
  }

  const overlapAsks: [string, string[]][] = [];
  for (let index = 0; index < 10; index += 1) {
    const base = `10.${4 + index}.8.0/24`;
    overlapAsks.push([base, [`10.${4 + index}.0.0/16`, `10.${5 + index}.8.0/24`, `11.${4 + index}.8.0/24`, `10.${4 + index}.9.0/24`]]);
  }
  overlapAsks.forEach(([base, options], index) => {
    const correct = options.find((cidr) => overlaps(base, cidr));
    const wrong = options.filter((cidr) => cidr !== correct);
    if (!correct || wrong.some((cidr) => overlaps(base, cidr))) throw new Error(`overlap ${index}`);
    out.push(q({
      id: `g-h-over-${index}`,
      topic: "Prefix overlap",
      difficulty: "hard",
      prompt: `Which prefix overlaps ${base}?`,
      correct,
      wrong,
      explanation: `${correct} covers ${base}, so they overlap and cannot both be used as independent networks without one being a more specific route inside the other. The other choices are adjacent or in a different leading octet, and adjacency is not overlap.`,
    }));
  });

  const awkward = [3, 5, 9, 13, 25, 40, 70, 90, 180, 300, 400, 700, 900, 1500, 2500, 6000];
  awkward.forEach((hosts) => {
    const prefix = prefixForHosts(hosts);
    out.push(q({
      id: `g-h-fit-${hosts}`,
      topic: "Subnetting",
      difficulty: "hard",
      prompt: `You need ${hosts} usable hosts and you must reserve the network and broadcast addresses. What is the smallest prefix that works?`,
      correct: `/${prefix} (${fmt(usableCount(prefix))} usable)`,
      wrong: [
        `/${prefix + 1} (${fmt(usableCount(prefix + 1))} usable)`,
        `/${prefix - 1} (${fmt(usableCount(prefix - 1))} usable)`,
        `/${prefix} has ${fmt(2 ** (32 - prefix))} usable hosts, so it is required even when a longer prefix also fits`,
      ],
      explanation: `A /${prefix + 1} has only ${fmt(usableCount(prefix + 1))} usable hosts, short of ${hosts}. A /${prefix} has ${fmt(usableCount(prefix))}, which is enough, and it is smaller than a /${prefix - 1}. Subtract the two reserved addresses before you compare. The winning choice is /${prefix}.`,
    }));
  });

  const aclPorts = [443, 22, 80, 3306, 5432, 6443, 25, 587];
  for (let index = 0; index < 12; index += 1) {
    const oct = 20 + index;
    const port = aclPorts[index % aclPorts.length];
    const dest = `203.0.113.${10 + index}`;
    const permit = `10.${oct}.5.8`;
    out.push(q({
      id: `g-h-acl-${index}`,
      topic: "ACLs",
      difficulty: "hard",
      prompt: `Which packet does this ACL permit? It is processed top down, then an implicit deny. The permitted destination is ${dest} port ${port}.`,
      exhibit: `permit tcp 10.${oct}.5.0 0.0.0.255 host ${dest} eq ${port}\ndeny ip any any`,
      correct: `${permit} → ${dest} port ${port}`,
      wrong: [
        `10.${oct}.6.8 → ${dest} port ${port}`,
        `${permit} → ${dest} port ${port === 80 ? 443 : 80}`,
        `${permit} → 203.0.113.${80 + index} port ${port}`,
      ],
      explanation: `The wildcard 0.0.0.255 matches only 10.${oct}.5.0/24, the destination must be ${dest}, and the TCP port must be ${port}. The first line hits ${permit} → ${dest} port ${port}. A different third octet, port, or destination fails the line and dies on the explicit deny. First match wins; later permits would not be reached.`,
    }));
  }

  const bgpNames = ["Red", "Blue", "Green"] as const;
  for (let index = 0; index < 12; index += 1) {
    const mode = index % 3;
    const lp = 100 + (index % 4) * 50;
    const routes = mode === 0
      ? [
          { name: "Red", lp: lp + 100, asLen: 4, med: 50 },
          { name: "Blue", lp, asLen: 1, med: 0 },
          { name: "Green", lp: lp + 40, asLen: 2, med: 0 },
        ]
      : mode === 1
        ? [
            { name: "Red", lp, asLen: 2, med: 90 },
            { name: "Blue", lp, asLen: 5, med: 0 },
            { name: "Green", lp: lp - 10, asLen: 1, med: 0 },
          ]
        : [
            { name: "Red", lp, asLen: 3, med: 10 },
            { name: "Blue", lp, asLen: 3, med: 40 },
            { name: "Green", lp, asLen: 3, med: 70 },
          ];
    const ranked = [...routes].sort((a, b) => b.lp - a.lp || a.asLen - b.asLen || a.med - b.med);
    if (ranked[0].name === ranked[1].name) throw new Error("bgp tie");
    const winner = ranked[0];
    const reason = mode === 0
      ? `local preference ${winner.lp} is the highest, so AS path and MED are not consulted`
      : mode === 1
        ? `local preference ties the leaders and the AS path length ${winner.asLen} is the shortest among them`
        : `local preference and AS path length tie, and MED ${winner.med} is the lowest`;
    out.push(q({
      id: `g-h-bgp-${index}`,
      topic: "BGP best path",
      difficulty: "hard",
      prompt: `No Cisco weight is set. These routes are from the same neighboring AS, so MED may be compared. Local preferences are ${routes.map((route) => route.lp).join(", ")}. Which route wins?`,
      exhibit: routes.map((route) => `${route.name.padEnd(6)} local-pref ${route.lp}   AS-path length ${route.asLen}   MED ${route.med}`).join("\n"),
      correct: winner.name,
      wrong: [
        ...bgpNames.filter((name) => name !== winner.name),
        "None. The attributes conflict, so the prefix is withdrawn.",
      ],
      explanation: `${winner.name} wins because ${reason}. The order is local preference, then AS path length, then MED (lower MED is better). A short AS path does not beat a higher local preference, and a low MED does not beat a shorter AS path.`,
    }));
  }

  const alignCandidates: [string, number][] = [
    ["10.4.0.0", 26], ["10.4.0.64", 26], ["10.4.0.128", 26], ["10.4.0.192", 26],
    ["10.4.1.0", 25], ["10.4.1.128", 25], ["10.4.2.0", 27], ["10.4.2.32", 27],
    ["10.8.0.0", 22], ["10.8.4.0", 22], ["10.8.8.0", 22], ["172.16.16.0", 20],
    ["172.16.32.0", 20], ["192.168.1.0", 28], ["192.168.1.16", 28], ["10.9.0.0", 23],
  ];
  for (let index = 0; index < alignCandidates.length; index += 4) {
    const group = alignCandidates.slice(index, index + 4);
    if (group.length < 4) break;
    const marked = group.map(([ip, prefix]) => ({ ip, prefix, ok: isAligned(ip, prefix), text: `${ip}/${prefix}` }));
    const good = marked.filter((item) => item.ok);
    const bad = marked.filter((item) => !item.ok);
    if (good.length !== 1 || bad.length !== 3) continue;
    out.push(q({
      id: `g-h-align-${index}`,
      topic: "VLSM",
      difficulty: "hard",
      prompt: `Which of these is a valid subnet identifier: ${marked.map((item) => item.text).join(", ")}?`,
      correct: good[0].text,
      wrong: bad.map((item) => item.text),
      explanation: `${good[0].text} falls on its own prefix boundary, so it is a real subnet ID. The others sit in the middle of a block: masking them with their prefix length does not return the address itself. Assigning a host address as the subnet ID is a broken VLSM plan.`,
    }));
  }

  for (let index = 0; index < 8; index += 1) {
    const a = index * 2;
    const b = 64 + index;
    out.push(q({
      id: `g-h-slash31-${index}`,
      topic: "Point-to-point addressing",
      difficulty: "hard",
      prompt: `Two routers are numbered 10.255.${a}.${b}/31 and 10.255.${a}.${b + 1}/31. Which statement is correct?`,
      correct: "Both addresses are usable. RFC 3021 allows a /31 on a point-to-point link.",
      wrong: [
        "The subnet is invalid because it has no room for a broadcast address.",
        "Only the even address is usable.",
        "The subnet has 62 usable hosts.",
      ],
      explanation: `A /31 has two addresses and no broadcast. RFC 3021 makes both of them hosts, which is why leaf-spine links use /31s instead of wasting a /30. ${b} and ${b + 1} are the pair. This is not a LAN prefix; hosts that expect a broadcast will not understand it.`,
    }));
  }

  for (let index = 0; index < 16; index += 1) {
    const mid = 30 + index;
    const dest = `172.16.${mid}.9`;
    out.push(q({
      id: `g-h-lpm-ad2-${index}`,
      topic: "RIB and FIB",
      difficulty: "hard",
      prompt: `A Cisco router has a static route for 172.16.0.0/12 (distance 1) and an OSPF route for 172.16.${mid}.0/24 (distance 110). A packet goes to ${dest}. Which route forwards it?`,
      exhibit: `S   172.16.0.0/12        via 192.0.2.1   AD 1\nO   172.16.${mid}.0.0/24   via 192.0.2.2   AD 110`,
      correct: `The OSPF /24. Longest prefix match beats a better administrative distance.`,
      wrong: [
        "The static /12, because distance 1 beats distance 110.",
        "Neither. The distances conflict, so the packet is dropped.",
        "Whichever route was installed first.",
      ],
      explanation: `Administrative distance chooses between sources of one prefix length. 172.16.0.0/12 and 172.16.${mid}.0/24 are different lengths. ${dest} matches both, and the /24 is more specific, so OSPF forwards it even though its distance is 110. Distance is not a global priority over prefix length.`,
    }));
  }

  for (let third = 1; third < 40; third += 2) {
    const a = `10.6.${third}.0/24`;
    const b = `10.6.${third + 1}.0/24`;
    const cover = coveringPrefix(a, b);
    out.push(q({
      id: `g-h-sum2-${third}`,
      topic: "Summarization",
      difficulty: "hard",
      prompt: `What is the longest prefix that covers both ${a} and ${b}?`,
      correct: cover,
      wrong: [`10.6.${third}.0/23`, a, b, "10.6.0.0/16"],
      explanation: `${a} and ${b} are adjacent, but an odd-numbered /24 does not start a /23. /23 blocks are aligned pairs such as .0–.1 and .2–.3. The longest legal cover is ${cover}, and it includes extra /24s. A summary that covers space you do not actually have will attract black-holed traffic.`,
    }));
  }

  for (let index = 0; index < 12; index += 1) {
    const prefix = [25, 26, 27, 28][index % 4];
    const step = 2 ** (32 - prefix);
    const aligned = (index * step) % 256;
    const bad = [1, 2, 3].map((slot) => (aligned + Math.max(1, Math.floor(step / 4)) * slot) % 256);
    const marked = [aligned, ...bad].map((host) => {
      const ip = `10.70.${index}.${host}`;
      return { text: `${ip}/${prefix}`, ok: isAligned(ip, prefix) };
    });
    const good = marked.filter((item) => item.ok);
    const badOnes = marked.filter((item) => !item.ok);
    if (good.length !== 1 || badOnes.length !== 3) throw new Error(`align ${index} ${marked.map((item) => item.text).join(" ")}`);
    out.push(q({
      id: `g-h-align2-${index}`,
      topic: "VLSM",
      difficulty: "hard",
      prompt: `Which of these is a valid subnet identifier: ${marked.map((item) => item.text).join(", ")}?`,
      correct: good[0].text,
      wrong: badOnes.map((item) => item.text),
      explanation: `${good[0].text} is on a /${prefix} boundary, so masking it with that prefix returns the same address. The others sit inside a block and are host addresses, not subnet identifiers. A VLSM plan that uses a host address as the subnet ID will not install the way you expect.`,
    }));
  }

  const moreHosts = [17, 33, 60, 100, 120, 200, 500, 1000, 2000, 4000, 8000, 50, 80, 110, 10000, 20000];
  moreHosts.forEach((hosts) => {
    const prefix = prefixForHosts(hosts);
    out.push(q({
      id: `g-h-fit2-${hosts}`,
      topic: "Subnetting",
      difficulty: "hard",
      prompt: `A new VLAN needs ${hosts} usable hosts, reserving the network and broadcast addresses. What is the smallest prefix that works?`,
      correct: `/${prefix} (${fmt(usableCount(prefix))} usable)`,
      wrong: [
        `/${prefix + 1} (${fmt(usableCount(prefix + 1))} usable)`,
        `/${prefix - 1} (${fmt(usableCount(prefix - 1))} usable)`,
        `/${prefix + 2} (${fmt(usableCount(prefix + 2))} usable)`,
      ],
      explanation: `A /${prefix + 1} has ${fmt(usableCount(prefix + 1))} usable hosts, which is short of ${hosts}. A /${prefix} has ${fmt(usableCount(prefix))} and is the smallest prefix that fits. A /${prefix - 1} also fits, but it is a larger block than you need. Subtract two before you compare, except on a /31 point-to-point link.`,
    }));
  });

  for (let index = 0; index < 12; index += 1) {
    const cwnd = [20, 32, 48, 64, 96, 128][index % 6];
    const rwnd = [256, 128, 64, 512, 40, 80][index % 6];
    const limit = Math.min(cwnd, rwnd);
    const which = cwnd <= rwnd ? "congestion window" : "receiver window";
    out.push(q({
      id: `g-h-flight-${index}`,
      topic: "TCP",
      difficulty: "hard",
      prompt: `A connection has cwnd = ${cwnd} KB and rwnd = ${rwnd} KB. Ignoring application limits, how many kilobytes can be in flight?`,
      correct: `${limit} KB, limited by the ${which}`,
      wrong: [
        `${cwnd + rwnd} KB, the sum of the two windows`,
        `${Math.max(cwnd, rwnd)} KB, the larger window`,
        `${Math.abs(cwnd - rwnd)} KB, the difference`,
      ],
      explanation: `Bytes in flight are limited by the smaller of cwnd and rwnd. Here that is ${limit} KB, the ${which}. Raising the larger window does not help until the smaller one grows. Loss keeps cwnd down; a small socket buffer keeps rwnd down.`,
    }));
  }

  const v6Splits: [number, number][] = [[44, 64], [52, 64], [60, 64], [40, 48], [32, 48], [48, 56], [56, 60], [64, 68]];
  v6Splits.forEach(([parent, child], index) => {
    const count = 2 ** (child - parent);
    out.push(q({
      id: `g-h-v6split-${index}`,
      topic: "IPv6",
      difficulty: "hard",
      prompt: `How many /${child} prefixes fit in one IPv6 /${parent}?`,
      correct: fmt(count),
      wrong: [fmt(count / 2), fmt(count * 2), String(child - parent), fmt(parent)],
      explanation: `The difference in prefix length is ${child - parent} bits, so one /${parent} contains 2^${child - parent} = ${fmt(count)} /${child}s. A /56 delegated to a site is 256 /64 LANs. A /48 is 65536. This is allocation math, not host math: each /64 is still a whole LAN.`,
    }));
  });

  return out;
}

function hardDiagramPool(): Question[] {
  const out: Question[] = [];

  for (let index = 0; index < 12; index += 1) {
    const third = 40 + index;
    const wide = `10.${third}.0.10/24`;
    const narrow = `10.${third}.0.200/25`;
    const hosts: [string, string, string] = index % 2 === 0
      ? [wide, narrow, `10.${third}.1.10/24`]
      : [narrow, wide, `10.${third}.1.10/24`];
    const h1SeesH2 = onLink(hosts[0], hosts[1].split("/")[0]);
    const h2SeesH1 = onLink(hosts[1], hosts[0].split("/")[0]);
    if (h1SeesH2 === h2SeesH1) throw new Error(`expected asymmetric ${index}`);
    const wider = hosts[0].endsWith("/24") ? "H1" : "H2";
    out.push(q({
      id: `g-h-asym-${index}`,
      topic: "Subnetting",
      difficulty: "hard",
      prompt: `${hosts[0]} is H1 and ${hosts[1]} is H2, on one switch with no router. H3 is ${hosts[2]}. What happens between H1 and H2?`,
      diagram: threeHostDiagram(...hosts),
      correct: `${wider} believes the other is on-link, but the /25 host does not, so a two-way conversation fails.`,
      wrong: [
        "They communicate normally. The wider mask includes both.",
        "Neither considers the other on-link.",
        "H3 translates between them because it is in a third subnet.",
      ],
      explanation: `The /24 includes 10.${third}.0.200, so that host ARPs directly. The /25 covering .200 is 10.${third}.0.128/25, which does not include .10, so the /25 host sends that traffic to a gateway it does not have. On-link has to be true in both directions. H3 is a distractor in another subnet.`,
    }));
  }

  [10, 20, 30, 40, 50, 100, 200, 300, 400, 15].forEach((native, index) => {
    const other = native + 5;
    out.push(q({
      id: `g-h-native-${index}`,
      topic: "Native VLAN",
      difficulty: "hard",
      prompt: `The trunk's native VLAN is ${native}. An untagged frame arrives on that trunk. Which VLAN does the switch put it in?`,
      diagram: trunkDiagram(native, other, native),
      correct: `VLAN ${native}`,
      wrong: [`VLAN ${other}`, "It is dropped. Trunks accept only tagged frames.", "VLAN 0"],
      explanation: `Untagged frames on a trunk belong to the native VLAN, here VLAN ${native}. That is also the VLAN a switch transmits untagged. Mismatched native VLANs between the two ends merge two broadcast domains and are a classic outage and VLAN-hopping concern. Tagged frames are unaffected.`,
    }));
  });

  for (const hold of [30, 90, 180]) {
    for (const spines of [2, 4]) {
      out.push(q({
        id: `g-h-silent-${hold}-${spines}`,
        topic: "Failure detection",
        difficulty: "hard",
        prompt: `There are ${spines} spines. The marked link stays up and silently discards traffic. BGP hold time is ${hold} seconds and BFD is off. How long can flows hashed onto that link black-hole?`,
        diagram: {
          ...spineDiagram(spines, 0),
          edges: spineDiagram(spines, 0).edges.map((edge) => edge.state === "down"
            ? { ...edge, state: "degraded" as const, label: "silent drop" }
            : edge),
          note: "Both devices still show the link as up.",
        },
        correct: `About ${hold} seconds. The interface never went down, so only the hold timer withdraws the neighbor.`,
        wrong: [
          "A few milliseconds. A link that drops packets withdraws routes immediately.",
          "Until STP reconverges.",
          "They do not black-hole. ECMP removes a lossy link on the next packet.",
        ],
        explanation: `ECMP does not watch loss. While the interface is up, the next hop stays. BGP will not declare the neighbor dead until the hold time of ${hold} seconds expires. A real link-down would be immediate. BFD is what makes a silent failure converge in a fraction of a second.`,
      }));
    }
  }

  for (const spines of [2, 3, 4]) {
    out.push(q({
      id: `g-h-down-paths-${spines}`,
      topic: "Link failure",
      difficulty: "hard",
      prompt: `The fabric has ${spines} spines and the marked link is physically down. How many equal-cost spine paths remain for a flow between the leaves?`,
      diagram: spineDiagram(spines, 0),
      correct: String(spines - 1),
      wrong: [String(spines), "0 until the hold timer expires", "1, because the first failure also blocks the other spines"],
      explanation: `Interface down removes that adjacency at once. ${spines - 1} spines are still connected, so ECMP shrinks to ${spines - 1} paths. You do not wait for a BGP hold timer when the link itself is down, and STP is not in this routed path.`,
    }));
    out.push(q({
      id: `g-h-down-hops-${spines}`,
      topic: "Link failure",
      difficulty: "hard",
      prompt: `This fabric started with ${spines} spines. After the marked link fails, a flow moves to a remaining spine. How many switches are on the path between a server on Leaf A and a server on Leaf B?`,
      diagram: spineDiagram(spines, 0),
      correct: "3: Leaf A, one remaining spine, and Leaf B",
      wrong: [
        `${spines}, one per original spine`,
        "2, because a failed link shortens the path",
        "4, counting both servers",
      ],
      explanation: `The flow still goes leaf → one spine → leaf. That is three switches. Losing a spine removes a choice, it does not remove the spine tier. Servers are not switches, and the flow does not visit the down spine.`,
    }));
  }

  for (let index = 0; index < 12; index += 1) {
    const client = 3000 + index * 19;
    const server = 6000 + index * 23;
    out.push(q({
      id: `g-h-hs-${index}`,
      topic: "TCP handshake",
      difficulty: "hard",
      prompt: `Client ISN ${client}, server ISN ${server}. The handshake below will fail. Which correction makes the third segment valid?`,
      diagram: handshakeDiagram(client, server),
      correct: `Set ack to ${server + 1}. The server SYN consumed sequence ${server}.`,
      wrong: [
        `Set ack to ${server}. The diagram is already right.`,
        `Set seq to ${client} and leave ack at ${server}.`,
        `The server should have acknowledged ${client}, not ${client + 1}.`,
      ],
      explanation: `SYN consumes a sequence number on both ends. The server's ack ${client + 1} is correct. The client's ack must be ${server + 1}, not ${server}. Routers do not fix this; if the numbers are wrong, the handshake never completes.`,
    }));
  }

  const failed = [
    [32, 25, 4, 100], [48, 10, 4, 40], [24, 10, 4, 40], [16, 25, 2, 100],
    [32, 10, 4, 40], [48, 10, 6, 40], [16, 10, 2, 40], [24, 25, 2, 100],
    [40, 10, 4, 100], [8, 25, 2, 100],
  ] as const;
  failed.forEach(([servers, serverSpeed, uplinks, uplinkSpeed], index) => {
    if (uplinks < 2 || uplinks > 4) return;
    const up = (uplinks - 1) * uplinkSpeed;
    const down = servers * serverSpeed;
    const label = ratioLabel(down, up);
    const parts = label.split(":").map(Number);
    if (parts[0] > 8 || parts[1] > 8) return;
    const ups = Array.from({ length: uplinks }, (_, uplink) => ({
      name: `Up ${uplink + 1}`,
      speed: `${uplinkSpeed}G`,
      down: uplink === 0,
    }));
    out.push(q({
      id: `g-h-over-down-${index}`,
      topic: "Oversubscription",
      difficulty: "hard",
      prompt: `The leaf has ${servers}×${serverSpeed}G server ports and ${uplinks}×${uplinkSpeed}G uplinks. One uplink is down, as marked. What is the oversubscription on the links that are still up?`,
      diagram: oversubDiagram(`${servers}×${serverSpeed}G`, ups),
      correct: label,
      wrong: [
        ratioLabel(down, uplinks * uplinkSpeed),
        ratioLabel(servers, uplinks - 1),
        ratioLabel(up, down),
      ],
      explanation: `Server bandwidth is still ${down}G. One ${uplinkSpeed}G uplink is down, leaving ${(uplinks - 1) * uplinkSpeed}G, so the ratio is ${label}. Quoting the design ratio from when every uplink was up hides the failure. The leaf is more oversubscribed until that link returns.`,
    }));
  });

  for (let index = 0; index < 16; index += 1) {
    const third = 60 + index;
    const low = index % 2 === 0;
    const h1 = low ? `10.${third}.0.10/25` : `10.${third}.0.140/25`;
    const h2 = low ? `10.${third}.0.40/25` : `10.${third}.0.180/25`;
    const h3 = low ? `10.${third}.0.200/25` : `10.${third}.0.10/25`;
    out.push(pairQuestion(`g-h-pair-${index}`, "hard", [h1, h2, h3]));
  }

  for (let index = 0; index < 30; index += 1) {
    const third = index + 1;
    const odd = index % 3;
    const low = `10.${third}.2.10/27`;
    const mid = `10.${third}.2.20/27`;
    const high = `10.${third}.2.40/27`;
    const hosts: [string, string, string] = odd === 0
      ? [high, low, mid]
      : odd === 1
        ? [low, high, mid]
        : [low, mid, high];
    out.push(pairQuestion(`g-h-pairb-${index}`, "hard", hosts));
  }

  return out;
}

function takeExact(label: string, need: number, pool: Question[], banned: Set<string>): Question[] {
  if (need < 0) throw new Error(`${label} is already over target by ${-need}`);
  const taken: Question[] = [];
  const seen = new Set<string>();
  for (const question of pool) {
    if (banned.has(question.prompt) || seen.has(question.prompt) || seen.has(question.id)) continue;
    seen.add(question.prompt);
    seen.add(question.id);
    taken.push(question);
    if (taken.length === need) return taken;
  }
  throw new Error(`${label}: built ${taken.length}, need ${need}, pool ${pool.length}`);
}

export function generatedQuestions(existing: readonly Question[]): Question[] {
  selfTest();
  const banned = new Set(existing.map((question) => question.prompt));
  const need = (difficulty: Difficulty, diagram: boolean) => {
    const have = existing.filter((question) => question.difficulty === difficulty && Boolean(question.diagram) === diagram).length;
    const target = diagram ? DIAGRAM_TARGET[difficulty] : TARGET[difficulty] - DIAGRAM_TARGET[difficulty];
    return target - have;
  };
  const selected = [
    ...takeExact("easy text", need("easy", false), easyTextPool(), banned),
    ...takeExact("easy diagram", need("easy", true), easyDiagramPool(), banned),
    ...takeExact("medium text", need("medium", false), mediumTextPool(), banned),
    ...takeExact("medium diagram", need("medium", true), mediumDiagramPool(), banned),
    ...takeExact("hard text", need("hard", false), hardTextPool(), banned),
    ...takeExact("hard diagram", need("hard", true), hardDiagramPool(), banned),
  ];
  const ids = new Set(existing.map((question) => question.id));
  for (const question of selected) {
    if (ids.has(question.id)) throw new Error(`id collision ${question.id}`);
    ids.add(question.id);
  }
  return selected;
}
