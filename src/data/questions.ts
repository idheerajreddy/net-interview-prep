import type { Question } from "../types";

const questionBank: Question[] = [
  {
    id: "e-osi-ip",
    topic: "Layering",
    difficulty: "easy",
    prompt: "IP lives at which layer of the OSI model?",
    choices: [
      { id: "a", text: "Data link" },
      { id: "b", text: "Network" },
      { id: "c", text: "Transport" },
      { id: "d", text: "Session" },
    ],
    answer: "b",
    explanation:
      "IP is a network-layer protocol. Ethernet and MAC addresses sit at the data link layer. TCP and UDP sit at transport. The TCP/IP model uses the name Internet layer for the same job.\n\nIn an interview: name the layer, then say what that layer is responsible for — forwarding packets between networks, not delivering bytes on one link and not providing a reliable byte stream.",
  },
  {
    id: "e-switch-mac",
    topic: "Switching",
    difficulty: "easy",
    prompt: "A switch receives a unicast Ethernet frame whose destination MAC is already in its table. How does it forward the frame?",
    choices: [
      { id: "a", text: "It floods the frame out of every port in the VLAN." },
      { id: "b", text: "It forwards the frame only out of the port where that MAC was learned." },
      { id: "c", text: "It chooses an output port with longest-prefix match on the IP address." },
      { id: "d", text: "It sends the frame to the host's default gateway." },
    ],
    answer: "b",
    explanation:
      "A switch learns source MACs as frames arrive, then forwards known unicast to the single port for that destination. Unknown unicast, broadcast, and (unless snooped) multicast are flooded. A hub floods everything. Longest-prefix match is a router behavior.\n\nIn an interview: say “destination MAC lookup in the CAM or MAC table, learned from source MACs.” Mention the flood case so it doesn’t sound like you forgot it.",
  },
  {
    id: "e-tcp-vs-udp",
    topic: "Transport",
    difficulty: "easy",
    prompt: "Which statement about TCP and UDP is accurate?",
    choices: [
      { id: "a", text: "UDP retransmits lost datagrams and preserves order." },
      { id: "b", text: "TCP provides a reliable, ordered byte stream and has congestion control. UDP does neither." },
      { id: "c", text: "Both protocols require a three-way handshake before data can be sent." },
      { id: "d", text: "TCP is always faster because it skips checksums." },
    ],
    answer: "b",
    explanation:
      "TCP adds connection setup, retransmission, in-order delivery, flow control, and congestion control. UDP is a best-effort datagram protocol: no handshake, no retransmission, no ordering. Applications such as DNS queries and RTP often want that, and they add their own reliability if they need it.\n\nIn an interview: don’t say “UDP is unreliable so it is bad.” Say what the application has to take on itself if it chooses UDP.",
  },
  {
    id: "e-slash24",
    topic: "Subnetting",
    difficulty: "easy",
    prompt: "How many usable IPv4 host addresses are in a normal /24 network?",
    choices: [
      { id: "a", text: "256" },
      { id: "b", text: "254" },
      { id: "c", text: "255" },
      { id: "d", text: "128" },
    ],
    answer: "b",
    explanation:
      "A /24 has 2^(32−24) = 256 addresses. The all-zero address is the network address and the all-ones address is the broadcast, so 254 are usable hosts. /31 (point-to-point, RFC 3021) and /32 (host route) are the exceptions people follow up with.",
  },
  {
    id: "e-what-vlan",
    topic: "VLANs",
    difficulty: "easy",
    prompt: "What does a VLAN actually do?",
    choices: [
      { id: "a", text: "It encrypts traffic between two hosts." },
      { id: "b", text: "It splits one physical switch into separate layer-2 broadcast domains." },
      { id: "c", text: "It selects the BGP best path." },
      { id: "d", text: "It raises the MTU of a link." },
    ],
    answer: "b",
    explanation:
      "A VLAN is a logical layer-2 segment. Ports in different VLANs do not flood broadcasts to each other, even on the same switch. It is not encryption, and it is not a routing protocol. To move traffic between VLANs you need a router or an SVIs on a layer-3 switch.",
  },
  {
    id: "e-arp",
    topic: "ARP",
    difficulty: "easy",
    prompt: "What does ARP resolve?",
    choices: [
      { id: "a", text: "A hostname to an IPv4 address." },
      { id: "b", text: "An IPv4 address to a MAC address, on the local link." },
      { id: "c", text: "An autonomous system number to a prefix." },
      { id: "d", text: "A URL to a TLS certificate." },
    ],
    answer: "b",
    explanation:
      "ARP asks “who has this IPv4 address?” on a broadcast domain and caches the MAC that answers. DNS resolves names. IPv6 uses Neighbor Discovery instead of ARP.\n\nIn an interview: add that a host ARPs for the destination only when it is on-link. Otherwise it ARPs for the default gateway.",
  },
  {
    id: "e-aaaa",
    topic: "DNS",
    difficulty: "easy",
    prompt: "Which DNS record type stores an IPv6 address?",
    choices: [
      { id: "a", text: "A" },
      { id: "b", text: "AAAA" },
      { id: "c", text: "MX" },
      { id: "d", text: "NS" },
    ],
    answer: "b",
    explanation:
      "An A record holds an IPv4 address. AAAA holds IPv6. MX names a mail exchanger. NS delegates a zone to a nameserver. PTR is the reverse mapping, from address back to a name.",
  },
  {
    id: "e-east-west",
    topic: "Data center traffic",
    difficulty: "easy",
    prompt: "In a data center, east-west traffic is best described as:",
    choices: [
      { id: "a", text: "Traffic between servers inside the data center." },
      { id: "b", text: "Traffic from servers out to the internet or another site." },
      { id: "c", text: "Only replication between regions." },
      { id: "d", text: "SSH to management interfaces." },
    ],
    answer: "a",
    explanation:
      "East-west stays inside the data center: app tier to database, VM to VM, storage to compute. North-south crosses the edge toward users, the internet, or another site. Modern fabrics are built for a lot of east-west bandwidth, which is why leaf-spine replaced a single huge core.",
  },
  {
    id: "e-rfc1918",
    topic: "Addressing",
    difficulty: "easy",
    prompt: "Which of these IPv4 addresses is publicly routable, rather than RFC 1918 private space?",
    choices: [
      { id: "a", text: "10.4.4.4" },
      { id: "b", text: "192.168.50.2" },
      { id: "c", text: "172.20.1.1" },
      { id: "d", text: "172.32.5.5" },
    ],
    answer: "d",
    explanation:
      "RFC 1918 is 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. The /12 covers 172.16.0.0 through 172.31.255.255, so 172.20.1.1 is private and 172.32.5.5 is not. 169.254.0.0/16 is link-local, a different special range, and is also not public.",
  },
  {
    id: "e-default-gw",
    topic: "Host forwarding",
    difficulty: "easy",
    prompt: "A host needs to send a packet to an IP address outside its own subnet. What does it do?",
    choices: [
      { id: "a", text: "ARP for the remote destination IP and frame the packet to that MAC." },
      { id: "b", text: "ARP for its default gateway, then frame the packet to the gateway's MAC." },
      { id: "c", text: "Send a BGP update so the destination learns the host's MAC." },
      { id: "d", text: "Flood the packet as unknown unicast on every VLAN." },
    ],
    answer: "b",
    explanation:
      "The host’s routing decision is small: on-link destinations are ARPed directly; everything else goes to a gateway on the same layer-2 segment. The gateway routes from there. The destination MAC changes at every hop; the destination IP does not, unless something NATs it.",
  },
  {
    id: "e-broadcast-domain",
    topic: "Broadcast domains",
    difficulty: "easy",
    prompt: "Which boundary creates a separate broadcast domain?",
    choices: [
      { id: "a", text: "Cabling another switch into the same VLAN." },
      { id: "b", text: "A router between two subnets, or putting ports into different VLANs." },
      { id: "c", text: "Enabling jumbo frames." },
      { id: "d", text: "Adding a default route on a server." },
    ],
    answer: "b",
    explanation:
      "Broadcasts flood a VLAN. Adding switches to that VLAN makes the domain larger, not smaller. A different VLAN is a different domain. A router does not forward broadcasts onto the next subnet. STP can block a port to stop a loop, but the VLAN is still one broadcast domain.",
  },
  {
    id: "e-mac-rewrite",
    topic: "Forwarding",
    difficulty: "easy",
    prompt: "A packet crosses three routers and nothing is doing NAT. What stays the same end to end?",
    choices: [
      { id: "a", text: "The source and destination MAC addresses." },
      { id: "b", text: "The source and destination IP addresses." },
      { id: "c", text: "The VLAN ID on every link." },
      { id: "d", text: "The TTL, which routers are required to preserve." },
    ],
    answer: "b",
    explanation:
      "Each router rewrites the source and destination MAC for the next hop, and it decrements TTL. The IP addresses stay constant unless NAT changes them. VLAN IDs are local to a layer-2 segment. TCP ports and sequence numbers also stay put; they are not part of the layer-3 rewrite.",
  },
  {
    id: "e-mtu",
    topic: "MTU",
    difficulty: "easy",
    prompt: "What does an interface MTU limit?",
    choices: [
      { id: "a", text: "How many VLANs the interface may trunk." },
      { id: "b", text: "The largest packet that interface can transmit without fragmentation." },
      { id: "c", text: "The TCP receive window." },
      { id: "d", text: "The BGP hold timer." },
    ],
    answer: "b",
    explanation:
      "MTU is the maximum transmission unit of the link. Standard Ethernet is a 1500-byte IP packet. A larger IPv4 packet is fragmented only if the Don’t Fragment bit is clear; otherwise it is dropped. IPv6 is not fragmented by routers. Data centers often raise the fabric MTU so servers can use jumbo frames, commonly around 9000 bytes.",
  },
  {
    id: "e-tor-leaf",
    topic: "Leaf-spine",
    difficulty: "easy",
    prompt: "In a classic two-tier leaf-spine data center, where do servers connect?",
    choices: [
      { id: "a", text: "Directly to the spines, to keep the path short." },
      { id: "b", text: "To leaf switches, often a top-of-rack switch." },
      { id: "c", text: "Only to one core router for the whole building." },
      { id: "d", text: "To each other, in a ring." },
    ],
    answer: "b",
    explanation:
      "Leaves are the access tier. A top-of-rack switch is a leaf. Servers single-home or dual-home to leaves. Spines exist to interconnect leaves: every leaf connects to every spine, and servers are not attached to spines. East-west traffic between racks goes leaf → spine → leaf.",
  },
  {
    id: "e-hop-count",
    topic: "Leaf-spine",
    difficulty: "easy",
    prompt: "Server A and Server B are on different leaves. One flow uses a single spine. How many switches are on the path between the two servers?",
    diagram: {
      kind: "topology",
      title: "Two servers, two leaves, two spines",
      nodes: [
        { id: "sa", label: "Spine A", x: 28, y: 8, kind: "switch" },
        { id: "sb", label: "Spine B", x: 72, y: 8, kind: "switch" },
        { id: "l1", label: "Leaf 1", x: 28, y: 48, kind: "switch" },
        { id: "l3", label: "Leaf 3", x: 72, y: 48, kind: "switch" },
        { id: "a", label: "Server A", detail: "10.1.1.10", x: 28, y: 86, kind: "server" },
        { id: "b", label: "Server B", detail: "10.8.8.20", x: 72, y: 86, kind: "server" },
      ],
      edges: [
        { from: "a", to: "l1" },
        { from: "b", to: "l3" },
        { from: "l1", to: "sa" },
        { from: "l1", to: "sb" },
        { from: "l3", to: "sa" },
        { from: "l3", to: "sb" },
      ],
      note: "Every leaf is connected to every spine. The flow is hashed onto one spine, not both.",
    },
    choices: [
      { id: "a", text: "2 — one switch per tier." },
      { id: "b", text: "3 — the source leaf, one spine, and the destination leaf." },
      { id: "c", text: "4 — both spines are always on the path of one flow." },
      { id: "d", text: "5 — both servers count as switches." },
    ],
    answer: "b",
    explanation:
      "The packet goes Server A → Leaf 1 → one spine → Leaf 3 → Server B. That is three switches. ECMP picks one of the equal-cost spines for the flow; it does not stripe this flow across both spines. The two tiers are leaf and spine, but the path still enters a leaf, crosses a spine, and exits a leaf.",
  },
  {
    id: "e-clos-link",
    topic: "Leaf-spine",
    difficulty: "easy",
    prompt: "Link X was cabled between the two spines. What is wrong with that, in a classic two-tier leaf-spine fabric?",
    diagram: {
      kind: "topology",
      title: "Leaf-spine with one extra link",
      nodes: [
        { id: "sa", label: "Spine A", x: 28, y: 12, kind: "switch" },
        { id: "sb", label: "Spine B", x: 72, y: 12, kind: "switch" },
        { id: "l1", label: "Leaf 1", x: 16, y: 62, kind: "switch" },
        { id: "l2", label: "Leaf 2", x: 50, y: 62, kind: "switch" },
        { id: "l3", label: "Leaf 3", x: 84, y: 62, kind: "switch" },
      ],
      edges: [
        { from: "sa", to: "sb", label: "link X" },
        { from: "l1", to: "sa" },
        { from: "l1", to: "sb" },
        { from: "l2", to: "sa" },
        { from: "l2", to: "sb" },
        { from: "l3", to: "sa" },
        { from: "l3", to: "sb" },
      ],
      note: "Leaves are fully meshed to spines. Link X is the extra cable.",
    },
    choices: [
      { id: "a", text: "Nothing. Spines must be fully meshed to each other." },
      { id: "b", text: "Spines connect only to leaves. A spine-to-spine link is not part of two-tier Clos and adds an unplanned path." },
      { id: "c", text: "Link X is required so that STP has a root." },
      { id: "d", text: "Leaves are not allowed to connect to more than one spine." },
    ],
    answer: "b",
    explanation:
      "In two-tier leaf-spine, every leaf connects to every spine, and spines do not connect to each other or to servers. Paths between leaves are exactly one spine hop, which keeps ECMP simple. A spine-to-spine cable creates another path the routing design did not account for. A leaf-to-leaf cable would be the same kind of mistake.",
  },
  {
    id: "e-same-subnet",
    topic: "Subnetting",
    difficulty: "easy",
    prompt: "All three hosts sit on one switch in the same VLAN. There is no router. Which pair can exchange packets?",
    diagram: {
      kind: "topology",
      title: "One VLAN, three addresses",
      nodes: [
        { id: "sw", label: "Switch", x: 50, y: 48, kind: "switch" },
        { id: "h1", label: "H1", detail: "10.0.0.5/24", x: 16, y: 16, kind: "host" },
        { id: "h2", label: "H2", detail: "10.0.0.9/24", x: 84, y: 16, kind: "host" },
        { id: "h3", label: "H3", detail: "10.0.1.5/24", x: 50, y: 86, kind: "host" },
      ],
      edges: [
        { from: "h1", to: "sw" },
        { from: "h2", to: "sw" },
        { from: "h3", to: "sw" },
      ],
    },
    choices: [
      { id: "a", text: "H1 and H3 only." },
      { id: "b", text: "H1 and H2. H3 is in a different subnet and has no gateway to reach them." },
      { id: "c", text: "All three, because they share a switch." },
      { id: "d", text: "None. A router is required even inside a /24." },
    ],
    answer: "b",
    explanation:
      "Sharing a switch means they share a broadcast domain, not that every IP can talk. H1 and H2 are both in 10.0.0.0/24, so each treats the other as on-link and ARPs directly. H3 is in 10.0.1.0/24. It will look for a gateway to reach 10.0.0.0/24, and there isn’t one.",
  },
  {
    id: "e-arp-target",
    topic: "ARP",
    difficulty: "easy",
    prompt: "Host .10 is about to send an IP packet to host .25. Whose MAC does it resolve with ARP before the first frame goes out?",
    diagram: {
      kind: "topology",
      title: "One subnet and its gateway",
      nodes: [
        { id: "r", label: "Gateway", detail: "10.0.0.1/24", x: 50, y: 12, kind: "router" },
        { id: "sw", label: "Switch", x: 50, y: 48, kind: "switch" },
        { id: "h1", label: "Host", detail: "10.0.0.10/24", x: 18, y: 84, kind: "host" },
        { id: "h2", label: "Host", detail: "10.0.0.25/24", x: 82, y: 84, kind: "host" },
      ],
      edges: [
        { from: "r", to: "sw" },
        { from: "h1", to: "sw" },
        { from: "h2", to: "sw" },
      ],
    },
    choices: [
      { id: "a", text: "The gateway, 10.0.0.1, because every packet goes to the router first." },
      { id: "b", text: "10.0.0.25, because that destination is on the host's own subnet." },
      { id: "c", text: "Both. It ARPs for the destination and the gateway and picks the faster reply." },
      { id: "d", text: "Neither. Same-subnet delivery uses DNS, not ARP." },
    ],
    answer: "b",
    explanation:
      "10.0.0.10/24 and 10.0.0.25/24 are on-link to each other. The sender ARPs for 10.0.0.25 and frames the packet to that MAC. The gateway is used only when the destination IP is outside 10.0.0.0/24. ARPing for the gateway here would send the packet on an unnecessary extra hop — if the gateway accepted it at all.",
  },
  {
    id: "m-lpm",
    topic: "Longest prefix match",
    difficulty: "medium",
    prompt: "A packet arrives for 10.1.8.20. Which next hop does the router use?",
    exhibit: "10.1.0.0/16  via A\n10.1.8.0/21  via B\n10.1.8.0/24  via C\n0.0.0.0/0    via D",
    choices: [
      { id: "a", text: "Next hop A, because the /16 is the covering aggregate." },
      { id: "b", text: "Next hop B, because the /21 is more specific than /16 and covers the address." },
      { id: "c", text: "Next hop C, because longest prefix match selects the /24." },
      { id: "d", text: "Next hop D, because a default route wins whenever it is present." },
    ],
    answer: "c",
    explanation:
      "10.1.8.20 sits inside the /24, the /21, the /16, and the default. Forwarding uses the longest matching prefix, so /24 via C wins. Administrative distance is not consulted here: these are different prefixes, and all of them can sit in the table together.\n\nIn an interview: “Most specific route wins. AD only chooses between equal prefixes learned from different sources.”",
  },
  {
    id: "m-time-wait",
    topic: "TCP close",
    difficulty: "medium",
    prompt: "After a normal TCP close, which endpoint sits in TIME_WAIT, and why does that state exist?",
    choices: [
      { id: "a", text: "The passive closer, for one RTT, so it can reuse the port immediately." },
      { id: "b", text: "The active closer — the side that sent the first FIN — for 2×MSL, so delayed segments from this connection cannot be accepted by a new one." },
      { id: "c", text: "The default gateway, until its ARP cache expires." },
      { id: "d", text: "Whichever side has the lower IP address, for 10 seconds." },
    ],
    answer: "b",
    explanation:
      "The side that sends the first FIN is the active closer. After it ACKs the peer’s FIN it waits two maximum segment lifetimes. That absorbs delayed duplicates so they are not delivered to a later connection that reused the same 4-tuple, and it lets the final ACK be retransmitted if the peer repeats its FIN.\n\nIn an interview: servers would rather the client close first, so TIME_WAIT accumulates on clients instead of on the server.",
  },
  {
    id: "m-slash26",
    topic: "Subnetting",
    difficulty: "medium",
    prompt: "How many usable host addresses are in an IPv4 /26?",
    choices: [
      { id: "a", text: "64" },
      { id: "b", text: "62" },
      { id: "c", text: "30" },
      { id: "d", text: "126" },
    ],
    answer: "b",
    explanation:
      "A /26 has 2^(32−26) = 64 addresses. Subtract the network and broadcast addresses and 62 remain. A /27 has 30 usable hosts; a /25 has 126. The block size of a /26 is 64, so subnets fall on boundaries such as .0, .64, .128, and .192.",
  },
  {
    id: "m-bgp-session",
    topic: "BGP",
    difficulty: "medium",
    prompt: "A BGP session between two routers is carried on which transport?",
    choices: [
      { id: "a", text: "UDP port 520." },
      { id: "b", text: "TCP port 179." },
      { id: "c", text: "GRE, with no transport port." },
      { id: "d", text: "ICMP echo requests." },
    ],
    answer: "b",
    explanation:
      "BGP uses TCP 179. TCP gives it reliable, ordered delivery for a routing table that can be very large, so BGP itself does not implement retransmission. The cost is that the session depends on reachability between the peers, and failure detection is tied to the hold timer unless you add BFD. UDP 520 is RIP.",
  },
  {
    id: "m-lp-med",
    topic: "BGP policy",
    difficulty: "medium",
    prompt: "You peer with one ISP on two links. You want that ISP to prefer link A for traffic coming into your network. Which action influences the ISP's choice?",
    choices: [
      { id: "a", text: "Set a higher local preference for link A on your own router." },
      { id: "b", text: "Advertise a longer AS path on link B (prepend), or a worse MED on link B if the ISP honors MED." },
      { id: "c", text: "Lower the OSPF cost of link A inside your network." },
      { id: "d", text: "Raise the MTU on link A." },
    ],
    answer: "b",
    explanation:
      "Local preference steers your outbound traffic and is not sent to an eBGP neighbor. OSPF cost is internal. To influence inbound traffic you change what you advertise: AS-path prepending makes one exit look longer, and MED asks the neighbor to prefer a lower value. MED is a hint the neighbor can ignore; prepending is cruder and more often honored.\n\nIn an interview: “Local pref out, prepend or MED in.”",
  },
  {
    id: "m-vxlan",
    topic: "VXLAN",
    difficulty: "medium",
    prompt: "What does VXLAN provide?",
    choices: [
      { id: "a", text: "A policy language for selecting BGP routes." },
      { id: "b", text: "An overlay that carries Ethernet frames across a UDP/IP underlay, identified by a 24-bit VNI." },
      { id: "c", text: "A replacement for TCP congestion control." },
      { id: "d", text: "Hop-by-hop bridging of a 12-bit VLAN across the spines." },
    ],
    answer: "b",
    explanation:
      "VXLAN encapsulates an Ethernet frame in UDP/IP. The IANA destination port is 4789. The VXLAN network identifier is 24 bits, so it is much larger than a 12-bit VLAN ID. The underlay is a routed fabric; the overlay can still look like one layer-2 segment to the servers.\n\nVXLAN is the encapsulation. Flood-and-learn or EVPN is the control plane. It does not replace BGP.",
  },
  {
    id: "m-ecmp",
    topic: "ECMP",
    difficulty: "medium",
    prompt: "A leaf has two equal-cost 100G uplinks and ECMP is enabled. What does that mean for traffic?",
    choices: [
      { id: "a", text: "Each TCP flow is striped packet by packet across both links." },
      { id: "b", text: "Each flow is hashed onto one link. Many flows together can fill both links." },
      { id: "c", text: "STP blocks one uplink so only one path is active." },
      { id: "d", text: "The leaf uses only the uplink whose neighbor has the higher router ID." },
    ],
    answer: "b",
    explanation:
      "ECMP spreads flows, not packets of one flow. A hash of header fields (typically the 5-tuple) pins a flow to one next hop so TCP does not see reordering. One connection cannot exceed a single 100G link. The benefit shows up across many connections. Per-packet striping exists in some devices and is usually avoided for TCP.",
  },
  {
    id: "m-dot1q",
    topic: "802.1Q",
    difficulty: "medium",
    prompt: "Which description of an 802.1Q tag is right?",
    choices: [
      { id: "a", text: "Four bytes, with a 12-bit VLAN ID. VLAN IDs 1 through 4094 are usable." },
      { id: "b", text: "Two bytes, with an 8-bit VLAN ID." },
      { id: "c", text: "It replaces the destination MAC address." },
      { id: "d", text: "It carries a 24-bit VNI, the same identifier VXLAN uses." },
    ],
    answer: "a",
    explanation:
      "The tag is 4 bytes inserted after the source MAC. The TPID is 0x8100. The VLAN ID is 12 bits: 0 and 4095 are reserved, leaving 4094 usable VLANs. A trunk carries tagged frames for many VLANs. An access port is in one VLAN and usually sends the frame untagged toward the host. A VNI is the overlay identifier, not the 802.1Q ID.",
  },
  {
    id: "m-nat",
    topic: "NAT",
    difficulty: "medium",
    prompt: "Servers share one public address with PAT (source NAT). No static mapping or load balancer is configured. Which new connection succeeds?",
    choices: [
      { id: "a", text: "An internet client opening TCP 443 straight to a server's private address." },
      { id: "b", text: "No unsolicited inbound connection. Only flows the server initiates are mapped on the way out." },
      { id: "c", text: "Any inbound packet, because PAT is symmetric by default." },
      { id: "d", text: "Inbound ICMP only. TCP cannot be translated." },
    ],
    answer: "b",
    explanation:
      "When a server opens an outbound connection, the NAT device records the private tuple and the translated port. Return traffic matches that record. An unsolicited inbound packet has no record, so it is dropped. Publishing a service takes a static destination NAT, a port forward, or a load balancer VIP.\n\nIn an interview: also mention that NAT breaks protocols that embed IP addresses in the payload, and that it hides the real server address from the outside.",
  },
  {
    id: "m-ospf-backbone",
    topic: "OSPF",
    difficulty: "medium",
    prompt: "An OSPF network has area 1 and area 2. There is no area 0, and no virtual link. What is the consequence?",
    choices: [
      { id: "a", text: "Nothing. Non-backbone areas form adjacencies with each other directly." },
      { id: "b", text: "Inter-area routing does not work as designed. Every area must attach to the backbone, area 0." },
      { id: "c", text: "OSPF refuses to use more than one area ID, so area 2 is ignored." },
      { id: "d", text: "Area 1 automatically becomes the backbone because it was configured first." },
    ],
    answer: "b",
    explanation:
      "OSPF is a two-level hierarchy. Area border routers connect each area to area 0, and inter-area traffic transits the backbone. Areas 1 and 2 do not exchange routes with each other just because both run OSPF. A virtual link can stitch a disconnected area back to area 0, and interviewers usually want to hear that it is a last resort, not the design.",
  },
  {
    id: "m-bum",
    topic: "Overlay forwarding",
    difficulty: "medium",
    prompt: "In a VXLAN fabric, BUM traffic is:",
    choices: [
      { id: "a", text: "Another name for ECMP: best path, unequal cost, multipath." },
      { id: "b", text: "Broadcast, unknown unicast, and multicast." },
      { id: "c", text: "Only BGP keepalive packets." },
      { id: "d", text: "Frames that failed a CRC check." },
    ],
    answer: "b",
    explanation:
      "Known unicast is encapsulated to the one remote VTEP that owns the destination MAC. Broadcast, unknown unicast, and multicast have no single destination, so a VTEP may have to replicate them. That replication is the expensive part of an overlay. ARP suppression and IGMP snooping exist to shrink how much BUM you flood.",
  },
  {
    id: "m-lacp",
    topic: "Link aggregation",
    difficulty: "medium",
    prompt: "A server is dual-attached to a leaf with two 100G members in one LACP bundle. How much bandwidth can a single TCP flow use?",
    choices: [
      { id: "a", text: "200 Gbps. LACP stripes that flow's packets across both members." },
      { id: "b", text: "At most 100 Gbps. The hash pins the flow to one member." },
      { id: "c", text: "100 Gbps only after STP unblocks the second member." },
      { id: "d", text: "Whichever member has the lower MAC, shared by every flow from the server." },
    ],
    answer: "b",
    explanation:
      "LACP negotiates which links are in the bundle and pulls a failed member out. Hashing places each flow on one member so packets stay in order. The server gets 200G of capacity across many flows, not 200G for one flow. If a single flow needs more than one link, you need a faster link, not a wider bundle.",
  },
  {
    id: "m-pmtud",
    topic: "PMTUD",
    difficulty: "medium",
    prompt: "SSH to a server works, but a large file transfer to the same server hangs. The sender sets the Don't Fragment bit. What is a credible cause?",
    choices: [
      { id: "a", text: "BGP MED on the server's prefix is higher than 100." },
      { id: "b", text: "Some link on the path has a smaller MTU, large packets are dropped, and ICMP Fragmentation Needed is not reaching the sender." },
      { id: "c", text: "The TCP handshake used port 22, which cannot carry bulk data." },
      { id: "d", text: "The sender's ARP cache for the server expired." },
    ],
    answer: "b",
    explanation:
      "Small packets (the SSH handshake and keystrokes) fit every MTU on the path. Bulk segments are larger. If a router cannot forward them and DF is set, it should drop them and send ICMP type 3 code 4 with the next-hop MTU. When that ICMP is filtered, the sender never learns to reduce its size. The connection looks up and then stalls. This is a PMTUD black hole.\n\nThe same story shows up in data centers when servers use jumbo frames and one transit link does not.",
  },
  {
    id: "m-anycast",
    topic: "Anycast",
    difficulty: "medium",
    prompt: "What does anycast mean?",
    choices: [
      { id: "a", text: "A packet is delivered to every member of a group." },
      { id: "b", text: "The same prefix is advertised from more than one place, and routing delivers the packet to the best path." },
      { id: "c", text: "A layer-2 broadcast to every port in a VLAN." },
      { id: "d", text: "Two hosts on one VLAN share a MAC so STP can load-balance." },
    ],
    answer: "b",
    explanation:
      "Anycast is unicast addressing with multiple origins. Routing picks the closest announcement; the sender does not pick a member. DNS root servers and many load-balancer VIPs work this way. Failover is “withdraw the route,” not a layer-2 failover. Multicast is the one that delivers to every member of a group. EVPN anycast gateway is the data-center version of the same idea: every leaf answers for the same gateway address.",
  },
  {
    id: "m-stp",
    topic: "Spanning tree",
    difficulty: "medium",
    prompt: "Why does a classic layer-2 network run spanning tree?",
    choices: [
      { id: "a", text: "To load-balance flows across equal-cost paths." },
      { id: "b", text: "To block redundant links so a broadcast loop cannot form." },
      { id: "c", text: "To hand out IP addresses." },
      { id: "d", text: "To replace BGP inside a leaf-spine fabric." },
    ],
    answer: "b",
    explanation:
      "If two switches have two cables between them and both are forwarding, broadcasts multiply until the VLAN melts down. STP picks a loop-free subset of links and blocks the rest. It does not ECMP. A routed leaf-spine does not need STP on the fabric links, because each link is its own layer-3 subnet and there is no layer-2 loop. STP still shows up on legacy host-side bridging.",
  },
  {
    id: "m-ospf-refbw",
    topic: "OSPF cost",
    difficulty: "medium",
    prompt: "Cisco OSPF uses a default reference bandwidth of 100 Mbps. On a fabric of 10G and 100G links, what goes wrong if you leave it there?",
    choices: [
      { id: "a", text: "A 100G link gets a cost one thousandth of a 100M link, so the metric stays accurate." },
      { id: "b", text: "Every link of 100 Mbps or faster costs 1, so 10G and 100G look identical." },
      { id: "c", text: "OSPF refuses to form an adjacency on anything faster than 1G." },
      { id: "d", text: "The reference bandwidth is copied into BGP local preference." },
    ],
    answer: "b",
    explanation:
      "OSPF cost is reference bandwidth divided by interface bandwidth, with a minimum of 1. At a 100 Mbps reference, a 100M link, a 10G link, and a 100G link all cost 1. The protocol then treats them as equal. Raise the reference bandwidth (the same value on every router) so faster links actually cost less. This is a favorite “the config is default and the metric is lying” question.",
  },
  {
    id: "m-dhcp-relay",
    topic: "DHCP",
    difficulty: "medium",
    prompt: "Servers on a VLAN broadcast DHCP Discover. The DHCP server is on a different subnet. What has to be in place for them to get addresses?",
    choices: [
      { id: "a", text: "A DHCP relay on the gateway. It unicasts the Discover to the server and fills in giaddr." },
      { id: "b", text: "The DHCP server must be patched into every client VLAN." },
      { id: "c", text: "STP must be disabled on the client VLAN." },
      { id: "d", text: "Clients ARP for the DHCP server's MAC through the router." },
    ],
    answer: "a",
    explanation:
      "DHCP Discover is a broadcast, and routers do not forward broadcasts. A relay agent (an ip helper) on the client subnet accepts the broadcast, puts its own interface address in giaddr, and unicasts to the configured server. The server uses giaddr to pick the pool and to send the Offer back to the relay. One central DHCP server can then serve many subnets.",
  },
  {
    id: "m-fast-retransmit",
    topic: "TCP loss recovery",
    difficulty: "medium",
    prompt: "What triggers TCP fast retransmit?",
    choices: [
      { id: "a", text: "Only the retransmission timeout." },
      { id: "b", text: "Duplicate ACKs — classically three — so the missing segment is resent before the timeout." },
      { id: "c", text: "An ICMP echo failure from the receiver." },
      { id: "d", text: "The receiver advertising a zero window." },
    ],
    answer: "b",
    explanation:
      "If later data arrives, the receiver keeps ACKing the same cumulative sequence. Those duplicate ACKs are evidence that the gap is a loss, not a fully stalled path. After the threshold (typically three), the sender retransmits the missing segment without waiting for the RTO. The timeout is still the fallback when ACKs stop entirely, which is what tail loss looks like. A zero window means the receiver is full, not that a segment was lost.",
  },
  {
    id: "m-flow-vs-cong",
    topic: "TCP windows",
    difficulty: "medium",
    prompt: "How do TCP flow control and congestion control differ?",
    choices: [
      { id: "a", text: "They are two names for the receive window." },
      { id: "b", text: "Flow control protects the receiver (rwnd). Congestion control protects the network (cwnd). The sender is limited by whichever is smaller." },
      { id: "c", text: "Congestion control is a switch rewriting the VLAN ID when a queue is full." },
      { id: "d", text: "Flow control exists only in UDP." },
    ],
    answer: "b",
    explanation:
      "The receiver advertises rwnd so the sender does not overrun the socket buffer. The sender maintains cwnd from loss or ECN so it does not overrun the path. Bytes in flight are capped by the minimum of the two. If a transfer is slow and rwnd is large, look at loss and cwnd. If rwnd is tiny, look at the receiving application.",
  },
  {
    id: "m-oversub",
    topic: "Oversubscription",
    difficulty: "medium",
    prompt: "What is the oversubscription ratio of this leaf, counted as server-facing bandwidth divided by uplink bandwidth?",
    diagram: {
      kind: "topology",
      title: "Leaf uplinks and server ports",
      nodes: [
        { id: "sa", label: "Spine A", x: 26, y: 14, kind: "switch" },
        { id: "sb", label: "Spine B", x: 74, y: 14, kind: "switch" },
        { id: "leaf", label: "Leaf", x: 50, y: 48, kind: "switch" },
        { id: "srv", label: "Servers", detail: "16 × 25G", x: 50, y: 84, kind: "server" },
      ],
      edges: [
        { from: "srv", to: "leaf", label: "16×25G" },
        { from: "leaf", to: "sa", label: "100G" },
        { from: "leaf", to: "sb", label: "100G" },
      ],
    },
    choices: [
      { id: "a", text: "8:1, because there are 16 server ports and 2 uplinks." },
      { id: "b", text: "2:1. Downlink bandwidth is 400G and uplink bandwidth is 200G." },
      { id: "c", text: "4:1, counting only one of the uplinks." },
      { id: "d", text: "1:2, because the uplinks are faster than a single server port." },
    ],
    answer: "b",
    explanation:
      "Sixteen 25G server ports are 400 Gbps of downlink. Two 100G uplinks are 200 Gbps. 400 / 200 = 2, so the leaf is 2:1 oversubscribed. Counting ports instead of bandwidth (16:2) is the usual trap, and so is forgetting the second uplink. Say the ratio as downlink:uplink and state the arithmetic.",
  },
  {
    id: "m-trunk-tag",
    topic: "Trunks",
    difficulty: "medium",
    prompt: "Host A sends a frame to Host B. How does that frame look as it crosses the link between the two switches?",
    diagram: {
      kind: "topology",
      title: "Access ports and a trunk",
      nodes: [
        { id: "ha", label: "Host A", detail: "VLAN 10", x: 10, y: 46, kind: "host" },
        { id: "sw1", label: "Switch 1", x: 36, y: 46, kind: "switch" },
        { id: "sw2", label: "Switch 2", x: 64, y: 46, kind: "switch" },
        { id: "hb", label: "Host B", detail: "VLAN 10", x: 90, y: 20, kind: "host" },
        { id: "hc", label: "Host C", detail: "VLAN 20", x: 90, y: 76, kind: "host" },
      ],
      edges: [
        { from: "ha", to: "sw1", label: "access" },
        { from: "sw1", to: "sw2", label: "trunk" },
        { from: "sw2", to: "hb", label: "access" },
        { from: "sw2", to: "hc", label: "access" },
      ],
    },
    choices: [
      { id: "a", text: "Untagged. Trunks strip the VLAN so the other switch can decide." },
      { id: "b", text: "Tagged with VLAN 10. The access ports toward the hosts carry it untagged." },
      { id: "c", text: "Tagged with VLAN 20, because Host C is also on Switch 2." },
      { id: "d", text: "Tagged with both VLAN 10 and VLAN 20." },
    ],
    answer: "b",
    explanation:
      "Host A is on an access port in VLAN 10, so the frame arrives at Switch 1 untagged and the switch associates it with VLAN 10. On the trunk, Switch 1 inserts an 802.1Q tag for VLAN 10. Switch 2 removes that tag before delivering the frame out Host B’s access port. Host C’s VLAN never gets added to someone else’s frame.",
  },
  {
    id: "m-asym-fw",
    topic: "Stateful firewalls",
    difficulty: "medium",
    prompt: "ECMP hashes the forward packets of a flow through FW-A and the return packets through FW-B. The firewalls are stateful and do not sync state. What happens?",
    diagram: {
      kind: "topology",
      title: "Two firewalls on ECMP paths",
      nodes: [
        { id: "srv", label: "Server", x: 12, y: 50, kind: "server" },
        { id: "fwa", label: "FW-A", x: 40, y: 18, kind: "firewall" },
        { id: "fwb", label: "FW-B", x: 40, y: 82, kind: "firewall" },
        { id: "core", label: "Core", x: 68, y: 50, kind: "router" },
        { id: "net", label: "Remote", x: 92, y: 50, kind: "cloud" },
      ],
      edges: [
        { from: "srv", to: "fwa" },
        { from: "srv", to: "fwb" },
        { from: "fwa", to: "core" },
        { from: "fwb", to: "core" },
        { from: "core", to: "net" },
      ],
      note: "The forward and return directions can hash onto different firewalls.",
    },
    choices: [
      { id: "a", text: "The flow works. Stateful firewalls allow any return packet that reaches either device." },
      { id: "b", text: "FW-B drops the return packets because it never saw the handshake and has no connection entry." },
      { id: "c", text: "STP blocks FW-B, so the return path cannot use it." },
      { id: "d", text: "Both firewalls create state from the first packet they see, in either direction, so either path is fine." },
    ],
    answer: "b",
    explanation:
      "FW-A saw the outbound SYN and built a connection entry. The return packets arrive at FW-B, which has no entry. A stateful policy that allows only established traffic drops them. ECMP across devices that keep per-box state is a classic outage.\n\nFixes people expect to hear: symmetric hashing so both directions stick to one firewall, state sync between the pair, or move the firewall off the ECMP path.",
  },
  {
    id: "m-nexthop",
    topic: "iBGP next hop",
    difficulty: "medium",
    prompt: "The edge router learns a default route from the ISP and advertises it to the leaf with iBGP, without next-hop-self. The leaf has no route to 203.0.113.1. What does the leaf do with internet-bound packets?",
    diagram: {
      kind: "topology",
      title: "eBGP at the edge, iBGP toward the leaf",
      nodes: [
        { id: "isp", label: "ISP", detail: "203.0.113.1", x: 14, y: 50, kind: "cloud" },
        { id: "edge", label: "Edge", detail: "AS 64500", x: 48, y: 50, kind: "router" },
        { id: "leaf", label: "Leaf", detail: "10.0.0.11", x: 84, y: 50, kind: "switch" },
      ],
      edges: [
        { from: "isp", to: "edge", label: "eBGP" },
        { from: "edge", to: "leaf", label: "iBGP" },
      ],
      note: "Default route is advertised. Next hop is left unchanged.",
    },
    choices: [
      { id: "a", text: "It forwards them to the edge. iBGP next hops are always rewritten to the advertising peer." },
      { id: "b", text: "The default route is not used for forwarding. The BGP next hop is unresolved, so the route does not enter the FIB." },
      { id: "c", text: "It ARPs for 203.0.113.1 on the server VLAN." },
      { id: "d", text: "It load-balances across every leaf in the AS." },
    ],
    answer: "b",
    explanation:
      "iBGP does not change the next hop by default. The leaf learns 0.0.0.0/0 with next hop 203.0.113.1, the ISP’s address. If the leaf cannot resolve that next hop through the IGP, the route is unusable and internet traffic is dropped even though “BGP has a default.”\n\nThe usual fix is next-hop-self on the edge toward its iBGP peers. The alternative is to advertise the edge-to-ISP link into the IGP, which you often do not want.",
  },
  {
    id: "m-handshake",
    topic: "TCP handshake",
    difficulty: "medium",
    prompt: "The third segment in this capture is wrong. What should the client have sent?",
    diagram: {
      kind: "sequence",
      title: "Three-way handshake",
      actors: ["Client", "Server"],
      steps: [
        { from: "Client", to: "Server", label: "SYN  seq=100" },
        { from: "Server", to: "Client", label: "SYN-ACK  seq=500  ack=101" },
        { from: "Client", to: "Server", label: "ACK  seq=101  ack=500", bad: true },
      ],
      note: "A SYN consumes one sequence number. The highlighted segment is the broken one.",
    },
    choices: [
      { id: "a", text: "The third segment is already correct." },
      { id: "b", text: "ACK with seq=101 and ack=501. The server's SYN consumed sequence 500." },
      { id: "c", text: "ACK with seq=100 and ack=500, reusing the original SYN sequence." },
      { id: "d", text: "SYN-ACK with seq=101 and ack=501. The client still owes a SYN." },
    ],
    answer: "b",
    explanation:
      "The client’s SYN used sequence 100, so the server correctly acknowledges 101. The server’s SYN used sequence 500, so the client must acknowledge 501, the next byte it expects. The ack=500 in the diagram is off by one. Sequence numbers are not rewritten by routers; both endpoints have to get this right or the handshake never completes.",
  },
  {
    id: "h-bgp-order",
    topic: "BGP best path",
    difficulty: "hard",
    prompt: "Several valid BGP routes exist for one prefix. Cisco weight is not set. Which comparison happens first among the attributes below?",
    choices: [
      { id: "a", text: "Shortest AS path." },
      { id: "b", text: "Highest local preference." },
      { id: "c", text: "Lowest MED." },
      { id: "d", text: "Lowest BGP router ID." },
    ],
    answer: "b",
    explanation:
      "Among these, highest local preference wins first. A short AS path does not beat a higher local pref, and MED is later still. Router ID is a last-resort tie break.\n\nThe order interviewers want to hear: local preference, then locally originated, then shortest AS path, then origin type, then lowest MED, then eBGP over iBGP, then lowest IGP cost to the next hop, then the remaining tie breaks. On Cisco, weight sits above local preference, and it never leaves the router.",
  },
  {
    id: "h-rr",
    topic: "Route reflection",
    difficulty: "hard",
    prompt: "Why does a large AS use BGP route reflectors instead of only iBGP sessions between every pair of routers?",
    choices: [
      { id: "a", text: "iBGP split horizon will not re-advertise a route learned from one iBGP peer to another iBGP peer, so a full mesh is otherwise required." },
      { id: "b", text: "eBGP allows only two neighbors per router." },
      { id: "c", text: "A route reflector rewrites every next hop to itself and must sit on the data path." },
      { id: "d", text: "OSPF area 0 already reflects BGP routes, so reflectors are only a label." },
    ],
    answer: "a",
    explanation:
      "Because of split horizon, iBGP expects a full mesh, and the number of sessions grows as n². A route reflector is allowed to re-advertise client routes to other clients and to non-clients. By default it does not change the next hop, so it is a control-plane role: packets follow the next hop, not the reflector. Cluster lists stop reflection loops. Next-hop reachability is still your problem.",
  },
  {
    id: "h-incast",
    topic: "TCP incast",
    difficulty: "hard",
    prompt: "A storage client asks 40 servers for blocks, and all 40 reply at the same moment toward the client's one access link. The link's average use is modest, but the transfer collapses. What is this?",
    choices: [
      { id: "a", text: "BGP count-to-infinity on the leaf." },
      { id: "b", text: "TCP incast. The last-hop buffer overflows, many packets drop together, and the senders back off in sync." },
      { id: "c", text: "An STP broadcast storm on the server VLAN." },
      { id: "d", text: "DNS amplification from the storage nodes." },
    ],
    answer: "b",
    explanation:
      "Incast is synchronized many-to-one traffic. The bottleneck is the egress port facing the client. Shallow buffers overflow, drops are correlated, and TCP’s synchronized retransmission makes throughput fall off a cliff instead of filling the link.\n\nWhat to say you’d do: jitter the replies, enable ECN and a data-center TCP such as DCTCP, add buffering where it actually helps, reduce the fan-in, or pace the senders. “The average utilization was low” does not clear the buffer.",
  },
  {
    id: "h-evpn-routes",
    topic: "EVPN",
    difficulty: "hard",
    prompt: "What is the practical difference between EVPN route type 2 and route type 5?",
    choices: [
      { id: "a", text: "Type 2 advertises a MAC address and an optional host IP. Type 5 advertises an IP prefix." },
      { id: "b", text: "Type 2 is only IPv6. Type 5 is only IPv4." },
      { id: "c", text: "Type 5 carries ARP storms. Type 2 carries BGP keepalives." },
      { id: "d", text: "They are the same route. The number is the VNI." },
    ],
    answer: "a",
    explanation:
      "Type 2 is a MAC/IP advertisement: this VTEP owns this MAC, and optionally this host /32 or /128. Remote VTEPs use it for bridging and for host routes. Type 5 is an IP prefix route, used for a subnet or for an external prefix, without listing every host. You want type 5 so a leaf can route to a whole subnet, and so the fabric can exchange routes with the outside world.\n\nARP suppression is built on type 2 information, not on type 5.",
  },
  {
    id: "h-pfc",
    topic: "Lossless Ethernet",
    difficulty: "hard",
    prompt: "Why is Priority Flow Control (IEEE 802.1Qbb) dangerous to turn on blindly across a large Clos fabric?",
    choices: [
      { id: "a", text: "PFC marks packets so the original sender slows down. It cannot affect anyone else." },
      { id: "b", text: "PFC pauses the previous hop for a traffic class. Pauses can spread, block unrelated flows, and deadlock a Clos if they loop." },
      { id: "c", text: "PFC only works on layer-3 ECMP hashes." },
      { id: "d", text: "PFC replaces BGP and withdraws routes when a queue builds." },
    ],
    answer: "b",
    explanation:
      "PFC is hop-by-hop backpressure. A congested switch sends a pause for one priority class, and the upstream switch stops transmitting that class. The upstream queue then grows and can pause its own upstream. Unrelated flows that share the paused class stall with them. In a Clos, pause cycles can deadlock.\n\nECN, used by DCTCP and DCQCN, tells the endpoints to slow down without pausing a hop. RoCE deployments often still use PFC for a class, but the design goal is to keep pauses rare.",
  },
  {
    id: "h-cwnd",
    topic: "TCP windows",
    difficulty: "hard",
    prompt: "A receiver advertises a 4 MB window. Packet captures show the sender never has more than about 40 KB in flight, and the path is lossy. What is limiting the transfer?",
    choices: [
      { id: "a", text: "The receive window. The sender cannot exceed what the receiver advertised, and 4 MB is the smaller number." },
      { id: "b", text: "The congestion window. Flight size is min(cwnd, rwnd), and loss is holding cwnd near 40 KB." },
      { id: "c", text: "The VLAN ID, which caps each flow at 64 KB." },
      { id: "d", text: "BGP hold time, which resets the TCP window every 180 seconds." },
    ],
    answer: "b",
    explanation:
      "The sender is allowed to send min(cwnd, rwnd). Here rwnd is huge, so it is not the constraint. A lossy path keeps cwnd small because congestion control treats loss as a signal to back off. Fixing the receiver buffer would not change this capture.\n\nSay it as: “rwnd is the receiver’s budget, cwnd is the sender’s estimate of the network, and the pipe is the smaller of the two.”",
  },
  {
    id: "h-maglev",
    topic: "Load balancing",
    difficulty: "hard",
    prompt: "A load balancer picks backends with hash modulo N. One backend out of 100 is added. Why is that a poor way to map flows, compared with consistent hashing?",
    choices: [
      { id: "a", text: "hash modulo N keeps nearly every existing flow on its current backend when N changes." },
      { id: "b", text: "Changing N remaps almost every flow. Consistent hashing remaps only about 1/N of them, and a connection table can hold the rest still." },
      { id: "c", text: "Consistent hashing requires the client to open a DNS query for every packet." },
      { id: "d", text: "hash modulo N is the only hash ECMP switches can compute." },
    ],
    answer: "b",
    explanation:
      "With hash % N, N becoming N+1 changes the result for nearly every key, so live connections get sprayed onto new backends and reset. Consistent hashing — the idea in Maglev — arranges the ring so adding or removing one backend moves about 1/N of the keys. A connection table on top of that keeps a 5-tuple stuck to the backend that accepted it, even if a later hash would choose someone else. That is what makes backend changes survivable.",
  },
  {
    id: "h-her",
    topic: "BUM replication",
    difficulty: "hard",
    prompt: "A VNI has 40 remote VTEPs. The fabric replicates BUM with ingress replication (head-end replication). A host emits one broadcast frame. How many encapsulated copies does its local leaf send?",
    choices: [
      { id: "a", text: "One. The spine fans the broadcast out." },
      { id: "b", text: "40. The ingress VTEP sends one copy to each remote VTEP." },
      { id: "c", text: "4094, one per VLAN ID." },
      { id: "d", text: "Zero. VXLAN drops broadcasts." },
    ],
    answer: "b",
    explanation:
      "Ingress replication means the leaf that received the broadcast makes a separate unicast-encapsulated copy for every other VTEP in the VNI. Forty VTEPs means forty copies leave the leaf. That multiplies both bandwidth and the VTEP’s replication work, which is why large BUM domains hurt.\n\nARP suppression cuts the ARP portion of this. IGMP snooping cuts multicast. A multicast underlay is the other replication design, and it moves the complexity into the underlay.",
  },
  {
    id: "h-slash31",
    topic: "Point-to-point addressing",
    difficulty: "hard",
    prompt: "Two routers number a point-to-point link 10.0.0.0/31 and 10.0.0.1/31. Which statement is correct?",
    choices: [
      { id: "a", text: "The subnet is invalid. Every IPv4 subnet needs a distinct network address and broadcast address." },
      { id: "b", text: "It is valid. RFC 3021 makes both addresses usable hosts on a point-to-point link." },
      { id: "c", text: "A /31 is legal only as a loopback." },
      { id: "d", text: "The subnet has 62 usable hosts." },
    ],
    answer: "b",
    explanation:
      "RFC 3021 allows a /31 on a point-to-point link. There is no broadcast address to reserve, because there are only two endpoints, and both addresses are assignable. Fabrics use this constantly so they don’t burn four addresses (/30) on every leaf-to-spine link. A /32 is a different tool: one address, typically a loopback, not a link subnet.",
  },
  {
    id: "h-lpm-ad",
    topic: "RIB and FIB",
    difficulty: "hard",
    prompt: "A Cisco router has a static route for 10.0.0.0/8 and an OSPF route for 10.1.0.0/16. A packet arrives for 10.1.5.5. Which route forwards it, and why?",
    exhibit: "S   10.0.0.0/8   via 192.0.2.1     AD 1\nO   10.1.0.0/16  via 192.0.2.2     AD 110",
    choices: [
      { id: "a", text: "The static route. Administrative distance 1 beats OSPF's 110." },
      { id: "b", text: "The OSPF route. Longest prefix match selects /16, and AD is not a contest between different prefix lengths." },
      { id: "c", text: "Neither. The router drops the packet because the two protocols disagree." },
      { id: "d", text: "Whichever route was installed first." },
    ],
    answer: "b",
    explanation:
      "Administrative distance chooses which protocol is allowed to install a given prefix into the RIB. It does not rank different prefix lengths. 10.1.5.5 matches both routes, and /16 is more specific, so the FIB uses the OSPF next hop even though 110 is a worse distance than 1.\n\nThe trap is treating AD as a global priority that overrides longest-prefix match. It doesn’t.",
  },
  {
    id: "h-polarization",
    topic: "ECMP polarization",
    difficulty: "hard",
    prompt: "In a three-stage Clos, every switch hashes the same 5-tuple with the same algorithm and the same seed. The ECMP groups look healthy, but a few links run hot and others stay idle. Why?",
    choices: [
      { id: "a", text: "STP is blocking the idle links." },
      { id: "b", text: "Hash polarization. Flows that collide at the first stage keep colliding at the next stage, so the entropy never gets reshuffled." },
      { id: "c", text: "Local preference is pinning every flow to the lowest router ID." },
      { id: "d", text: "The idle links have a higher MTU, so TCP avoids them." },
    ],
    answer: "b",
    explanation:
      "If every tier computes the same hash, a flow that picked “member 0” at the leaf picks the correlated member at the next tier. The fabric tables show equal-cost paths, but the traffic does not spread. That is polarization.\n\nThe fix is to vary the hash per hop: a per-switch seed, a rotated input, or extra entropy such as the L4 ports. Also say that one elephant flow still fills only one link — polarization is about correlation across tiers, which is a separate problem from a single huge flow.",
  },
  {
    id: "h-med-scope",
    topic: "BGP MED",
    difficulty: "hard",
    prompt: "You receive one prefix twice: MED 50 from AS 100, and MED 100 from AS 200. Default settings, no always-compare-med. Which statement is right?",
    choices: [
      { id: "a", text: "MED 50 always wins. Lower MED is better no matter which AS sent it." },
      { id: "b", text: "The two MED values are not compared. By default, MED is ranked only among routes from the same neighboring AS." },
      { id: "c", text: "MED 100 wins because a higher metric is preferred, as with local preference." },
      { id: "d", text: "MED is evaluated before local preference, so it overrides your outbound policy." },
    ],
    answer: "b",
    explanation:
      "MED is a hint from one neighbor about which of its entry points you should use. Comparing it across different neighboring ASes lets one AS’s metric scale steer you against another AS, which is why the default is not to do that. always-compare-med changes the default, and you should know the knob exists.\n\nLower MED is better, but only inside that comparison. Local preference is evaluated earlier, so your own outbound policy still beats a neighbor’s MED.",
  },
  {
    id: "h-microburst",
    topic: "Buffering",
    difficulty: "hard",
    prompt: "A 100G interface shows about 15% utilization in one-minute SNMP, and it still increments output drops. The cabling and optics are fine. What is a credible explanation?",
    choices: [
      { id: "a", text: "The link is oversubscribed on average, so the minute counter should have shown close to 100%." },
      { id: "b", text: "Microbursts. Sub-second spikes fill the buffer, then disappear inside the one-minute average." },
      { id: "c", text: "The switch has run out of VLAN IDs, so it drops the excess." },
      { id: "d", text: "MED on the attached prefix is oscillating." },
    ],
    answer: "b",
    explanation:
      "A one-minute average can hide a 200-microsecond spike that overflows a shallow buffer. The drops are real; the graph is just too coarse. This is a microburst. Look at high-frequency counters, buffer histograms, or streaming telemetry, not a 60-second poll.\n\nIn an interview, tie it to incast: synchronized replies are a common way to build a microburst on the port facing one receiver.",
  },
  {
    id: "h-ecn",
    topic: "ECN",
    difficulty: "hard",
    prompt: "Who sets the ECN congestion-experienced (CE) mark on a packet?",
    choices: [
      { id: "a", text: "The sender, on every packet, to prove it supports ECN." },
      { id: "b", text: "A congested router, and only on a packet the sender has marked as ECN-capable (ECT)." },
      { id: "c", text: "The receiver, before the packet enters the network." },
      { id: "d", text: "BGP, inside the route update that advertised the destination." },
    ],
    answer: "b",
    explanation:
      "The sender sets ECT to say “you may mark me instead of dropping me.” A router that is congested sets CE. The receiver notices CE and sets the TCP ECE flag. The sender then reduces cwnd and sets CWR so the receiver can stop repeating ECE. If the sender never set ECT, the router has no license to mark and has to drop.\n\nThat is the whole loop. ECN is not the sender accusing itself, and it is not a separate ICMP message.",
  },
  {
    id: "h-bfd",
    topic: "Failure detection",
    difficulty: "hard",
    prompt: "The link drawn in amber stays up at both ends and silently discards traffic. BGP is using its default hold timer, and BFD is not configured. How long can flows hashed onto that link black-hole?",
    diagram: {
      kind: "topology",
      title: "A link that is up and not forwarding",
      nodes: [
        { id: "sa", label: "Spine A", x: 28, y: 12, kind: "switch" },
        { id: "sb", label: "Spine B", x: 72, y: 12, kind: "switch" },
        { id: "l1", label: "Leaf 1", x: 28, y: 50, kind: "switch" },
        { id: "l2", label: "Leaf 2", x: 72, y: 50, kind: "switch" },
        { id: "a", label: "Server A", x: 28, y: 86, kind: "server" },
        { id: "b", label: "Server B", x: 72, y: 86, kind: "server" },
      ],
      edges: [
        { from: "a", to: "l1" },
        { from: "b", to: "l2" },
        { from: "l1", to: "sa", label: "silent drop", state: "degraded" },
        { from: "l1", to: "sb" },
        { from: "l2", to: "sa" },
        { from: "l2", to: "sb" },
      ],
      note: "Both devices still show the amber link as up.",
    },
    choices: [
      { id: "a", text: "A few milliseconds. An up interface that drops packets withdraws routes immediately." },
      { id: "b", text: "Until the routing hold timer expires — about 180 seconds with default BGP — because the interface never went down." },
      { id: "c", text: "Until STP reconverges, which is the detection method on a routed fabric." },
      { id: "d", text: "They do not black-hole. ECMP detects the loss and stops using the link on the next packet." },
    ],
    answer: "b",
    explanation:
      "ECMP does not watch packet loss. If the interface stays up, the next hop stays in the table. BGP’s default keepalive is 60 seconds and the hold time is 180, so a neighbor that has gone silent can black-hole traffic for minutes. A real link-down would have removed the next hop at once.\n\nBFD is the usual fix: a lightweight hello, often a few hundred milliseconds or less, that tears the BGP session down when the forwarding path is dead. Say both halves: interface-down is fast, silent corruption is not, unless something like BFD is measuring it.",
  },
  {
    id: "h-anycast-gw",
    topic: "Anycast gateway",
    difficulty: "hard",
    prompt: "The server sends an ARP request for its gateway, 10.0.0.1. Which device answers?",
    diagram: {
      kind: "topology",
      title: "EVPN anycast gateway",
      nodes: [
        { id: "sp", label: "Spine", x: 50, y: 10, kind: "switch" },
        { id: "l1", label: "Leaf 1", detail: "GW 10.0.0.1", x: 24, y: 46, kind: "switch" },
        { id: "l2", label: "Leaf 2", detail: "GW 10.0.0.1", x: 76, y: 46, kind: "switch" },
        { id: "srv", label: "Server", detail: "10.0.0.20", x: 24, y: 84, kind: "server" },
      ],
      edges: [
        { from: "srv", to: "l1" },
        { from: "l1", to: "sp" },
        { from: "l2", to: "sp" },
      ],
      note: "Both leaves use the same gateway IP and the same gateway MAC.",
    },
    choices: [
      { id: "a", text: "Leaf 2 only. The lowest router ID owns the gateway ARP." },
      { id: "b", text: "Leaf 1, the local leaf. The server never needs to reach a central gateway." },
      { id: "c", text: "The spine, because gateway MACs live only on spines." },
      { id: "d", text: "Both leaves answer, and the server load-balances the two ARP replies." },
    ],
    answer: "b",
    explanation:
      "With an anycast gateway, every leaf in the subnet owns the same gateway IP and MAC. The server’s ARP is answered by the leaf it is attached to. Traffic that must be routed hits that local leaf and is then VXLAN-routed toward the destination leaf. There is no hairpin to a central firewall-style gateway, and a VM that moves to Leaf 2 still ARPs for the same address.\n\nThe shared MAC matters: the server does not need a new gateway MAC after it moves.",
  },
  {
    id: "h-arp-suppress",
    topic: "ARP suppression",
    difficulty: "hard",
    prompt: "Host A ARPs for Host B. Leaf 1 already has an EVPN type-2 MAC/IP route for Host B, and ARP suppression is on. What is flooded across the fabric?",
    diagram: {
      kind: "topology",
      title: "Two VTEPs that already know Host B",
      nodes: [
        { id: "sp", label: "Spine", x: 50, y: 10, kind: "switch" },
        { id: "l1", label: "Leaf 1", detail: "VTEP", x: 22, y: 46, kind: "switch" },
        { id: "l2", label: "Leaf 2", detail: "VTEP", x: 78, y: 46, kind: "switch" },
        { id: "ha", label: "Host A", detail: "10.1.1.10", x: 22, y: 84, kind: "host" },
        { id: "hb", label: "Host B", detail: "10.1.1.20", x: 78, y: 84, kind: "host" },
      ],
      edges: [
        { from: "ha", to: "l1" },
        { from: "hb", to: "l2" },
        { from: "l1", to: "sp" },
        { from: "l2", to: "sp" },
      ],
      note: "Leaf 1's EVPN table already maps Host B's IP to its MAC and to Leaf 2.",
    },
    choices: [
      { id: "a", text: "The ARP request is head-end replicated to every VTEP, including Leaf 2." },
      { id: "b", text: "Nothing. Leaf 1 answers the ARP locally from the type-2 information." },
      { id: "c", text: "The spine answers, because it is the only device allowed to proxy ARP." },
      { id: "d", text: "Leaf 2 forwards the ARP request out every server port in the VNI." },
    ],
    answer: "b",
    explanation:
      "ARP suppression lets the local VTEP reply when EVPN already knows the remote MAC/IP binding. Host A gets its answer without a fabric-wide broadcast. That is the point: ARP is a large share of BUM, and type-2 routes make the flood unnecessary.\n\nIf Leaf 1 did not know Host B, the ARP would be BUM and, with ingress replication, copied to the other VTEPs. Suppression is what changes once the type-2 route exists.",
  },
  {
    id: "h-fabric-shift",
    topic: "Link failure",
    difficulty: "hard",
    prompt: "The Leaf 1 to Spine A link goes down hard: the interface drops on both ends. Where do flows from Server A to Server B go, and what is not involved?",
    diagram: {
      kind: "topology",
      title: "One fabric link down",
      nodes: [
        { id: "sa", label: "Spine A", x: 28, y: 10, kind: "switch" },
        { id: "sb", label: "Spine B", x: 72, y: 10, kind: "switch" },
        { id: "l1", label: "Leaf 1", x: 28, y: 48, kind: "switch" },
        { id: "l3", label: "Leaf 3", x: 72, y: 48, kind: "switch" },
        { id: "a", label: "Server A", x: 28, y: 86, kind: "server" },
        { id: "b", label: "Server B", x: 72, y: 86, kind: "server" },
      ],
      edges: [
        { from: "a", to: "l1" },
        { from: "b", to: "l3" },
        { from: "l1", to: "sa", state: "down" },
        { from: "l1", to: "sb" },
        { from: "l3", to: "sa" },
        { from: "l3", to: "sb" },
      ],
      note: "The marked link is physically down. The other links stay up.",
    },
    choices: [
      { id: "a", text: "Traffic waits for STP to unblock a backup link before it can move." },
      { id: "b", text: "Leaf 1 removes Spine A as a next hop and the flows move to Spine B. STP is not part of this reconvergence." },
      { id: "c", text: "The flow keeps hashing onto Spine A until the BGP hold timer expires." },
      { id: "d", text: "Server A fails over to Leaf 3 at layer 2." },
    ],
    answer: "b",
    explanation:
      "This is a routed fabric. The interface going down removes that adjacency and that ECMP next hop immediately. Leaf 1 still has Spine B, so traffic shifts there: Server A → Leaf 1 → Spine B → Leaf 3 → Server B. There is no spanning tree on these point-to-point routed links, so nothing is waiting on STP.\n\nContrast this with a link that stays up and silently drops. That case does wait on a hold timer or on BFD. The interface state is the whole difference.",
  },
];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffleChoices(question: Question, index: number): Question {
  const letters = ["a", "b", "c", "d"] as const;
  const correct = question.choices.find((choice) => choice.id === question.answer);
  const distractors = question.choices.filter((choice) => choice.id !== question.answer);
  if (!correct || distractors.length !== 3) return question;

  let seed = hashString(question.id);
  const shuffled = [...distractors];
  for (let cursor = shuffled.length - 1; cursor > 0; cursor -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swap = seed % (cursor + 1);
    const current = shuffled[cursor];
    shuffled[cursor] = shuffled[swap];
    shuffled[swap] = current;
  }

  const slot = index % letters.length;
  shuffled.splice(slot, 0, correct);
  return {
    ...question,
    choices: shuffled.map((choice, choiceIndex) => ({
      id: letters[choiceIndex],
      text: choice.text,
    })),
    answer: letters[slot],
  };
}

export const questions: Question[] = questionBank.map(shuffleChoices);

export const questionById: Record<string, Question> = Object.fromEntries(
  questions.map((question) => [question.id, question]),
);
