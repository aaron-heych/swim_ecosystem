import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompetitionService } from './competition.service';
import { WinterCompetitionScoreRule } from './competition.entity';

/**
 * 积分设置单元测试：
 *  - getScoreRules：默认回落 / 自定义返回
 *  - saveScoreRules：名次重复 400 / 事务整体替换 / 空数组恢复默认
 *  - defaultScore：全局默认 / 自定义优先 / 未覆盖名次 0 / 空名次 0
 *  - createResult：未传积分时按规则自动填充
 */
describe('CompetitionService 积分规则', () => {
  let service: CompetitionService;

  const competitionRepo = { findOne: jest.fn() };
  const groupRepo = { findOne: jest.fn() };
  const resultRepo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 99, ...x })),
  };
  const sponsorRepo = {};
  const scoreRuleRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };
  const em = {
    delete: jest.fn(),
    create: jest.fn((_e: any, x: any) => x),
    save: jest.fn(),
  };
  const dataSource = { transaction: jest.fn(async (cb: any) => cb(em)) };

  beforeEach(() => {
    jest.clearAllMocks();
    competitionRepo.findOne.mockResolvedValue({ id: 1 });
    service = new CompetitionService(
      competitionRepo as any,
      groupRepo as any,
      resultRepo as any,
      sponsorRepo as any,
      scoreRuleRepo as any,
      dataSource as any,
    );
  });

  describe('getScoreRules', () => {
    it('无自定义规则：返回全局默认 9/7/6/5/4/3/2/1 且 isDefault=true', async () => {
      scoreRuleRepo.find.mockResolvedValue([]);
      const res = await service.getScoreRules(1);
      expect(res.isDefault).toBe(true);
      expect(res.rules).toEqual([
        { rankNo: 1, score: 9 },
        { rankNo: 2, score: 7 },
        { rankNo: 3, score: 6 },
        { rankNo: 4, score: 5 },
        { rankNo: 5, score: 4 },
        { rankNo: 6, score: 3 },
        { rankNo: 7, score: 2 },
        { rankNo: 8, score: 1 },
      ]);
    });

    it('有自定义规则：按名次升序返回且 isDefault=false，score 转数值', async () => {
      scoreRuleRepo.find.mockResolvedValue([
        { rankNo: 1, score: '10.00' },
        { rankNo: 2, score: '8.00' },
      ]);
      const res = await service.getScoreRules(1);
      expect(res.isDefault).toBe(false);
      expect(res.rules).toEqual([
        { rankNo: 1, score: 10 },
        { rankNo: 2, score: 8 },
      ]);
      expect(scoreRuleRepo.find).toHaveBeenCalledWith({
        where: { competitionId: 1 },
        order: { rankNo: 'ASC' },
      });
    });

    it('赛事不存在：抛 NotFoundException', async () => {
      competitionRepo.findOne.mockResolvedValue(null);
      await expect(service.getScoreRules(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('saveScoreRules', () => {
    it('名次重复：抛 BadRequestException 且不进入事务', async () => {
      await expect(
        service.saveScoreRules(1, {
          rules: [
            { rankNo: 1, score: 10 },
            { rankNo: 1, score: 5 },
          ],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('整体替换：事务内先删后插，返回保存后的规则', async () => {
      scoreRuleRepo.find.mockResolvedValue([
        { rankNo: 1, score: '10.00' },
        { rankNo: 2, score: '8.00' },
      ]);
      const res = await service.saveScoreRules(1, {
        rules: [
          { rankNo: 1, score: 10 },
          { rankNo: 2, score: 8 },
        ],
      } as any);
      expect(em.delete).toHaveBeenCalledWith(WinterCompetitionScoreRule, {
        competitionId: 1,
      });
      expect(em.save).toHaveBeenCalledWith(WinterCompetitionScoreRule, [
        { competitionId: 1, rankNo: 1, score: 10 },
        { competitionId: 1, rankNo: 2, score: 8 },
      ]);
      expect(res.rules).toEqual([
        { rankNo: 1, score: 10 },
        { rankNo: 2, score: 8 },
      ]);
    });

    it('空数组：仅删除不插入，恢复默认规则', async () => {
      scoreRuleRepo.find.mockResolvedValue([]);
      const res = await service.saveScoreRules(1, { rules: [] } as any);
      expect(em.delete).toHaveBeenCalledWith(WinterCompetitionScoreRule, {
        competitionId: 1,
      });
      expect(em.save).not.toHaveBeenCalled();
      expect(res.isDefault).toBe(true);
      expect(res.rules[0]).toEqual({ rankNo: 1, score: 9 });
    });
  });

  describe('defaultScore（自动积分）', () => {
    const call = (rank?: number | null) =>
      (service as any).defaultScore(rank, 1) as Promise<number>;

    it('无自定义规则：按全局默认，前 8 名 9/7/6/5/4/3/2/1，超出为 0', async () => {
      scoreRuleRepo.count.mockResolvedValue(0);
      expect(await call(1)).toBe(9);
      expect(await call(2)).toBe(7);
      expect(await call(8)).toBe(1);
      expect(await call(9)).toBe(0);
    });

    it('有自定义规则：按自定义取值，未覆盖名次为 0', async () => {
      scoreRuleRepo.count.mockResolvedValue(3);
      scoreRuleRepo.findOne.mockResolvedValue({ rankNo: 2, score: '8.00' });
      expect(await call(2)).toBe(8);
      scoreRuleRepo.findOne.mockResolvedValue(null);
      expect(await call(5)).toBe(0);
    });

    it('名次为空：返回 0 且不查库', async () => {
      expect(await call(undefined)).toBe(0);
      expect(await call(null)).toBe(0);
      expect(scoreRuleRepo.count).not.toHaveBeenCalled();
    });
  });

  describe('createResult 自动积分', () => {
    beforeEach(() => {
      groupRepo.findOne.mockResolvedValue({
        id: 10,
        competitionId: 1,
        name: '男子50米自由泳',
      });
    });

    it('未传积分：按赛事自定义规则自动填充', async () => {
      scoreRuleRepo.count.mockResolvedValue(1);
      scoreRuleRepo.findOne.mockResolvedValue({ rankNo: 2, score: '8.00' });
      const res = await service.createResult(1, {
        groupId: 10,
        participantName: '测试选手',
        rank: 2,
      } as any);
      expect(res.score).toBe(8);
    });

    it('显式传积分：不触发自动计算', async () => {
      const res = await service.createResult(1, {
        groupId: 10,
        participantName: '测试选手',
        rank: 1,
        score: 12.5,
      } as any);
      expect(res.score).toBe(12.5);
      expect(scoreRuleRepo.count).not.toHaveBeenCalled();
    });
  });
});
