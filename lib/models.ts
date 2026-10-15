import mongoose, { Schema, type Model, type Types } from "mongoose";

/* ────────────────────────────────────────────────────────────
 * Shared enums / small shapes
 * ──────────────────────────────────────────────────────────── */

export type UserRole = "player" | "admin";
export type TeamStatus = "forming" | "ready" | "in_match" | "disqualified";

export type MatchPhase =
  | "lobby"
  | "briefing"
  | "coding"
  | "attack"
  | "repair"
  | "testing"
  | "complete";

export type AttackType =
  | "flip_operator"
  | "boundary"
  | "logical"
  | "loop_bound"
  | "zero_compare"
  | "increment"
  | "semicolon"
  | "token_misspell"
  | "bracket";

export type ViolationType =
  | "blur"
  | "visibility_hidden"
  | "fullscreen_exit"
  | "copy"
  | "cut"
  | "paste"
  | "context_menu"
  | "devtools"
  | "multi_session";

/* ────────────────────────────────────────────────────────────
 * User
 * ──────────────────────────────────────────────────────────── */

export type Disqualification = {
  reason: string;
  detail?: string;
  at: Date;
  matchId?: Types.ObjectId;
};

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  roll: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  teamId?: Types.ObjectId;
  memberIndex: number;
  isCaptain: boolean;
  disqualified: boolean;
  disqualification?: Disqualification;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisqualificationSchema = new Schema<Disqualification>(
  {
    reason: { type: String, required: true },
    detail: { type: String },
    at: { type: Date, required: true, default: () => new Date() },
    matchId: { type: Schema.Types.ObjectId, ref: "Match" },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    roll: { type: String, required: true, uppercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["player", "admin"], default: "player" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    memberIndex: { type: Number, required: true, default: 0 },
    isCaptain: { type: Boolean, default: false },
    disqualified: { type: Boolean, default: false },
    disqualification: { type: DisqualificationSchema },
    lastSeenAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

/* ────────────────────────────────────────────────────────────
 * Team
 * ──────────────────────────────────────────────────────────── */

export type TeamMember = {
  userId?: Types.ObjectId;
  name: string;
  roll: string;
  memberIndex: number;
  joined: boolean;
};

export interface ITeam {
  _id: Types.ObjectId;
  name: string;
  code: string;
  college: string;
  captainId?: Types.ObjectId;
  members: TeamMember[];
  status: TeamStatus;
  flagged: boolean;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<TeamMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    roll: { type: String, required: true },
    memberIndex: { type: Number, required: true },
    joined: { type: Boolean, default: false },
  },
  { _id: false },
);

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true },
    college: { type: String, default: "" },
    captainId: { type: Schema.Types.ObjectId, ref: "User" },
    members: { type: [TeamMemberSchema], default: [] },
    status: {
      type: String,
      enum: ["forming", "ready", "in_match", "disqualified"],
      default: "forming",
    },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String },
  },
  { timestamps: true },
);

/* ────────────────────────────────────────────────────────────
 * Problem
 * ──────────────────────────────────────────────────────────── */

export type ProblemModule = {
  key: string;
  title: string;
  description: string;
  role: string;
};

export type TestCase = {
  name: string;
  input: string;
  expectedOutput: string;
};

export interface IProblem {
  _id: Types.ObjectId;
  key: string;
  number: number;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  weight: number;
  concepts: string[];
  modules: ProblemModule[];
  template: string;
  publicTests: TestCase[];
  hiddenTests: TestCase[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<TestCase>(
  {
    name: { type: String, required: true },
    input: { type: String, default: "" },
    expectedOutput: { type: String, default: "" },
  },
  { _id: false },
);

const ProblemModuleSchema = new Schema<ProblemModule>(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  { _id: false },
);

const ProblemSchema = new Schema<IProblem>(
  {
    key: { type: String, required: true, unique: true, index: true },
    number: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    weight: { type: Number, default: 100 },
    concepts: { type: [String], default: [] },
    modules: { type: [ProblemModuleSchema], default: [] },
    template: { type: String, required: true },
    publicTests: { type: [TestCaseSchema], default: [] },
    hiddenTests: { type: [TestCaseSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/* ────────────────────────────────────────────────────────────
 * Match
 * ──────────────────────────────────────────────────────────── */

export type MatchConfig = {
  difficulty: "Easy" | "Medium" | "Hard";
  codingSeconds: number;
  attackSeconds: number;
  repairSeconds: number;
  testingSeconds: number;
  briefingSeconds: number;
  tokenBudget: number;
  attackCooldownSeconds: number;
  rotateRepairs: boolean;
};

export type MatchModule = {
  key: string;
  title: string;
  authorUserId?: Types.ObjectId;
  authorMemberIndex?: number;
  repairUserId?: Types.ObjectId;
  placeholder: string;
};

export type AttackLog = {
  _id?: Types.ObjectId;
  detectiveUserId: Types.ObjectId;
  type: AttackType;
  cost: number;
  moduleKey?: string;
  applied: boolean;
  detail: string;
  at: Date;
};

export type SubmissionLog = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  kind: "run" | "submit";
  passed: number;
  total: number;
  status: string;
  message: string;
  at: Date;
};

export type MatchResult = {
  coderScore: number;
  detectiveScore: number;
  coderBreakdown: { label: string; awarded: number; max: number }[];
  detectiveBreakdown: { label: string; awarded: number; max: number }[];
  winner: "coder" | "detective" | "draw" | "pending";
  notes?: string;
  finalizedAt: Date;
};

export interface IMatch {
  _id: Types.ObjectId;
  round: number;
  label: string;
  problemKey: string;
  config: MatchConfig;
  phase: MatchPhase;
  coderTeamId?: Types.ObjectId;
  detectiveTeamId?: Types.ObjectId;
  phaseStartedAt: Date;
  phaseEndsAt: Date;
  code: { baseline: string; current: string };
  baselineClean: boolean;
  modules: MatchModule[];
  tokensSpent: number;
  attacks: AttackLog[];
  submissions: SubmissionLog[];
  result?: MatchResult;
  createdBy?: string;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MatchConfigSchema = new Schema<MatchConfig>(
  {
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    codingSeconds: { type: Number, default: 540 },
    attackSeconds: { type: Number, default: 120 },
    repairSeconds: { type: Number, default: 300 },
    testingSeconds: { type: Number, default: 180 },
    briefingSeconds: { type: Number, default: 60 },
    tokenBudget: { type: Number, default: 6 },
    attackCooldownSeconds: { type: Number, default: 0 },
    rotateRepairs: { type: Boolean, default: true },
  },
  { _id: false },
);

const MatchModuleSchema = new Schema<MatchModule>(
  {
    key: { type: String, required: true },
    title: { type: String, default: "" },
    authorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    authorMemberIndex: { type: Number },
    repairUserId: { type: Schema.Types.ObjectId, ref: "User" },
    placeholder: { type: String, default: "" },
  },
  { _id: false },
);

const AttackLogSchema = new Schema<AttackLog>(
  {
    detectiveUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    cost: { type: Number, default: 1 },
    moduleKey: { type: String },
    applied: { type: Boolean, default: false },
    detail: { type: String, default: "" },
    at: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const SubmissionLogSchema = new Schema<SubmissionLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["run", "submit"], default: "run" },
    passed: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, default: "" },
    message: { type: String, default: "" },
    at: { type: Date, default: () => new Date() },
  },
  { _id: true },
);

const MatchSchema = new Schema<IMatch>(
  {
    round: { type: Number, default: 1 },
    label: { type: String, default: "" },
    problemKey: { type: String, required: true },
    config: { type: MatchConfigSchema, default: () => ({}) },
    phase: {
      type: String,
      enum: ["lobby", "briefing", "coding", "attack", "repair", "testing", "complete"],
      default: "lobby",
      index: true,
    },
    coderTeamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    detectiveTeamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    phaseStartedAt: { type: Date, default: () => new Date() },
    phaseEndsAt: { type: Date, default: () => new Date() },
    code: {
      baseline: { type: String, default: "" },
      current: { type: String, default: "" },
    },
    baselineClean: { type: Boolean, default: false },
    modules: { type: [MatchModuleSchema], default: [] },
    tokensSpent: { type: Number, default: 0 },
    attacks: { type: [AttackLogSchema], default: [] },
    submissions: { type: [SubmissionLogSchema], default: [] },
    result: { type: Schema.Types.Mixed },
    createdBy: { type: String },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

/* ────────────────────────────────────────────────────────────
 * Violation (fair-play / anti-cheat log)
 * ──────────────────────────────────────────────────────────── */

export interface IViolation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  matchId?: Types.ObjectId;
  type: ViolationType;
  detail: string;
  disqualified: boolean;
  at: Date;
}

const ViolationSchema = new Schema<IViolation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    matchId: { type: Schema.Types.ObjectId, ref: "Match" },
    type: { type: String, required: true },
    detail: { type: String, default: "" },
    disqualified: { type: Boolean, default: false },
    at: { type: Date, default: () => new Date() },
  },
  { timestamps: false },
);

/* ────────────────────────────────────────────────────────────
 * Model registration (safe under hot-reload)
 * ──────────────────────────────────────────────────────────── */

/**
 * Register a mongoose model, reusing the cached one in production.
 *
 * In development Next.js keeps the Node process (and therefore the mongoose
 * model registry) alive across hot-reloads, so a schema edit would otherwise be
 * ignored until a full restart. Deleting the cached model first makes edits take
 * effect immediately. `mongoose.model()` throws if the name is already taken, so
 * the delete must happen before (re)registering.
 */
function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
  if (process.env.NODE_ENV !== "production") {
    delete mongoose.models[name];
  }
  return (
    (mongoose.models[name] as Model<T> | undefined) ??
    mongoose.model<T>(name, schema)
  );
}

export const User: Model<IUser> = registerModel<IUser>("User", UserSchema);

export const Team: Model<ITeam> = registerModel<ITeam>("Team", TeamSchema);

export const Problem: Model<IProblem> = registerModel<IProblem>(
  "Problem",
  ProblemSchema,
);

export const Match: Model<IMatch> = registerModel<IMatch>("Match", MatchSchema);

export const Violation: Model<IViolation> = registerModel<IViolation>(
  "Violation",
  ViolationSchema,
);
