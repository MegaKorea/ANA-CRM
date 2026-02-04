import axios from 'axios';
import { LocationApiQueryParam, LocationHttpTimeout, LocationPaginationDefault, OpenOapiLocationApi } from '@/constants/location';
import { TextValue, UrlSymbol } from '@/constants/common';

export interface OpenOapiListResponse<TItem> {
  total: number;
  data: TItem[];
  code: string;
}

export interface OpenOapiLocationItemBase {
  id: string;
  name: string;
  type?: number;
  typeText?: string;
}

export interface OpenOapiProvince extends OpenOapiLocationItemBase {
  slug?: string;
}

export interface OpenOapiDistrict extends OpenOapiLocationItemBase {
  provinceId: string;
}

export interface OpenOapiWard extends OpenOapiLocationItemBase {
  districtId?: string;
}

export interface OpenOapiLocationSearchParams {
  query?: string;
  page?: number;
  size?: number;
}

const openOapiLocationClient = axios.create({
  baseURL: OpenOapiLocationApi.BASE_URL,
  timeout: LocationHttpTimeout.REQUEST_MS,
});

function normalizeQuery(query: string | undefined): string {
  return (query ?? TextValue.EMPTY).trim();
}

function buildPaginationParams(params?: OpenOapiLocationSearchParams): Record<string, string | number> {
  const page = params?.page ?? LocationPaginationDefault.PAGE;
  const size = params?.size ?? LocationPaginationDefault.SIZE;
  const query = normalizeQuery(params?.query);

  return {
    [LocationApiQueryParam.PAGE]: page,
    [LocationApiQueryParam.SIZE]: size,
    [LocationApiQueryParam.QUERY]: query,
  };
}

function buildDistrictsPath(provinceId: string): string {
  return `${OpenOapiLocationApi.DISTRICTS_PATH_PREFIX}${UrlSymbol.SLASH}${provinceId}`;
}

function buildWardsPath(districtId: string): string {
  return `${UrlSymbol.SLASH}${OpenOapiLocationApi.WARDS_PATH_SEGMENT}${UrlSymbol.SLASH}${districtId}`;
}

export async function fetchProvinces(params?: OpenOapiLocationSearchParams): Promise<OpenOapiProvince[]> {
  const response = await openOapiLocationClient.get<OpenOapiListResponse<OpenOapiProvince>>(OpenOapiLocationApi.PROVINCES_PATH, {
    params: buildPaginationParams(params),
  });

  return response.data.data;
}

export async function fetchDistrictsByProvinceId(
  provinceId: string,
  params?: OpenOapiLocationSearchParams
): Promise<OpenOapiDistrict[]> {
  const response = await openOapiLocationClient.get<OpenOapiListResponse<OpenOapiDistrict>>(buildDistrictsPath(provinceId), {
    params: buildPaginationParams(params),
  });

  return response.data.data;
}

export async function fetchWardsByDistrictId(
  districtId: string,
  params?: OpenOapiLocationSearchParams
): Promise<OpenOapiWard[]> {
  const response = await openOapiLocationClient.get<OpenOapiListResponse<OpenOapiWard>>(buildWardsPath(districtId), {
    params: buildPaginationParams(params),
  });

  return response.data.data;
}

