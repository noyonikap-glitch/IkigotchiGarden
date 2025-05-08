import baseList from '../data/plants.json';

export function getWateringInterval(type, customList = []) {
  const lower = type.toLowerCase();

  const baseMatch = baseList.find(p =>
    lower.includes(p.name.toLowerCase())
  );
  if (baseMatch) return baseMatch.wateringInterval;

  const customMatch = customList.find(p =>
    lower.includes(p.name.toLowerCase())
  );
  if (customMatch) return customMatch.wateringInterval;

  return 7;
}
