export const OpenOapiLocationApi = {
  BASE_URL: 'https://open.oapi.vn/location',
  PROVINCES_PATH: '/provinces',
  DISTRICTS_PATH_PREFIX: '/districts',
  WARDS_PATH_SEGMENT: 'wards',
} as const;

/** New API: provinces.open-api.vn (v1) */
export const ProvincesOpenApi = {
  BASE_URL: 'https://provinces.open-api.vn/api/v1',
  PROVINCES_PATH: '/p/',
  DISTRICTS_PATH_PREFIX: '/d/',
  WARDS_PATH_PREFIX: '/w/',
} as const;

export const LocationApiQueryParam = {
  PAGE: 'page',
  SIZE: 'size',
  QUERY: 'query',
} as const;

/** Query params for provinces.open-api.vn */
export const ProvincesApiQueryParam = {
  DEPTH: 'depth',
  Q: 'q',
} as const;

export const LocationPaginationDefault = {
  PAGE: 0,
  SIZE: 30,
} as const;

export const LocationDebounceDelay = {
  SEARCH_MS: 300,
} as const;

export const LocationHttpTimeout = {
  REQUEST_MS: 10_000,
} as const;

export const LocationQueryKey = {
  PROVINCES: 'location-provinces',
  DISTRICTS: 'location-districts',
  WARDS: 'location-wards',
  // New API keys
  PROVINCES_V2: 'location-provinces-v2',
  DISTRICTS_V2: 'location-districts-v2',
  WARDS_V2: 'location-wards-v2',
} as const;

export const LocationSelectText = {
  PROVINCE_PLACEHOLDER: 'Chọn tỉnh/thành',
  DISTRICT_PLACEHOLDER: 'Chọn quận/huyện',
  WARD_PLACEHOLDER: 'Chọn phường/xã',
} as const;
