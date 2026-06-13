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

export interface ItemDef {
  id: string;
  nm: string;
  ico: string;
  sz: 1 | 2 | 3;
  cd: number;
  eff: ItemEffects;
  tags: ItemTag[];
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
  /** Never sold in the market — wielded only by fiends. */
  fiendOnly?: boolean;
  flav: string;
}

export interface ItemInstance {
  uid: number;
  defId: string;
  tier: Tier;
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
  /** Flat multipliers on item effect values. */
  mult: HeroMult;
  /** Vampire: lifesteal heals this much more (e.g. 1.5). */
  lifestealMult?: number;
  /** Griffin: added critical strike chance on all wares. */
  critBonus?: number;
  /** Werewolf: weapon damage ramps by this fraction per second of battle. */
  dmgRampPerSec?: number;
  /** Sorcerer: slows also deal this much arcane damage per second of slow. */
  slowArcane?: number;
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

export interface FiendDef {
  id: string;
  nm: string;
  face: string;
  baseHp: number;
  threat: string;
  hint: string;
  /** Passive aura: heals this much every second. */
  regen?: number;
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
  gold: number;
  maxHp: number;
  board: ItemInstance[];
  shop: (ItemInstance | null)[];
  rerollCost: number;
  speed: 1 | 2 | 4;
  /** UID to scroll into view after next shop render */
  revealUid?: number;
}

export interface EnemyMeta {
  nm: string;
  face: string;
  hp: number;
  board: ItemInstance[];
  threat?: string;
  hint?: string;
  regen?: number;
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
  items: CombatItem[];
}

export interface CombatState {
  t: number;
  over: boolean;
  sudden: boolean;
  sdT: number;
  /** Player gold snapshot at battle start (Coin Bomb scaling). */
  goldAtStart: number;
  p: CombatSide;
  e: CombatSide;
  enemyMeta: EnemyMeta;
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
