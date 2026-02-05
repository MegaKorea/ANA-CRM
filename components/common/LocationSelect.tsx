'use client';

import { Col, Row, Select } from 'antd';
import type { CSSProperties, JSX } from 'react';
import { useMemo, useState } from 'react';
import { LocationDebounceDelay, LocationSelectText } from '@/constants/location';
import { TextValue } from '@/constants/common';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { useDistricts, useProvinces, useWards } from '@/lib/hooks/use-location';
import type { OpenOapiDistrict, OpenOapiProvince, OpenOapiWard } from '@/lib/services/location.service';

export interface LocationValue {
  provinceId?: string;
  districtId?: string;
  wardId?: string;
  province?: OpenOapiProvince;
  district?: OpenOapiDistrict;
  ward?: OpenOapiWard;
}

export interface LocationSelectProps {
  value?: LocationValue;
  onChange?: (value: LocationValue) => void;
  disabled?: boolean;
  style?: CSSProperties;
  onlyProvince?: boolean;
}

interface LocationSelectOption {
  value: string;
  label: string;
}

export function LocationSelect({
  value,
  onChange,
  disabled,
  style,
  onlyProvince,
}: LocationSelectProps): JSX.Element {
  const locationValue = value ?? {};

  const [provinceSearch, setProvinceSearch] = useState<string>(TextValue.EMPTY);
  const [districtSearch, setDistrictSearch] = useState<string>(TextValue.EMPTY);
  const [wardSearch, setWardSearch] = useState<string>(TextValue.EMPTY);

  const debouncedProvinceSearch = useDebouncedValue(provinceSearch, LocationDebounceDelay.SEARCH_MS);
  const debouncedDistrictSearch = useDebouncedValue(districtSearch, LocationDebounceDelay.SEARCH_MS);
  const debouncedWardSearch = useDebouncedValue(wardSearch, LocationDebounceDelay.SEARCH_MS);

  const provincesQuery = useProvinces(debouncedProvinceSearch);
  const districtsQuery = useDistricts(onlyProvince ? undefined : locationValue.provinceId, debouncedDistrictSearch);
  const wardsQuery = useWards(onlyProvince ? undefined : locationValue.districtId, debouncedWardSearch);

  const provinceOptions = useMemo<LocationSelectOption[]>(() => {
    return (provincesQuery.data ?? []).map((province) => ({
      value: province.id,
      label: province.name,
    }));
  }, [provincesQuery.data]);

  const districtOptions = useMemo<LocationSelectOption[]>(() => {
    return (districtsQuery.data ?? []).map((district) => ({
      value: district.id,
      label: district.name,
    }));
  }, [districtsQuery.data]);

  const wardOptions = useMemo<LocationSelectOption[]>(() => {
    return (wardsQuery.data ?? []).map((ward) => ({
      value: ward.id,
      label: ward.name,
    }));
  }, [wardsQuery.data]);

  const isDistrictDisabled = Boolean(disabled) || !locationValue.provinceId;
  const isWardDisabled = Boolean(disabled) || !locationValue.districtId;

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
        value={locationValue.provinceId}
        options={provinceOptions}
        loading={provincesQuery.isFetching}
        onChange={(nextProvinceId) => {
          const nextProvince =
            (provincesQuery.data ?? []).find((province) => province.id === nextProvinceId) ?? undefined;
          const nextValue: LocationValue = {
            provinceId: nextProvinceId || undefined,
            province: nextProvince,
            districtId: undefined,
            district: undefined,
            wardId: undefined,
            ward: undefined,
          };
          onChange?.(nextValue);
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
          value={locationValue.provinceId}
          options={provinceOptions}
          loading={provincesQuery.isFetching}
          onChange={(nextProvinceId) => {
            const nextProvince =
              (provincesQuery.data ?? []).find((province) => province.id === nextProvinceId) ?? undefined;
            const nextValue: LocationValue = {
              provinceId: nextProvinceId || undefined,
              province: nextProvince,
              districtId: undefined,
              district: undefined,
              wardId: undefined,
              ward: undefined,
            };
            onChange?.(nextValue);
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
          value={locationValue.districtId}
          options={districtOptions}
          loading={districtsQuery.isFetching}
          onChange={(nextDistrictId) => {
            const nextDistrict =
              (districtsQuery.data ?? []).find((district) => district.id === nextDistrictId) ?? undefined;
            const nextValue: LocationValue = {
              provinceId: locationValue.provinceId,
              province: locationValue.province,
              districtId: nextDistrictId || undefined,
              district: nextDistrict,
              wardId: undefined,
              ward: undefined,
            };
            onChange?.(nextValue);
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
          value={locationValue.wardId}
          options={wardOptions}
          loading={wardsQuery.isFetching}
          onChange={(nextWardId) => {
            const nextWard =
              (wardsQuery.data ?? []).find((ward) => ward.id === nextWardId) ?? undefined;
            const nextValue: LocationValue = {
              provinceId: locationValue.provinceId,
              province: locationValue.province,
              districtId: locationValue.districtId,
              district: locationValue.district,
              wardId: nextWardId || undefined,
              ward: nextWard,
            };
            onChange?.(nextValue);
          }}
        />
      </Col>
    </Row>
  );
}

