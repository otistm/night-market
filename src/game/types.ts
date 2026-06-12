export type Tier = 0 | 1 | 2 | 3;

export type EffectKey =
  | 'dmg'
  | 'shield'
  | 'heal'
  | 'burn'
  | 'poison'
  | 'haste'
  | 'slow'
  | 'cleanse'
  | 'income';

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
}

export interface ItemDef {
  id: string;
  nm: string;
  ico: string;
  sz: 1 | 2 | 3;
  cd: number;
  eff: ItemEffects;
  crit?: number;
  life?: number;
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
  tag: string;
  pass: string;
  mult: HeroMult;
}

export interface RivalDef {
  nm: string;
  face: string;
}

export interface ItemStats extends ItemEffects {
  cd: number;
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
}

export interface CombatItem {
  it: ItemInstance;
  st: ItemStats;
  t: number;
  el: HTMLElement | null;
}

export interface CombatSide {
  hp: number;
  maxHp: number;
  shield: number;
  burn: number;
  poison: number;
  isPlayer: boolean;
  burnT: number;
  poisonT: number;
  items: CombatItem[];
}

export interface CombatState {
  t: number;
  over: boolean;
  sudden: boolean;
  sdT: number;
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
