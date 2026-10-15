/**
 * READ-ONLY arena inspector.
 *
 * Connects to the MongoDB in .env.local and prints the state that decides
 * whether a participant's code editor is unlocked:
 *   - each match's phase + phase deadlines + config durations
 *   - the coder team's members (joined? do they have a userId?)
 *   - each module's authorUserId / repairUserId (who is allowed to edit)
 *
 * It never writes anything.
 */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

function loadEnv() {
  const file = path.join(__dirname, "..", ".env.local");
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnv();
const uri = env.MONGODB_URI || process.env.MONGODB_URI;
const dbName = env.MONGODB_DB || process.env.MONGODB_DB || "techmafia";

function short(id) {
  return id ? String(id).slice(-6) : "—";
}

function secs(a, b) {
  if (!a) return "—";
  const ms = new Date(a).getTime() - (b ? new Date(b).getTime() : Date.now());
  return `${(ms / 1000).toFixed(1)}s`;
}

async function main() {
  if (!uri) {
    console.error("No MONGODB_URI found.");
    process.exit(1);
  }
  console.log("DB:", dbName);
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;

  const matches = await db.collection("matches").find({}).sort({ createdAt: -1 }).limit(8).toArray();
  const teams = await db.collection("teams").find({}).toArray();
  const users = await db.collection("users").find({}).toArray();

  const teamById = new Map(teams.map((t) => [String(t._id), t]));
  const userById = new Map(users.map((u) => [String(u._id), u]));

  console.log(`\nmatches=${matches.length} teams=${teams.length} users=${users.length}`);
  console.log("now:", new Date().toISOString());

  for (const m of matches) {
    const coder = teamById.get(String(m.coderTeamId));
    const det = teamById.get(String(m.detectiveTeamId));
    console.log("\n════════════════════════════════════════════════════════");
    console.log(`match ${short(m._id)}  "${m.label}"  problem=${m.problemKey}`);
    console.log(`  PHASE: ${m.phase}   ends in ${secs(m.phaseEndsAt)}   (startedAt=${m.startedAt ? "set" : "—"})`);
    console.log(`  phaseStartedAt=${m.phaseStartedAt?.toISOString?.() ?? m.phaseStartedAt}`);
    console.log(`  phaseEndsAt   =${m.phaseEndsAt?.toISOString?.() ?? m.phaseEndsAt}`);
    console.log(`  config: coding=${m.config?.codingSeconds}s briefing=${m.config?.briefingSeconds}s attack=${m.config?.attackSeconds}s repair=${m.config?.repairSeconds}s testing=${m.config?.testingSeconds}s rotate=${m.config?.rotateRepairs}`);
    console.log(`  coder team:     ${coder ? coder.name : "—"} (${short(m.coderTeamId)}) status=${coder?.status}`);
    console.log(`  detective team: ${det ? det.name : "—"} (${short(m.detectiveTeamId)}) status=${det?.status}`);

    if (coder) {
      const joined = coder.members.filter((x) => x.joined);
      console.log(`  coder members joined: ${joined.length}`);
      for (const mem of coder.members) {
        const u = mem.userId ? userById.get(String(mem.userId)) : null;
        console.log(`    [${mem.memberIndex}] ${mem.name} joined=${mem.joined} userId=${mem.userId ? short(mem.userId) : "NULL"} email=${u?.email ?? "—"} dq=${u?.disqualified ?? false}`);
      }
    }

    console.log("  modules (authorUserId / repairUserId / placeholder):");
    for (const mod of m.modules ?? []) {
      const authorName = mod.authorUserId ? (userById.get(String(mod.authorUserId))?.name ?? "?") : "NULL";
      const repairName = mod.repairUserId ? (userById.get(String(mod.repairUserId))?.name ?? "?") : "NULL";
      console.log(`    ${mod.key}: author=${short(mod.authorUserId)}(${authorName})  repair=${short(mod.repairUserId)}(${repairName})`);
    }

    const codeLen = (m.code?.current ?? "").length;
    console.log(`  code.current length=${codeLen}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
