import { get } from './request';

export interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  parentId: number | null;
  sort: number;
}

/** 省级列表 */
export function getProvinces() {
  return get<RegionItem[]>('/region/provinces');
}

/** 按 parentId 取子级 */
export function getRegionChildren(parentId: number) {
  return get<RegionItem[]>(`/region/children/${parentId}`);
}
