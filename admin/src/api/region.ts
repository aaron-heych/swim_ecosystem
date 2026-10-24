import { get, post, put } from './request';

export interface RegionItem {
  id: number;
  code: string;
  name: string;
  level: number;
  parentId: number | null;
  sort: number;
  status?: number;
  children?: RegionItem[];
}

export interface CreateRegionParams {
  code: string;
  name: string;
  level: number;
  parentId?: number;
  sort?: number;
}

export interface UpdateRegionParams {
  code?: string;
  name?: string;
  sort?: number;
  status?: number;
}

/** 省级列表 */
export function getProvinces() {
  return get<RegionItem[]>('/region/provinces');
}

/** 按 parentId 取子级 */
export function getRegionChildren(parentId: number) {
  return get<RegionItem[]>(`/region/children/${parentId}`);
}

export function getAdminRegionTree() {
  return get<RegionItem[]>('/admin/region/tree');
}

export function createRegion(data: CreateRegionParams) {
  return post<RegionItem>('/admin/region', data);
}

export function updateRegion(id: number, data: UpdateRegionParams) {
  return put<RegionItem>(`/admin/region/${id}`, data);
}
