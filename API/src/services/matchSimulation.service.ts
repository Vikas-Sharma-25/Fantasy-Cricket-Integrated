import { Match, IMatch } from "../models/Match";
import { Contest } from "../models/Contest";
import { emitToMatch } from "../sockets";
import { logger } from "../utils/logger";

interface BallEvent {
  over: string;
  runs: number;
  isWicket?: boolean;
  isFour?: boolean;
  isSix?: boolean;
  text: string;
  time: string;
}

/** Ensures rich international and domestic matches with live scores and active contests exist */
export async function seedLiveAndWorldMatches() {
  const now = new Date();
  const upcomingTime1 = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours later
  const upcomingTime2 = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const completedTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

  const initialMatches = [
    // 1. INTERNATIONAL LIVE MATCH
    {
      providerMatchId: "INT-LIVE-IND-AUS",
      teamA: "India",
      teamB: "Australia",
      venue: "Wankhede Stadium, Mumbai",
      startTime: new Date(now.getTime() - 90 * 60 * 1000),
      fantasyDeadline: new Date(now.getTime() - 90 * 60 * 1000),
      status: "LIVE" as const,
      providerData: {
        category: "INTERNATIONAL",
        tournament: "ICC Men's T20 Championship 2026",
        format: "T20I",
        teamACode: "IND",
        teamBCode: "AUS",
        teamAFlag: "🇮🇳",
        teamBFlag: "🇦🇺",
        battingTeam: "India",
        bowlingTeam: "Australia",
        currentScore: 174,
        currentWickets: 3,
        currentOvers: "17.4",
        target: 186,
        statusText: "India need 12 runs in 14 balls to win",
        crr: "9.85",
        rrr: "5.14",
        recentBalls: ["1", "4", "0", "6", "1", "2"],
        batsmen: [
          { name: "Virat Kohli", runs: 68, balls: 44, fours: 6, sixes: 2, isStriker: true },
          { name: "Hardik Pandya", runs: 26, balls: 13, fours: 2, sixes: 2, isStriker: false },
        ],
        bowler: { name: "Pat Cummins", overs: "3.4", maidens: 0, runs: 34, wickets: 1, economy: "9.27" },
        firstInnings: { team: "Australia", score: "185/6", overs: "20.0" },
        commentary: [
          { over: "17.4", runs: 2, text: "Pat Cummins to Virat Kohli: 2 runs, driven gracefully into the gap at deep cover.", time: "Just now" },
          { over: "17.3", runs: 1, text: "Pat Cummins to Hardik Pandya: 1 run, worked off the hips into square leg.", time: "1m ago" },
          { over: "17.2", runs: 6, isSix: true, text: "Pat Cummins to Hardik Pandya: SIX! Launched high over mid-wicket into the stands!", time: "2m ago" },
          { over: "17.1", runs: 0, text: "Pat Cummins to Hardik Pandya: Slower off-cutter, swings and misses outside off.", time: "3m ago" },
        ],
      },
    },

    // 2. DOMESTIC / T20 LEAGUE LIVE MATCH
    {
      providerMatchId: "DOM-LIVE-CSK-MI",
      teamA: "Chennai Super Kings",
      teamB: "Mumbai Indians",
      venue: "M. A. Chidambaram Stadium, Chepauk",
      startTime: new Date(now.getTime() - 60 * 60 * 1000),
      fantasyDeadline: new Date(now.getTime() - 60 * 60 * 1000),
      status: "LIVE" as const,
      providerData: {
        category: "DOMESTIC",
        tournament: "Indian Premier T20 League 2026",
        format: "T20",
        teamACode: "CSK",
        teamBCode: "MI",
        teamAFlag: "🦁",
        teamBFlag: "⚡",
        battingTeam: "Chennai Super Kings",
        bowlingTeam: "Mumbai Indians",
        currentScore: 148,
        currentWickets: 4,
        currentOvers: "16.2",
        target: 172,
        statusText: "CSK need 24 runs in 22 balls",
        crr: "9.06",
        rrr: "6.55",
        recentBalls: ["4", "1", "W", "0", "2", "1"],
        batsmen: [
          { name: "Ruturaj Gaikwad", runs: 58, balls: 39, fours: 5, sixes: 2, isStriker: true },
          { name: "Ravindra Jadeja", runs: 14, balls: 7, fours: 1, sixes: 1, isStriker: false },
        ],
        bowler: { name: "Jasprit Bumrah", overs: "3.2", maidens: 0, runs: 22, wickets: 2, economy: "6.60" },
        firstInnings: { team: "Mumbai Indians", score: "171/7", overs: "20.0" },
        commentary: [
          { over: "16.2", runs: 1, text: "Jasprit Bumrah to Gaikwad: 1 run, yorker on the toes, squeezed out to deep point.", time: "Just now" },
          { over: "16.1", runs: 4, isFour: true, text: "Jasprit Bumrah to Gaikwad: FOUR! Steered masterfully past slip to the third man fence!", time: "1m ago" },
          { over: "15.6", runs: 0, text: "Hardik Pandya to Jadeja: Dot ball, beaten for pace.", time: "2m ago" },
        ],
      },
    },

    // 3. INTERNATIONAL UPCOMING MATCH
    {
      providerMatchId: "INT-UPCOMING-ENG-SA",
      teamA: "England",
      teamB: "South Africa",
      venue: "Lord's Cricket Ground, London",
      startTime: upcomingTime1,
      fantasyDeadline: upcomingTime1,
      status: "UPCOMING" as const,
      providerData: {
        category: "INTERNATIONAL",
        tournament: "International T20 Tri-Series",
        format: "T20I",
        teamACode: "ENG",
        teamBCode: "SA",
        teamAFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        teamBFlag: "🇿🇦",
        pitchReport: "Pace & bounce friendly, overcast weather expected.",
        avgScore: "172",
      },
    },

    // 4. DOMESTIC / T20 LEAGUE UPCOMING MATCH
    {
      providerMatchId: "DOM-UPCOMING-RCB-KKR",
      teamA: "Royal Challengers Bangalore",
      teamB: "Kolkata Knight Riders",
      venue: "M. Chinnaswamy Stadium, Bengaluru",
      startTime: upcomingTime2,
      fantasyDeadline: upcomingTime2,
      status: "UPCOMING" as const,
      providerData: {
        category: "DOMESTIC",
        tournament: "Indian Premier T20 League 2026",
        format: "T20",
        teamACode: "RCB",
        teamBCode: "KKR",
        teamAFlag: "🔥",
        teamBFlag: "⚔️",
        pitchReport: "Batting paradise, small boundaries with high run rates.",
        avgScore: "196",
      },
    },

    // 5. INTERNATIONAL COMPLETED MATCH
    {
      providerMatchId: "INT-COMPLETED-NZ-PAK",
      teamA: "New Zealand",
      teamB: "Pakistan",
      venue: "Eden Park, Auckland",
      startTime: completedTime,
      fantasyDeadline: completedTime,
      status: "COMPLETED" as const,
      providerData: {
        category: "INTERNATIONAL",
        tournament: "Super T20 Series",
        format: "T20I",
        teamACode: "NZ",
        teamBCode: "PAK",
        teamAFlag: "🇳🇿",
        teamBFlag: "🇵🇰",
        statusText: "New Zealand won by 18 runs",
        firstInnings: { team: "New Zealand", score: "194/5", overs: "20.0" },
        secondInnings: { team: "Pakistan", score: "176/8", overs: "20.0" },
        potm: "Glenn Phillips (62 off 31 balls)",
      },
    },
  ];

  for (const m of initialMatches) {
    const existing = await Match.findOne({ providerMatchId: m.providerMatchId });
    if (existing) {
      // If the match got corrupted into absurd numbers like 38000 runs, reset it to clean values!
      const exPd = (existing.providerData || {}) as any;
      if (Number(exPd.currentScore) > 300 || parseFloat(exPd.currentOvers || "0") > 25) {
        existing.providerData = m.providerData;
        existing.status = m.status;
        existing.startTime = m.startTime;
        existing.markModified("providerData");
        await existing.save();
        logger.info(`[simulator] Reset runaway match to realistic scores: ${m.teamA} vs ${m.teamB}`);
      }
    } else {
      const created = await Match.create(m);
      logger.info(`[simulator] Seeded match: ${m.teamA} vs ${m.teamB} (${m.status})`);

      // Create high-stake Mega & 1v1 Contests for each match
      if (m.status === "LIVE" || m.status === "UPCOMING") {
        await Contest.create({
          matchId: created._id,
          name: "Mega Contest ₹50,000 Jackpot",
          type: "PUBLIC",
          maxSlots: 5000,
          joinedSlots: 1420,
          rules: { entryFee: 49, prizePool: 50000 },
          status: "OPEN",
        });

        await Contest.create({
          matchId: created._id,
          name: "Head to Head (Double Winnings)",
          type: "PUBLIC",
          maxSlots: 2,
          joinedSlots: 1,
          rules: { entryFee: 99, prizePool: 180 },
          status: "OPEN",
        });
      }
    }
  }
}

/** Ticks live matches every 4 seconds, bowling a ball, updating scores, commentary & emitting socket events */
export function startLiveMatchSimulator() {
  setInterval(async () => {
    try {
      const liveMatches = await Match.find({ status: "LIVE" });
      if (!liveMatches.length) return;

      for (const match of liveMatches) {
        const pd = (match.providerData || {}) as any;
        if (!pd.currentScore) continue;

        // Parse current over & ball
        const currentOverFloat = parseFloat(pd.currentOvers || "17.4");
        const fullOvers = Math.floor(currentOverFloat);
        let ballOfOver = Math.round((currentOverFloat - fullOvers) * 10);
        ballOfOver++;

        let newOverStr = `${fullOvers}.${ballOfOver}`;
        if (ballOfOver >= 6) {
          newOverStr = `${fullOvers + 1}.0`;
        }

        // Random cricket ball outcome
        const rand = Math.random();
        let runsScored = 0;
        let isWicket = false;
        let isFour = false;
        let isSix = false;
        let outcomeBadge = "1";

        if (rand < 0.22) {
          runsScored = 0;
          outcomeBadge = "0";
        } else if (rand < 0.58) {
          runsScored = Math.random() < 0.7 ? 1 : 2;
          outcomeBadge = String(runsScored);
        } else if (rand < 0.76) {
          runsScored = 4;
          isFour = true;
          outcomeBadge = "4";
        } else if (rand < 0.88) {
          runsScored = 6;
          isSix = true;
          outcomeBadge = "6";
        } else {
          isWicket = true;
          runsScored = 0;
          outcomeBadge = "W";
        }

        // Update score & wickets
        pd.currentScore = (pd.currentScore || 150) + runsScored;
        if (isWicket && (pd.currentWickets || 0) < 9) {
          pd.currentWickets = (pd.currentWickets || 0) + 1;
        }
        pd.currentOvers = newOverStr;

        // Update CRR and Target status
        const totalBalls = fullOvers * 6 + ballOfOver;
        const crrCalc = totalBalls > 0 ? ((pd.currentScore / totalBalls) * 6).toFixed(2) : "9.00";
        pd.crr = crrCalc;

        const target = pd.target || 180;
        const runsNeeded = Math.max(0, target - pd.currentScore);
        const ballsLeft = Math.max(0, 120 - totalBalls);
        if (runsNeeded <= 0 || fullOvers >= 20 || (pd.currentWickets || 0) >= 10) {
          match.status = "COMPLETED";
          pd.statusText = runsNeeded <= 0
            ? `${pd.battingTeam} won by ${10 - (pd.currentWickets || 0)} wickets!`
            : `${pd.bowlingTeam} won by ${runsNeeded} runs!`;
        } else {
          pd.statusText = `${pd.battingTeam} need ${runsNeeded} run${runsNeeded > 1 ? "s" : ""} in ${ballsLeft} ball${ballsLeft > 1 ? "s" : ""} to win`;
        }

        // Update recent balls strip (keep last 8)
        const recent: string[] = Array.isArray(pd.recentBalls) ? pd.recentBalls : [];
        recent.push(outcomeBadge);
        if (recent.length > 8) recent.shift();
        pd.recentBalls = recent;

        // Update active batsman
        if (Array.isArray(pd.batsmen) && pd.batsmen.length > 0) {
          const striker = pd.batsmen.find((b: any) => b.isStriker) || pd.batsmen[0];
          striker.runs += runsScored;
          striker.balls += 1;
          if (isFour) striker.fours = (striker.fours || 0) + 1;
          if (isSix) striker.sixes = (striker.sixes || 0) + 1;

          // Swap strike on single or odd runs
          if (runsScored % 2 === 1 && pd.batsmen.length > 1) {
            pd.batsmen.forEach((b: any) => (b.isStriker = !b.isStriker));
          }
        }

        // Pick commentary text
        let commentText = `${pd.bowler?.name || "Bowler"} to ${pd.batsmen?.[0]?.name || "Batsman"}: `;
        if (isWicket) {
          commentText += "WICKET! OUT! Caught in the deep! Massive breakthrough in the contest!";
        } else if (isSix) {
          commentText += "SIX! Dispatched deep into the night sky over long-on!";
        } else if (isFour) {
          commentText += "FOUR! Smacked through extra cover with blistering timing!";
        } else if (runsScored > 0) {
          commentText += `${runsScored} run${runsScored > 1 ? "s" : ""}, punched into the outfield.`;
        } else {
          commentText += "Defended back cleanly towards mid-off. No run.";
        }

        const newComment: BallEvent = {
          over: newOverStr,
          runs: runsScored,
          isWicket,
          isFour,
          isSix,
          text: commentText,
          time: "Just now",
        };

        const commentaryList: BallEvent[] = Array.isArray(pd.commentary) ? pd.commentary : [];
        commentaryList.unshift(newComment);
        if (commentaryList.length > 15) commentaryList.pop();
        pd.commentary = commentaryList;

        // Save back to match
        match.markModified("providerData");
        await match.save();

        // Emit over socket to all connected users in the match room and live feed
        const livePayload = {
          matchId: match._id.toString(),
          status: match.status,
          teamA: match.teamA,
          teamB: match.teamB,
          venue: match.venue,
          startTime: match.startTime,
          providerData: pd,
        };

        emitToMatch(match._id.toString(), "match:update", livePayload);
        emitToMatch("live-feed", "match:score_update", livePayload);
      }
    } catch (err) {
      logger.error("[simulator] Error ticking live match", { err });
    }
  }, 4000); // Ticks every 4 seconds
}
