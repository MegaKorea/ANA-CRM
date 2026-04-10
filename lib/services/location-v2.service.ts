/**
 * Location service using the NEW provinces.open-api.vn API.
 * Data structure uses numeric `code` instead of string `id`.
 *
 * Endpoints:
 *  - GET /api/v1/p/          → list provinces
 *  - GET /api/v1/p/{code}?depth=2  → province + districts
 *  - GET /api/v1/d/{code}?depth=2  → district + wards
 *  - GET /api/v1/w/{code}    → ward detail
 */
import axios from 'axios';
import { LocationHttpTimeout, ProvincesOpenApi, ProvincesApiQueryParam } from '@/constants/location';

// ─── Response shapes from provinces.open-api.vn ────────────────────────────

export interface ProvincesApiProvince {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  phone_code: number;
}

export interface ProvincesApiDistrict {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  province_code: number;
}

export interface ProvincesApiWard {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  district_code: number;
}

export interface ProvincesApiProvinceWithDistricts extends ProvincesApiProvince {
  districts: ProvincesApiDistrict[];
}

export interface ProvincesApiDistrictWithWards extends ProvincesApiDistrict {
  wards: ProvincesApiWard[];
}

// ─── Axios client ───────────────────────────────────────────────────────────

const provincesApiClient = axios.create({
  baseURL: ProvincesOpenApi.BASE_URL,
  timeout: LocationHttpTimeout.REQUEST_MS,
});

// ─── Fetch helpers ──────────────────────────────────────────────────────────

/**
 * Fetch all provinces. Optionally filter by search query (client-side).
 */
export async function fetchProvincesV2(query?: string): Promise<ProvincesApiProvince[]> {
  const params: Record<string, string | number> = {
    [ProvincesApiQueryParam.DEPTH]: 1,
  };

  if (query?.trim()) {
    params[ProvincesApiQueryParam.Q] = query.trim();
  }

  const response = await provincesApiClient.get<ProvincesApiProvince[]>(ProvincesOpenApi.PROVINCES_PATH, { params });
  return response.data;
}

/**
 * Fetch districts for a given province code.
 */
export async function fetchDistrictsByProvinceCodeV2(
  provinceCode: number,
  query?: string,
): Promise<ProvincesApiDistrict[]> {
  const response = await provincesApiClient.get<ProvincesApiProvinceWithDistricts>(
    `${ProvincesOpenApi.PROVINCES_PATH}${provinceCode}`,
    { params: { [ProvincesApiQueryParam.DEPTH]: 2 } },
  );

  const districts = response.data.districts ?? [];

  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    return districts.filter((d) => d.name.toLowerCase().includes(q));
  }

  return districts;
}

/**
 * Fetch wards for a given district code.
 */
export async function fetchWardsByDistrictCodeV2(
  districtCode: number,
  query?: string,
): Promise<ProvincesApiWard[]> {
  const response = await provincesApiClient.get<ProvincesApiDistrictWithWards>(
    `${ProvincesOpenApi.DISTRICTS_PATH_PREFIX}${districtCode}`,
    { params: { [ProvincesApiQueryParam.DEPTH]: 2 } },
  );

  const wards = response.data.wards ?? [];

  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    return wards.filter((w) => w.name.toLowerCase().includes(q));
  }

  return wards;
}
