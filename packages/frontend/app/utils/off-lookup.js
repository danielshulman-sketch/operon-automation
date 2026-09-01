const OFF_FIELDS = [
    'product_name',
    'brands',
    'ingredients_text',
    'ingredients',
    'allergens_tags',
    'additives_tags',
    'categories_tags',
    'nutriments',
].join(',');

const ALLERGEN_TRIGGER_MAP = {
    milk: 'dairy',
    gluten: 'gluten',
    'sulphur-dioxide-and-sulphites': 'processed',
};

const ARTIFICIAL_SWEETENER_ADDITIVES = new Set([
    'en:e950', 'en:e951', 'en:e952', 'en:e954', 'en:e955', 'en:e960', 'en:e961', 'en:e962', 'en:e968',
]);

const NIGHTSHADE_KEYWORDS = ['tomato', 'potato', 'pepper', 'paprika', 'eggplant', 'aubergine', 'chilli', 'chili'];
const CITRUS_KEYWORDS = ['lemon', 'lime', 'orange', 'grapefruit', 'citrus'];
const HISTAMINE_KEYWORDS = ['vinegar', 'soy sauce', 'fermented', 'aged cheese', 'sauerkraut', 'wine'];
const ALCOHOL_KEYWORDS = ['alcohol', 'wine', 'beer', 'spirit', 'liqueur'];
const CAFFEINE_CATEGORY_KEYWORDS = ['coffee', 'tea', 'energy-drink', 'cola'];
const FRIED_KEYWORDS = ['fried', 'crisps', 'chips'];

function deriveTriggers({ ingredientsLower, allergenTags, additiveTags, categoryTags, nutriments }) {
    const triggers = new Set();

    (allergenTags || []).forEach((tag) => {
        const key = tag.replace(/^en:/, '');
        if (ALLERGEN_TRIGGER_MAP[key]) {
            triggers.add(ALLERGEN_TRIGGER_MAP[key]);
        }
    });

    if ((additiveTags || []).some((tag) => ARTIFICIAL_SWEETENER_ADDITIVES.has(tag))) {
        triggers.add('artificial-sweetener');
    }
    if ((additiveTags || []).length > 0) {
        triggers.add('processed');
    }

    const categoryText = (categoryTags || []).join(' ').toLowerCase();
    if (CAFFEINE_CATEGORY_KEYWORDS.some((kw) => categoryText.includes(kw))) {
        triggers.add('caffeine');
    }
    if (categoryText.includes('alcoholic')) {
        triggers.add('alcohol');
    }

    const text = ingredientsLower || '';
    if (ALCOHOL_KEYWORDS.some((kw) => text.includes(kw))) triggers.add('alcohol');
    if (NIGHTSHADE_KEYWORDS.some((kw) => text.includes(kw))) triggers.add('nightshade');
    if (CITRUS_KEYWORDS.some((kw) => text.includes(kw))) triggers.add('citrus');
    if (HISTAMINE_KEYWORDS.some((kw) => text.includes(kw))) triggers.add('histamine');
    if (FRIED_KEYWORDS.some((kw) => text.includes(kw))) triggers.add('fried');
    if (text.includes('spicy') || text.includes('chilli') || text.includes('chili')) triggers.add('spicy');

    const sugar = nutriments?.sugars_100g;
    if (typeof sugar === 'number' && sugar >= 15) triggers.add('high-sugar');

    const fat = nutriments?.fat_100g;
    if (typeof fat === 'number' && fat >= 17.5) triggers.add('high-fat');

    return [...triggers];
}

function guessCategory(categoryTags = []) {
    const text = categoryTags.join(' ').toLowerCase();
    if (text.includes('beverage') || text.includes('drink') || text.includes('water') || text.includes('juice')) return 'drink';
    if (text.includes('dessert') || text.includes('candy') || text.includes('chocolate') || text.includes('ice-cream')) return 'dessert';
    if (text.includes('snack') || text.includes('chips') || text.includes('crisps')) return 'snack';
    if (text.includes('meal') || text.includes('dish')) return 'meal';
    return 'other';
}

export async function lookupBarcode(code) {
    const sanitized = String(code || '').replace(/[^0-9]/g, '');
    if (!sanitized) {
        return { found: false };
    }

    const url = `https://world.openfoodfacts.org/api/v2/product/${sanitized}.json?fields=${OFF_FIELDS}`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'OperonFoodPainTracker/1.0 (contact: support@operon.uk)' },
    });

    if (!response.ok) {
        return { found: false };
    }

    const data = await response.json();
    if (data.status !== 1 || !data.product) {
        return { found: false };
    }

    const product = data.product;
    const productName = product.product_name || null;
    const brand = product.brands || null;

    if (!productName && !product.ingredients_text && !(product.ingredients || []).length) {
        return { found: false };
    }

    let ingredients = [];
    if (Array.isArray(product.ingredients) && product.ingredients.length > 0) {
        ingredients = product.ingredients
            .map((ing) => (ing.text || '').trim().toLowerCase())
            .filter(Boolean);
    } else if (product.ingredients_text) {
        ingredients = product.ingredients_text
            .split(/,|\(|\)/)
            .map((s) => s.trim().toLowerCase())
            .filter((s) => s.length > 1);
    }
    // De-dupe while preserving order
    ingredients = [...new Set(ingredients)].slice(0, 40);

    const possibleTriggers = deriveTriggers({
        ingredientsLower: (product.ingredients_text || '').toLowerCase(),
        allergenTags: product.allergens_tags,
        additiveTags: product.additives_tags,
        categoryTags: product.categories_tags,
        nutriments: product.nutriments,
    });

    const displayName = [productName, brand].filter(Boolean).join(' — ') || `Product ${sanitized}`;

    return {
        found: true,
        barcode: sanitized,
        productName: displayName,
        analysis: {
            items: [productName || displayName],
            ingredients,
            ingredients_from_label: ingredients.length > 0,
            category: guessCategory(product.categories_tags),
            possible_triggers: possibleTriggers.length > 0 ? possibleTriggers : ['none'],
            summary: displayName,
        },
    };
}
