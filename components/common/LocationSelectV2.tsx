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
  /** Numeric province code (new API) */
  provinceCode?: number;
  /** Numeric district code (new API) */
  districtCode?: number;
  /** Numeric ward code (new API) */
  wardCode?: number;
  /** Full province object */
  province?: ProvincesApiProvince;
  /** Full district object */
  district?: ProvincesApiDistrict;
  /** Full ward object */
  ward?: ProvincesApiWard;
  // ── Backward-compat fields (mirrors old LocationValue shape) ──────────────
  /** Same as provinceCode cast to string – lets old formatLocationValue still work */
  provinceId?: string;
  /** Same as districtCode cast to string */
  districtId?: string;
  /** Same as wardCode cast to string */
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

/** Build a LocationValueV2 that exposes BOTH the new code-based fields AND
 *  the legacy string-id fields so that existing formatLocationValue() calls
 *  keep working without any changes. */
function buildV2Value(
  province: ProvincesApiProvince | undefined,
  district: ProvincesApiDistrict | undefined,
  ward: ProvincesApiWard | undefined,
): LocationValueV2 {
  return {
    // new numeric fields
    provinceCode: province?.code,
    districtCode: district?.code,
    wardCode: ward?.code,
    // object references
    province,
    district,
    ward,
    // legacy string-id shim so old formatLocationValue() keeps rendering names
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
