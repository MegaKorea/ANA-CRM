'use client';

import { Col, Row, Select } from 'antd';
import type { CSSProperties, JSX } from 'react';
import { useMemo, useState } from 'react';
import { LocationDebounceDelay, LocationSelectText } from '@/constants/location';
import { TextValue } from '@/constants/common';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useDistrictsV2, useProvincesV2, useWardsV2 } from '@/lib/hooks/use-location-v2';
import type {
  ProvincesApiProvince,
  ProvincesApiDistrict,
  ProvincesApiWard,
} from '@/lib/services/location-v2.service';

export interface LocationValueV2 {
  provinceCode?: number;
  districtCode?: number;
  wardCode?: number;
  province?: ProvincesApiProvince;
  district?: ProvincesApiDistrict;
  ward?: ProvincesApiWard;
  provinceId?: string;
  districtId?: string;
  wardId?: string;
}

export interface LocationSelectV2Props {
  value?: LocationValueV2;
  onChange?: (value: LocationValueV2) => void;
  disabled?: boolean;
  style?: CSSProperties;
  onlyProvince?: boolean;
}

interface LocationSelectOption {
  value: number;
  label: string;
}

function buildV2Value(
  province: ProvincesApiProvince | undefined,
  district: ProvincesApiDistrict | undefined,
  ward: ProvincesApiWard | undefined,
): LocationValueV2 {
  return {
    provinceCode: province?.code,
    districtCode: district?.code,
    wardCode: ward?.code,
    province,
    district,
    ward,
    provinceId: province?.code !== undefined ? String(province.code) : undefined,
    districtId: district?.code !== undefined ? String(district.code) : undefined,
    wardId: ward?.code !== undefined ? String(ward.code) : undefined,
  };
}

export function LocationSelectV2({
  value,
  onChange,
  disabled,
  style,
  onlyProvince,
}: LocationSelectV2Props): JSX.Element {
  const locationValue = value ?? {};

  const [provinceSearch, setProvinceSearch] = useState<string>(TextValue.EMPTY);
  const [districtSearch, setDistrictSearch] = useState<string>(TextValue.EMPTY);
  const [wardSearch, setWardSearch] = useState<string>(TextValue.EMPTY);

  const debouncedProvinceSearch = useDebouncedValue(provinceSearch, LocationDebounceDelay.SEARCH_MS);
  const debouncedDistrictSearch = useDebouncedValue(districtSearch, LocationDebounceDelay.SEARCH_MS);
  const debouncedWardSearch = useDebouncedValue(wardSearch, LocationDebounceDelay.SEARCH_MS);

  const provincesQuery = useProvincesV2(debouncedProvinceSearch);
  const districtsQuery = useDistrictsV2(
    onlyProvince ? undefined : locationValue.provinceCode,
    debouncedDistrictSearch,
  );
  const wardsQuery = useWardsV2(
    onlyProvince ? undefined : locationValue.districtCode,
    debouncedWardSearch,
  );

  const provinceOptions = useMemo<LocationSelectOption[]>(
    () =>
      (provincesQuery.data ?? []).map((p) => ({
        value: p.code,
        label: p.name,
      })),
    [provincesQuery.data],
  );

  const districtOptions = useMemo<LocationSelectOption[]>(
    () =>
      (districtsQuery.data ?? []).map((d) => ({
        value: d.code,
        label: d.name,
      })),
    [districtsQuery.data],
  );

  const wardOptions = useMemo<LocationSelectOption[]>(
    () =>
      (wardsQuery.data ?? []).map((w) => ({
        value: w.code,
        label: w.name,
      })),
    [wardsQuery.data],
  );

  const isDistrictDisabled = Boolean(disabled) || !locationValue.provinceCode;
  const isWardDisabled = Boolean(disabled) || !locationValue.districtCode;

  if (Boolean(onlyProvince)) {
    return (
      <Select
        showSearch={{
          filterOption: false,
          onSearch: (nextSearch) => {
            setProvinceSearch(nextSearch);
          },
        }}
        allowClear
        disabled={Boolean(disabled)}
        placeholder={LocationSelectText.PROVINCE_PLACEHOLDER}
        value={locationValue.provinceCode}
        options={provinceOptions}
        loading={provincesQuery.isFetching}
        onChange={(nextProvinceCode) => {
          const nextProvince =
            (provincesQuery.data ?? []).find((p) => p.code === nextProvinceCode) ?? undefined;
          onChange?.(buildV2Value(nextProvince, undefined, undefined));
        }}
      />
    );
  }

  return (
    <Row gutter={16} style={style}>
      <Col span={8}>
        <Select
          showSearch={{
            filterOption: false,
            onSearch: (nextSearch) => {
              setProvinceSearch(nextSearch);
            },
          }}
          allowClear
          disabled={Boolean(disabled)}
          placeholder={LocationSelectText.PROVINCE_PLACEHOLDER}
          value={locationValue.provinceCode}
          options={provinceOptions}
          loading={provincesQuery.isFetching}
          onChange={(nextProvinceCode) => {
            const nextProvince =
              (provincesQuery.data ?? []).find((p) => p.code === nextProvinceCode) ?? undefined;
            onChange?.(buildV2Value(nextProvince, undefined, undefined));
            setDistrictSearch(TextValue.EMPTY);
            setWardSearch(TextValue.EMPTY);
          }}
        />
      </Col>
      <Col span={8}>
        <Select
          showSearch={{
            filterOption: false,
            onSearch: (nextSearch) => {
              setDistrictSearch(nextSearch);
            },
          }}
          allowClear
          disabled={isDistrictDisabled}
          placeholder={LocationSelectText.DISTRICT_PLACEHOLDER}
          value={locationValue.districtCode}
          options={districtOptions}
          loading={districtsQuery.isFetching}
          onChange={(nextDistrictCode) => {
            const nextDistrict =
              (districtsQuery.data ?? []).find((d) => d.code === nextDistrictCode) ?? undefined;
            onChange?.(buildV2Value(locationValue.province, nextDistrict, undefined));
            setWardSearch(TextValue.EMPTY);
          }}
        />
      </Col>
      <Col span={8}>
        <Select
          showSearch={{
            filterOption: false,
            onSearch: (nextSearch) => {
              setWardSearch(nextSearch);
            },
          }}
          allowClear
          disabled={isWardDisabled}
          placeholder={LocationSelectText.WARD_PLACEHOLDER}
          value={locationValue.wardCode}
          options={wardOptions}
          loading={wardsQuery.isFetching}
          onChange={(nextWardCode) => {
            const nextWard =
              (wardsQuery.data ?? []).find((w) => w.code === nextWardCode) ?? undefined;
            onChange?.(buildV2Value(locationValue.province, locationValue.district, nextWard));
          }}
        />
      </Col>
    </Row>
  );
}
