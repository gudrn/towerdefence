import { Tower } from "./tower";

class BuffTower extends Tower{
    override onDeath(): void {
        const towersInRange = this.getTowersInRange();

        for (let i = 0; i < towersInRange.length; i++) {
            if (!towersInRange[i].isBuffTowerInRange()) {
            towersInRange[i].removeAttackBuff();
            }
        }
    }
}