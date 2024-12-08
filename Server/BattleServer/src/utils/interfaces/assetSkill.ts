interface BaseSkill {
    prefabId: string;
    type: "Attack" | "Heal"; //더 좋은 방법이 있을까?
}

export interface AssetAttackSkill extends BaseSkill {
    type: "Attack";
    attackDamage: number;
    attackRange: number;
}

export interface AssetHealSkill extends BaseSkill {
    type: "Heal";
    heal: number;
}
