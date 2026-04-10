import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { LocationQueryKey } from '@/constants/location';
import type {
  ProvincesApiProvince,
  ProvincesApiDistrict,
  ProvincesApiWard,
} from '@/lib/services/location-v2.service';
import {
  fetchProvincesV2,
  fetchDistrictsByProvinceCodeV2,
  fetchWardsByDistrictCodeV2,
} from '@/lib/services/location-v2.service';

export function useProvincesV2(searchQuery: string): UseQueryResult<ProvincesApiProvince[]> {
  return useQuery<ProvincesApiProvince[]>({
    queryKey: [LocationQueryKey.PROVINCES_V2, searchQuery],
    queryFn: () => fetchProvincesV2(searchQuery),
    staleTime: 10 * 60 * 1000, // provinces rarely change
  });
}

export function useDistrictsV2(
  provinceCode: number | undefined,
  searchQuery: string,
): UseQueryResult<ProvincesApiDistrict[]> {
  return useQuery<ProvincesApiDistrict[]>({
    queryKey: [LocationQueryKey.DISTRICTS_V2, provinceCode, searchQuery],
    enabled: Boolean(provinceCode),
    queryFn: () => fetchDistrictsByProvinceCodeV2(Number(provinceCode), searchQuery),
    staleTime: 10 * 60 * 1000,
  });
}

export function useWardsV2(
  districtCode: number | undefined,
  searchQuery: string,
): UseQueryResult<ProvincesApiWard[]> {
  return useQuery<ProvincesApiWard[]>({
    queryKey: [LocationQueryKey.WARDS_V2, districtCode, searchQuery],
    enabled: Boolean(districtCode),
    queryFn: () => fetchWardsByDistrictCodeV2(Number(districtCode), searchQuery),
    staleTime: 10 * 60 * 1000,
  });
}
