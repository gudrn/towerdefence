import { Monster } from './monster'; // 몬스터 클래스 임포트
import { GameRoom } from '../room/gameRoom'; // 게임 룸 클래스 임포트
import { PosInfo, PosInfoSchema } from 'src/protocol/struct_pb'; // 위치 정보 구조체 임포트
import { v4 as uuidv4 } from 'uuid';
import { create } from '@bufbuild/protobuf';
// 스킬을 사용하는 몬스터 클래스 정의
export class SkillUseMonster extends Monster {
  private cloneInterval: NodeJS.Timeout | null = null; // 클론 생성 간격
  private isAttackUpBuffed: boolean = false; // 버프 상태 여부

  constructor(prefabId: string, pos: PosInfo, room: GameRoom) {
    super(prefabId, pos, room); // 부모 클래스 생성자 호출
  }

  // 공격력을 버프하는 메서드
  public buffAttack() {
    this.isAttackUpBuffed = true;
    this.setAttackDamage(this.getAttackDamage() * 3); // 공격력 증가
  }

  // 버프를 제거하는 메서드
  public removeBuff() {
    this.isAttackUpBuffed = false;
    this.setAttackDamage(this.getAttackDamage() / 3); // 공격력 감소
    // 버프 상태 해제
  }
  public getIsAttackUpBuffed() {
    return this.isAttackUpBuffed;
  }

  // // 클론 생성을 시작하는 메서드
  // public startCloning() {
  //   // 이미 실행 중인 경우 중복 실행 방지
  //   if (this.cloneInterval) {
  //     return;
  //   }

  //   // 최대 클론 수 제한 추가
  //   let cloneCount = 0;
  //   const MAX_CLONES = 5;

  //   this.cloneInterval = setInterval(() => {
  //     if (cloneCount >= MAX_CLONES) {
  //       clearInterval(this.cloneInterval!);
  //       this.cloneInterval = null;
  //       return;
  //     }

  //     const uuid = uuidv4();
  //     let newX = this.getPos().x;
  //     let newY = this.getPos().y;

  //     // 상하좌우에 장애물이 없는 위치를 찾기 위한 시도
  //     const directions = [
  //       { x: 1, y: 0 },
  //       { x: -1, y: 0 },
  //       { x: 0, y: 1 },
  //       { x: 0, y: -1 },
  //     ];

  //     for (const direction of directions) {
  //       const testX = this.getPos().x + direction.x;
  //       const testY = this.getPos().y + direction.y;

  //       if (
  //         this.room.validatePosition({
  //           x: testX,
  //           y: testY,
  //           $typeName: 'Protocol.PosInfo',
  //           uuid: this.getId(),
  //         })
  //       ) {
  //         newX = testX;
  //         newY = testY;
  //         break;
  //       }
  //     }

  //     const posInfo = create(PosInfoSchema, {
  //       uuid: uuid,
  //       x: newX,
  //       y: newY,
  //     });
  //     const clone = new SkillUseMonster('Robot2', posInfo, this.room); // 클론 생성
  //     clone.statusMultiplier(this.room.monsterStatusMultiplier); // 강화 배율 적용
  //     this.room.addObject(clone); // 룸에 클론 추가
  //     console.log(`클론 생성: ${uuid}`);
  //     cloneCount++;
  //   }, 1000); // 1초 간격으로 클론 생성
  // }

  // 몬스터가 죽었을 때 호출되는 메서드
  public onDeath() {
    if (this.cloneInterval) {
      clearInterval(this.cloneInterval);
    }
    if (this.isAttackUpBuffed) {
      this.isAttackUpBuffed = false;
      this.setAttackDamage(this.getAttackDamage() / 3);
    }

    // 부모 클래스의 onDeath 호출
    super.onDeath();
  }
}
