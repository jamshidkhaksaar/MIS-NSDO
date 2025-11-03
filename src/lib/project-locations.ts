export const PROJECT_LOCATION_DELIMITER = "::";

export type ProjectProvinceLocations = {
  province: string;
  districts: string[];
  villages: string[];
};

export type ProjectLocationArrays = {
  provinces: string[];
  districts: string[];
  communities: string[];
};

const UNASSIGNED_LABEL = "Unassigned";

const normalizeName = (value: string): string => value.replace(/\s+/g, " ").trim();

export const encodeProjectLocations = (entries: ProjectProvinceLocations[]): ProjectLocationArrays => {
  const provinceSet = new Set<string>();
  const districtTokens: string[] = [];
  const communityTokens: string[] = [];

  entries.forEach((entry) => {
    const province = normalizeName(entry.province);
    if (!province) {
      return;
    }
    provinceSet.add(province);

    entry.districts.forEach((district) => {
      const name = normalizeName(district);
      if (!name) {
        return;
      }
      districtTokens.push(`${province}${PROJECT_LOCATION_DELIMITER}${name}`);
    });

    entry.villages.forEach((village) => {
      const name = normalizeName(village);
      if (!name) {
        return;
      }
      communityTokens.push(`${province}${PROJECT_LOCATION_DELIMITER}${name}`);
    });
  });

  return {
    provinces: Array.from(provinceSet),
    districts: Array.from(new Set(districtTokens)),
    communities: Array.from(new Set(communityTokens)),
  };
};

export const decodeLocationToken = (token: string): { province: string | null; value: string } => {
  const separatorIndex = token.indexOf(PROJECT_LOCATION_DELIMITER);
  if (separatorIndex === -1) {
    return { province: null, value: token.trim() };
  }
  const province = token.slice(0, separatorIndex).trim();
  const value = token.slice(separatorIndex + PROJECT_LOCATION_DELIMITER.length).trim();
  return {
    province: province || null,
    value,
  };
};

type ProvinceBucket = {
  province: string;
  districts: Set<string>;
  villages: Set<string>;
};

const ensureProvinceBucket = (map: Map<string, ProvinceBucket>, province: string): ProvinceBucket => {
  const existing = map.get(province);
  if (existing) {
    return existing;
  }
  const bucket: ProvinceBucket = {
    province,
    districts: new Set<string>(),
    villages: new Set<string>(),
  };
  map.set(province, bucket);
  return bucket;
};

export const mergeProjectLocations = (
  provinces: string[] | null | undefined,
  districtTokens: string[] | null | undefined,
  communityTokens: string[] | null | undefined
): ProjectProvinceLocations[] => {
  const normalizedProvinces = (provinces ?? []).map(normalizeName).filter(Boolean);
  const bucketMap = new Map<string, ProvinceBucket>();

  normalizedProvinces.forEach((province) => {
    ensureProvinceBucket(bucketMap, province);
  });

  const fallbackDistricts = new Set<string>();
  const fallbackVillages = new Set<string>();

  const assignToken = (token: string, type: "districts" | "villages") => {
    const { province, value } = decodeLocationToken(token);
    const name = normalizeName(value);
    if (!name) {
      return;
    }
    if (province) {
      ensureProvinceBucket(bucketMap, province)[type].add(name);
      return;
    }
    if (type === "districts") {
      fallbackDistricts.add(name);
    } else {
      fallbackVillages.add(name);
    }
  };

  (districtTokens ?? []).forEach((token) => assignToken(token, "districts"));
  (communityTokens ?? []).forEach((token) => assignToken(token, "villages"));

  if (fallbackDistricts.size || fallbackVillages.size) {
    if (bucketMap.size === 1) {
      const [single] = bucketMap.values();
      fallbackDistricts.forEach((district) => single.districts.add(district));
      fallbackVillages.forEach((village) => single.villages.add(village));
    } else if (fallbackDistricts.size || fallbackVillages.size) {
      const bucket = ensureProvinceBucket(bucketMap, UNASSIGNED_LABEL);
      fallbackDistricts.forEach((district) => bucket.districts.add(district));
      fallbackVillages.forEach((village) => bucket.villages.add(village));
    }
  }

  const results = Array.from(bucketMap.values())
    .map<ProjectProvinceLocations>((bucket) => ({
      province: bucket.province,
      districts: Array.from(bucket.districts).sort((a, b) => a.localeCompare(b)),
      villages: Array.from(bucket.villages).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.province.localeCompare(b.province));

  return results;
};
