/**
 * Taxonomy Service with localStorage caching
 * Caches taxonomy data for 24 hours to minimize file reads
 */

export interface TaxonomyCategory {
    code: string;
    description: string;
}

export interface TaxonomySubCategory {
    code: string;
    description: string;
    categoryCodes: string[];
}

export interface TaxonomyDetail {
    code: string;
    description: string;
    subCategoryCodes: string[];
}

export interface TaxonomyData {
    categories: TaxonomyCategory[];
    subCategories: TaxonomySubCategory[];
    details: TaxonomyDetail[];
}

export interface TaxonomyItem {
    category: string;
    subcategory: string;
    detail?: string;
    categoryDescription: string;
    subcategoryDescription: string;
    detailDescription?: string;
}

const CACHE_KEY = 'ovr_taxonomy_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheData {
    timestamp: number;
    data: TaxonomyData;
}

/**
 * Load taxonomy from localStorage cache or fetch from file
 */
export async function loadTaxonomy(): Promise<TaxonomyData> {
    // Check localStorage cache first
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
        try {
            const cacheData: CacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;

            // Return cached data if less than 24 hours old
            if (age < CACHE_DURATION) {
                return cacheData.data;
            }
        } catch (error) {
            console.error('Error parsing cached taxonomy:', error);
        }
    }

    // Fetch fresh data
    try {
        const response = await fetch('/taxonomy.min.json');
        const data: TaxonomyData = await response.json();

        // Cache the data
        const cacheData: CacheData = {
            timestamp: Date.now(),
            data,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        return data;
    } catch (error) {
        console.error('Error loading taxonomy:', error);
        throw error;
    }
}

/**
 * Get subcategories for a given category code
 */
export function getSubcategoriesForCategory(
    taxonomy: TaxonomyData,
    categoryCode: string
): TaxonomySubCategory[] {
    return taxonomy.subCategories.filter((sub) =>
        sub.categoryCodes.includes(categoryCode)
    );
}

/**
 * Get details for a given subcategory code
 */
export function getDetailsForSubcategory(
    taxonomy: TaxonomyData,
    subcategoryCode: string
): TaxonomyDetail[] {
    return taxonomy.details.filter((detail) =>
        detail.subCategoryCodes.includes(subcategoryCode)
    );
}

/**
 * Search taxonomy across all levels
 * Returns flattened results with category -> subcategory -> detail hierarchy
 */
export function searchTaxonomy(
    taxonomy: TaxonomyData,
    query: string
): TaxonomyItem[] {
    const searchTerm = query.toLowerCase();
    const results: TaxonomyItem[] = [];

    // Search through all combinations
    taxonomy.categories.forEach((category) => {
        const subcategories = getSubcategoriesForCategory(taxonomy, category.code);

        subcategories.forEach((subcategory) => {
            const details = getDetailsForSubcategory(taxonomy, subcategory.code);

            if (details.length > 0) {
                // Has details - create entries for each detail
                details.forEach((detail) => {
                    const combinedText = `${category.description} ${subcategory.description} ${detail.description}`.toLowerCase();

                    if (combinedText.includes(searchTerm)) {
                        results.push({
                            category: category.code,
                            subcategory: subcategory.code,
                            detail: detail.code,
                            categoryDescription: category.description,
                            subcategoryDescription: subcategory.description,
                            detailDescription: detail.description,
                        });
                    }
                });
            } else {
                // No details - just category + subcategory
                const combinedText = `${category.description} ${subcategory.description}`.toLowerCase();

                if (combinedText.includes(searchTerm)) {
                    results.push({
                        category: category.code,
                        subcategory: subcategory.code,
                        categoryDescription: category.description,
                        subcategoryDescription: subcategory.description,
                    });
                }
            }
        });
    });

    return results;
}

/**
 * Get full item by codes
 */
export function getTaxonomyItem(
    taxonomy: TaxonomyData,
    categoryCode: string,
    subcategoryCode: string,
    detailCode?: string
): TaxonomyItem | null {
    const category = taxonomy.categories.find((c) => c.code === categoryCode);
    const subcategory = taxonomy.subCategories.find((s) => s.code === subcategoryCode);

    if (!category || !subcategory) return null;

    const item: TaxonomyItem = {
        category: category.code,
        subcategory: subcategory.code,
        categoryDescription: category.description,
        subcategoryDescription: subcategory.description,
    };

    if (detailCode) {
        const detail = taxonomy.details.find((d) => d.code === detailCode);
        if (detail) {
            item.detail = detail.code;
            item.detailDescription = detail.description;
        }
    }

    return item;
}

/**
 * Clear taxonomy cache (useful for testing or forcing refresh)
 */
export function clearTaxonomyCache(): void {
    localStorage.removeItem(CACHE_KEY);
}
