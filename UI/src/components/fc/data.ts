export type Player = {
  id: string;
  name: string;
  short: string;
  team: "MI" | "CSK" | "RCB" | "GT";
  role: "WK" | "BAT" | "AR" | "BOWL";
  points: number;
  credits: number;
  selectedBy: string;
};

export const players: Player[] = [
  { id: "p1", name: "Ishan Kishan", short: "I. Kishan", team: "MI", role: "WK", points: 421, credits: 8.5, selectedBy: "62%" },
  { id: "p2", name: "Devon Conway", short: "D. Conway", team: "CSK", role: "WK", points: 468, credits: 9.0, selectedBy: "71%" },
  { id: "p3", name: "Rohit Sharma", short: "R. Sharma", team: "MI", role: "BAT", points: 452, credits: 9.0, selectedBy: "84%" },
  { id: "p4", name: "Virat Kohli", short: "V. Kohli", team: "RCB", role: "BAT", points: 523, credits: 9.0, selectedBy: "91%" },
  { id: "p5", name: "Suryakumar Yadav", short: "S. Yadav", team: "MI", role: "BAT", points: 438, credits: 8.5, selectedBy: "66%" },
  { id: "p6", name: "Ruturaj Gaikwad", short: "R. Gaikwad", team: "CSK", role: "BAT", points: 412, credits: 8.5, selectedBy: "58%" },
  { id: "p7", name: "Shubman Gill", short: "S. Gill", team: "GT", role: "BAT", points: 398, credits: 8.0, selectedBy: "44%" },
  { id: "p8", name: "Hardik Pandya", short: "H. Pandya", team: "MI", role: "AR", points: 461, credits: 9.0, selectedBy: "78%" },
  { id: "p9", name: "Ravindra Jadeja", short: "R. Jadeja", team: "CSK", role: "AR", points: 449, credits: 8.5, selectedBy: "69%" },
  { id: "p10", name: "Jasprit Bumrah", short: "J. Bumrah", team: "MI", role: "BOWL", points: 470, credits: 9.0, selectedBy: "80%" },
  { id: "p11", name: "Trent Boult", short: "T. Boult", team: "MI", role: "BOWL", points: 405, credits: 8.5, selectedBy: "52%" },
  { id: "p12", name: "Matheesha Pathirana", short: "M. Pathirana", team: "CSK", role: "BOWL", points: 388, credits: 8.5, selectedBy: "47%" },
  { id: "p13", name: "Rahul Chahar", short: "R. Chahar", team: "MI", role: "BOWL", points: 342, credits: 8.0, selectedBy: "31%" },
];

export const contests = [
  { id: "c1", name: "Mega Contest", prize: "₹50,000", entry: "FREE", spots: "3,245 / 5,000", filled: 65, first: "₹5,000", tag: "Mega" },
  { id: "c2", name: "Hot Contest", prize: "₹20,000", entry: "FREE", spots: "1,890 / 3,000", filled: 63, first: "₹2,000", tag: "H2H" },
  { id: "c3", name: "Head to Head", prize: "₹2,000", entry: "FREE", spots: "2 / 2", filled: 100, first: "₹1,000", tag: "H2H" },
  { id: "c4", name: "Small League", prize: "₹8,000", entry: "FREE", spots: "410 / 1,000", filled: 41, first: "₹1,500", tag: "Private" },
];

export const leaderboard = [
  { rank: 1, user: "FantasyKing", points: 525 },
  { rank: 2, user: "Vikas11", points: 512, me: true },
  { rank: 3, user: "CricLover", points: 498 },
  { rank: 4, user: "Hitman45", points: 487 },
  { rank: 5, user: "SuperChase", points: 476 },
  { rank: 6, user: "GreenArmy", points: 468 },
  { rank: 7, user: "BoundaryBoy", points: 455 },
];

export const matches = [
  { id: "m1", league: "Indian T20 League", a: "MI", b: "CSK", time: "Today, 7:30 PM", left: "06h 45m 12s", status: "Upcoming" as const },
  { id: "m2", league: "Indian T20 League", a: "RCB", b: "GT", time: "Tomorrow, 3:30 PM", left: "26h 15m 04s", status: "Upcoming" as const },
  { id: "m3", league: "Indian T20 League", a: "MI", b: "RCB", time: "Live now", left: "In Play", status: "Live" as const },
  { id: "m4", league: "Indian T20 League", a: "CSK", b: "GT", time: "Yesterday", left: "Completed", status: "Completed" as const },
];

export const teamColors: Record<string, string> = {
  MI: "oklch(0.55 0.16 255)",
  CSK: "oklch(0.8 0.16 90)",
  RCB: "oklch(0.6 0.2 25)",
  GT: "oklch(0.45 0.08 230)",
};
