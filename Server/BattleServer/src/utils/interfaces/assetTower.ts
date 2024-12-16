export interface AssetTower {
    prefabId: string;
    attackDamage: number;
    attackRange: number;
    attackCoolDown: number;
    maxHp: number;
    // ?:는 있어도되고 없어도 된다는 뜻
    buffAmount?: number;
    // slowDuration?: number;
    // slowAmount?: number;
    explosionRadius?: number;
  }