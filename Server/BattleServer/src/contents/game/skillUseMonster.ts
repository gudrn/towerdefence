import { Monster } from './monster'; // 몬스터 클래스 임포트
import { GameRoom } from '../room/gameRoom'; // 게임 룸 클래스 임포트
import { PosInfo, PosInfoSchema } from 'src/protocol/struct_pb'; // 위치 정보 구조체 임포트
import { v4 as uuidv4 } from 'uuid';
import { create } from '@bufbuild/protobuf';
// 스킬을 사용하는 몬스터 클래스 정의
export class SkillUseMonster extends Monster {
  private cloneInterval: NodeJS.Timeout | null = null; // 클론 생성 간격
  private isattackUpBuffed: boolean = false; // 버프 상태 여부
  private isAttackCoolDownBuffed: boolean = false; // 공격 속도 버프 상태 여부

  constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
    super(prefabId, pos, room); // 부모 클래스 생성자 호출

    switch (this.prefabId) {
      case 'Robot3':
        this.isAttackCoolDownBuffed = true; // 공격 속도 버프 상태 설정
        break;
    }
  }

  // 공격력을 버프하는 메서드
  public buffAttack() {
    this.isattackUpBuffed = true;
    this.setAttackDamage(this.getAttackDamage() * 2.5); // 공격력 증가
  }

  // 버프를 제거하는 메서드
  public removeBuff() {
    this.isattackUpBuffed = false;
    this.setAttackDamage(this.getAttackDamage() / 2.5); // 공격력 감소
    // 버프 상태 해제
  }

  public attackCoolDownBuff() {
    this.isAttackCoolDownBuffed = true;
    this.setAttackCoolDown(this.getAttackCoolDown() * 0.7);
  }

  public removeAttackCoolDownBuff() {
    this.isAttackCoolDownBuffed = false;
    this.setAttackCoolDown(this.getAttackCoolDown() / 0.7);
  }
  public getIsAttackUpBuffed() {
    return this.isattackUpBuffed;
  }
  public getIsAttackCoolDownBuffed() {
    return this.isAttackCoolDownBuffed;
  }

  // 클론 생성을 시작하는 메서드
  public startCloning() {
    this.cloneInterval = setInterval(() => {
      const uuid = uuidv4();
      let newX = this.getPos().x;
      let newY = this.getPos().y;

      // 상하좌우에 장애물이 없는 위치를 찾기 위한 시도
      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];

      for (const direction of directions) {
        const testX = this.getPos().x + direction.x;
        const testY = this.getPos().y + direction.y;

        if (
          this.room.validatePosition({
            x: testX,
            y: testY,
            $typeName: 'Protocol.PosInfo',
            uuid: this.getId(),
          })
        ) {
          newX = testX;
          newY = testY;
          break;
        }
      }

      const posInfo = create(PosInfoSchema, {
        uuid: uuid,
        x: newX,
        y: newY,
      });
      const clone = new SkillUseMonster('Robot2', posInfo, this.room); // 클론 생성
      clone.statusMultiplier(this.room.monsterStatusMultiplier); // 강화 배율 적용
      this.room.addObject(clone); // 룸에 클론 추가
      console.log(`클론 생성: ${uuid}`);
    }, 1000); // 1초 간격으로 클론 생성
  }

  // 몬스터가 죽었을 때 호출되는 메서드
  public onDeath() {
    super.onDeath(); // 부모 클래스의 onDeath 호출
    if (this.cloneInterval) {
      // 클론 생성 간격이 설정되어 있을 경우
      clearInterval(this.cloneInterval); // 클론 생성 중지
    }
    this.removeBuff(); // 버프 제거
    this.room.removeObject(this.getId());
  }
}
