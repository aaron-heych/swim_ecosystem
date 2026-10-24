import { BadRequestException } from '@nestjs/common';
import { RegionService } from './region.service';

describe('RegionService 行政区维护', () => {
  let service: RegionService;

  const regionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn((region) => region),
    save: jest.fn(async (region) => region),
  };
  const managerRepo = {
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn(async (region) => region),
  };
  const manager = {
    getRepository: jest.fn(() => managerRepo),
    query: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(async (callback) => callback(manager)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RegionService(regionRepo as any, dataSource as any);
  });

  it('构建包含停用节点的省市区树', async () => {
    regionRepo.find.mockResolvedValue([
      { id: 1, parentId: null, level: 1, status: 1 },
      { id: 2, parentId: 1, level: 2, status: 0 },
      { id: 3, parentId: 2, level: 3, status: 0 },
    ]);

    const tree = await service.findAdminTree();

    expect(tree[0].children[0].children[0].id).toBe(3);
    expect(tree[0].children[0].status).toBe(0);
  });

  it('新增地区时拒绝层级不匹配的上级', async () => {
    regionRepo.findOne.mockResolvedValue({ id: 1, level: 1, status: 1 });

    await expect(
      service.create({
        code: '110101',
        name: '测试区',
        level: 3,
        parentId: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(regionRepo.save).not.toHaveBeenCalled();
  });

  it('有启用下级地区时拒绝停用上级', async () => {
    managerRepo.findOne.mockResolvedValue({
      id: 1,
      parentId: null,
      status: 1,
    });
    managerRepo.count.mockResolvedValue(1);

    await expect(service.update(1, { status: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(managerRepo.save).not.toHaveBeenCalled();
  });

  it('修改地区 code 和名称时，在事务内同步业务表引用', async () => {
    managerRepo.findOne.mockResolvedValue({
      id: 2,
      parentId: 1,
      level: 2,
      code: '1101',
      name: '旧名称',
      status: 1,
      sort: 0,
    });
    managerRepo.count.mockResolvedValue(0);

    await service.update(2, { code: '1102', name: '新名称' });

    expect(dataSource.transaction).toHaveBeenCalled();
    expect(manager.query).toHaveBeenCalledTimes(4);
    expect(manager.query).toHaveBeenCalledWith(
      'UPDATE `associations` SET `city_code` = ?, `city` = ? WHERE `city_code` = ?',
      ['1102', '新名称', '1101'],
    );
    expect(manager.query).toHaveBeenCalledWith(
      'UPDATE `winter_competitions` SET `city_code` = ?, `city` = ? WHERE `city_code` = ?',
      ['1102', '新名称', '1101'],
    );
  });
});
