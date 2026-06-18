export type Tier = 0 | 1 | 2 | 3;

export type ItemTag =
  | 'Damage'
  | 'Poison'
  | 'Burn'
  | 'Heal'
  | 'Shield'
  | 'Haste'
  | 'Slow'
  | 'Curse'
  | 'Cleanse'
  | 'Pierce'
  | 'Execute'
  | 'Ramp'
  | 'Gold'
  | 'Thorns'
  | 'Lifesteal';

export type EffectKey =
  | 'dmg'
  | 'shield'
  | 'heal'
  | 'burn'
  | 'poison'
  | 'haste'
  | 'slow'
  | 'cleanse'
  | 'income'
  | 'curse';

export interface ItemEffects {
  dmg?: number;
  shield?: number;
  heal?: number;
  burn?: number;
  poison?: number;
  haste?: number;
  slow?: number;
  cleanse?: number;
  income?: number;
  /** Seconds of curse applied to the foe (their heals & shields are halved). */
  curse?: number;
}

/** Stat deltas an adjacency synergy can grant. */
export interface AdjBonus {
  dmg?: number;
  burn?: number;
  poison?: number;
  shield?: number;
  heal?: number;
  thorns?: number;
  crit?: number;
  execute?: number;
  haste?: number;
  slow?: number;
  life?: number;
  hits?: number;
  ramp?: number;
  curse?: number;
}

/**
 * A bespoke adjacency synergy. Resolved at battle start from the ware's
 * left/right neighbours in stall (board) order.
 * - mode 'aura': buffs neighbouring wares (optionally only those with `targetTag`).
 * - mode 'self': buffs this ware when a neighbour condition is met
 *   (`needTag` / `flanked` / `perTag`).
 */
export interface AdjAbility {
  mode: 'aura' | 'self';
  /** self: at least one neighbour carries this tag. */
  needTag?: ItemTag;
  /** self: both sides are occupied. */
  flanked?: boolean;
  /** self: scale `add` by the count (0-2) of neighbours carrying this tag. */
  perTag?: ItemTag;
  /** aura: only buff neighbours carrying this tag (omit = both neighbours). */
  targetTag?: ItemTag;
  /** Additive stat deltas. */
  add?: AdjBonus;
  /** Cooldown scale on the affected ware(s); < 1 fires faster. */
  cdMult?: number;
  /** Human-readable synergy text for the item sheet. */
  desc: string;
}

export interface ItemDef {
  id: string;
  nm: string;
  ico: string;
  sz: 1 | 2 | 3;
  cd: number;
  eff: ItemEffects;
  tags: ItemTag[];
  /** Bespoke adjacency synergy resolved from stall neighbours. */
  adj?: AdjAbility;
  /** Owning peddler; their market stocks this ware more often. */
  heroId?: string;
  crit?: number;
  /** Lifesteal: fraction of damage dealt returned as healing. */
  life?: number;
  /** Damage ignores shields entirely. */
  pierce?: boolean;
  /** Bonus damage to foes below 30% health. */
  execute?: number;
  /** Permanent +damage each time this ware fires (within one battle). */
  ramp?: number;
  /** Multistrike: number of hits per trigger (dmg is per hit). */
  hits?: number;
  /** Passive aura: reflects this much damage to attackers. */
  thorns?: number;
  /** Damage scales with held gold (+1 per 3 gold). */
  goldScale?: boolean;
  /**
   * Detonate: on trigger, deal bonus damage equal to the foe's current burn or
   * poison stack, then clear that stack (a DoT payoff / pressure valve).
   */
  consume?: 'burn' | 'poison';
  /** Never sold in the market — wielded only by fiends. */
  fiendOnly?: boolean;
  flav: string;
}

export interface ItemInstance {
  uid: number;
  defId: string;
  tier: Tier;
  /** Boss-reward wares are claimed for free (no gold cost) while offered. */
  free?: boolean;
}

export interface HeroMult {
  dmg?: number;
  shield?: number;
  heal?: number;
  burn?: number;
  poison?: number;
}

export interface HeroDef {
  id: string;
  nm: string;
  face: string;
  /** Portrait art shown on the pledge carousel. */
  img?: string;
  tag: string;
  pass: string;
  /** Signature accent colour (hex), themes the player's stall to the hero. */
  accent: string;
  /** Flat multipliers on item effect values. */
  mult: HeroMult;
  /** Vampire: lifesteal heals this much more (e.g. 1.5). */
  lifestealMult?: number;
  /** Vampire: heals this fraction of the burn/poison damage foes suffer. */
  dotLifesteal?: number;
  /** Griffin: added critical strike chance on all wares. */
  critBonus?: number;
  /** Werewolf: weapon damage ramps by this fraction per second of battle. */
  dmgRampPerSec?: number;
  /** Sorcerer: slows also deal this much arcane damage per second of slow. */
  slowArcane?: number;
  /** Goblin: gold-scaling wares gain +1 damage per this many gold (default 3). */
  goldScaleDiv?: number;
  /** Goblin: rerolls are free. */
  freeReroll?: boolean;
  /** Goblin: wares cost this much less (min price 1). */
  discount?: number;
  /** Queen: bonus gold each night. */
  bonusGold?: number;
}

export interface FiendWare {
  defId: string;
  tier: Tier;
}

/**
 * Lightweight per-boss mechanics so same-archetype Lords feel distinct.
 * - enrage: below `at` HP fraction, the boss's outgoing damage is ×`mult`.
 * - shieldwall: every `every` seconds the boss gains `amount` shield.
 * - ward: non-pierce hits the boss takes are reduced by `pct` (0–1).
 */
export type BossGimmick =
  | { kind: 'enrage'; at: number; mult: number; label?: string }
  | { kind: 'shieldwall'; every: number; amount: number }
  | { kind: 'ward'; pct: number };

export interface FiendDef {
  id: string;
  nm: string;
  face: string;
  /** Full portrait shown before battle. */
  img?: string;
  baseHp: number;
  threat: string;
  hint: string;
  /** Passive aura: heals this much every second. */
  regen?: number;
  /** Optional signature mechanic. */
  gimmick?: BossGimmick;
  wares: FiendWare[];
}

export interface ItemStats extends ItemEffects {
  cd: number;
  crit: number;
  life: number;
  pierce: boolean;
  execute: number;
  ramp: number;
  hits: number;
  thorns: number;
  goldScale: boolean;
}

export interface RunState {
  hero: HeroDef;
  day: number;
  wins: number;
  lives: number;
  /** Failed attempts against the current boss — scales their HP and ware tiers. */
  bossAttempts: number;
  gold: number;
  maxHp: number;
  board: ItemInstance[];
  shop: (ItemInstance | null)[];
  rerollCost: number;
  /** Gold spent (buys + rerolls) since this night's shop opened — fuels goldScale wares. */
  goldSpentThisNight: number;
  speed: 1 | 2 | 4;
  /** UID to scroll into view after next shop render */
  revealUid?: number;
}

export interface EnemyMeta {
  nm: string;
  face: string;
  /** Full boss portrait, used as the battle backdrop. */
  img?: string;
  hp: number;
  board: ItemInstance[];
  threat?: string;
  hint?: string;
  regen?: number;
  gimmick?: BossGimmick;
}

export interface CombatItem {
  it: ItemInstance;
  st: ItemStats;
  t: number;
  /** Accumulated ramp damage bonus this battle. */
  rampBonus: number;
  el: HTMLElement | null;
}

export interface CombatSide {
  hp: number;
  maxHp: number;
  shield: number;
  burn: number;
  poison: number;
  /** Seconds of curse remaining — heals & shields halved while > 0. */
  curse: number;
  /** Summed thorns aura: reflected to attackers on direct hits. */
  thorns: number;
  /** Passive healing per second. */
  regen: number;
  isPlayer: boolean;
  hero?: HeroDef;
  burnT: number;
  poisonT: number;
  regenT: number;
  /** Optional signature mechanic (bosses only). */
  gimmick?: BossGimmick;
  /** Timer for periodic gimmicks (e.g. shieldwall). */
  gimmickT: number;
  /** Whether an enrage gimmick has fired its activation narration. */
  enraged: boolean;
  items: CombatItem[];
}

export interface CombatState {
  t: number;
  over: boolean;
  sudden: boolean;
  sdT: number;
  /** Gold the player spent this night, snapshotted at battle start (goldScale ware scaling). */
  goldSpent: number;
  p: CombatSide;
  e: CombatSide;
  enemyMeta: EnemyMeta;
  /** Filled when the battle ends. */
  report?: import('@/game/battle-report').BattleReport;
}

export type ScreenId = 'title-screen' | 'hero-screen' | 'shop-screen' | 'battle-screen';

export type Mood = 'shop' | 'battle' | 'sudden' | 'win';

export type ItemLocation = 'shop' | 'board' | 'combat';

export interface DragState {
  it: ItemInstance;
  where: 'shop' | 'board';
  el: HTMLElement;
  sx: number;
  sy: number;
  moved: boolean;
  decided: boolean;
  ghost: HTMLElement | null;
  pointerId: number;
}
