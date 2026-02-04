import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { LocationQueryKey } from '@/constants/location';
import type { OpenOapiDistrict, OpenOapiProvince, OpenOapiWard } from '@/lib/services/location.service';
import { fetchDistrictsByProvinceId, fetchProvinces, fetchWardsByDistrictId } from '@/lib/services/location.service';

export function useProvinces(searchQuery: string): UseQueryResult<OpenOapiProvince[]> {
  return useQuery<OpenOapiProvince[]>({
    queryKey: [LocationQueryKey.PROVINCES, searchQuery],
    queryFn: () => fetchProvinces({ query: searchQuery }),
  });
}

export function useDistricts(
  provinceId: string | undefined,
  searchQuery: string
): UseQueryResult<OpenOapiDistrict[]> {
  return useQuery<OpenOapiDistrict[]>({
    queryKey: [LocationQueryKey.DISTRICTS, provinceId, searchQuery],
    enabled: Boolean(provinceId),
    queryFn: () => fetchDistrictsByProvinceId(String(provinceId), { query: searchQuery }),
  });
}

export function useWards(districtId: string | undefined, searchQuery: string): UseQueryResult<OpenOapiWard[]> {
  return useQuery<OpenOapiWard[]>({
    queryKey: [LocationQueryKey.WARDS, districtId, searchQuery],
    enabled: Boolean(districtId),
    queryFn: () => fetchWardsByDistrictId(String(districtId), { query: searchQuery }),
  });
}

