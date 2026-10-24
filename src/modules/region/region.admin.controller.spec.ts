import { ForbiddenException } from '@nestjs/common';
import { RegionAdminController } from './region.admin.controller';

describe('RegionAdminController 权限', () => {
  const regionService = {
    findAdminTree: jest.fn(),
  };
  const controller = new RegionAdminController(regionService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('拒绝非 super_admin 读取行政区管理树', () => {
    expect(() => controller.tree({ roleCodes: ['operator'] } as any)).toThrow(
      ForbiddenException,
    );
    expect(regionService.findAdminTree).not.toHaveBeenCalled();
  });

  it('允许 super_admin 读取行政区管理树', () => {
    const tree = [{ id: 1, code: '11', name: '北京市' }];
    regionService.findAdminTree.mockReturnValue(tree);

    expect(controller.tree({ roleCodes: ['super_admin'] } as any)).toBe(tree);
  });
});
