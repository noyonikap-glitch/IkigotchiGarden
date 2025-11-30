// utils/getPlantImage.js
export default function getPlantImage(type) {
    const lower = type.toLowerCase();
    if (lower.includes('monstera')) return require('../assets/monstera.png');
    if (lower.includes('snake')) return require('../assets/snake-plant.png');
    if (lower.includes('fiddle')) return require('../assets/fiddleleaf.png');
    if (lower.includes('pothos')) return require('../assets/pothos.png');
    if (lower.includes('peace')) return require('../assets/peace-lily.png');
    return require('../assets/app_icon.png'); // fallback image
  }
  