export const OpenOapiLocationApi = {
  BASE_URL: 'https://open.oapi.vn/location',
  PROVINCES_PATH: '/provinces',
  DISTRICTS_PATH_PREFIX: '/districts',
  WARDS_PATH_SEGMENT: 'wards',
} as const;

export const LocationApiQueryParam = {
  PAGE: 'page',
  SIZE: 'size',
  QUERY: 'query',
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
} as const;

export const LocationSelectText = {
  PROVINCE_PLACEHOLDER: 'Chọn tỉnh/thành',
  DISTRICT_PLACEHOLDER: 'Chọn quận/huyện',
  WARD_PLACEHOLDER: 'Chọn phường/xã',
} as const;

