import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const TAXONOMY_URL = "https://taxonomy.spsc.gov.sa/TREE.xlsx";
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'taxonomy.min.json');

// Types for our flat structure
interface Category {
    code: string;
    description: string;
}

interface SubCategory {
    code: string;
    description: string;
    categoryCodes: string[];
}

interface Detail {
    code: string;
    description: string;
    subCategoryCodes: string[];
}

interface TaxonomyData {
    categories: Category[];
    subCategories: SubCategory[];
    details: Detail[];
}

// Helper to log progress
function log(step: string, message: string) {
    console.log(`\x1b[36m[${new Date().toLocaleTimeString()}] [${step}]\x1b[0m ${message}`);
}

// Helper to split comma-separated codes and clean them
function parseCodes(input: string | number | undefined): string[] {
    if (!input) return [];
    return String(input)
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

async function main() {
    try {
        log('INIT', 'Starting taxonomy fetch script...');

        // 1. Fetch the file
        log('DOWNLOAD', `Fetching Excel file from ${TAXONOMY_URL}...`);
        const response = await fetch(TAXONOMY_URL);

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        log('DOWNLOAD', `Download complete. Size: ${(buffer.length / 1024).toFixed(2)} KB`);

        // 2. Parse Excel
        log('PARSE', 'Reading Excel file...');
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        const sheetNames = workbook.SheetNames;
        log('PARSE', `Found sheets: ${sheetNames.join(', ')}`);

        // Data storage using Maps to handle duplicates/merging automatically
        const categoriesMap = new Map<string, Category>();
        const subCategoriesMap = new Map<string, { description: string; categoryCodes: Set<string> }>();
        const detailsMap = new Map<string, { description: string; subCategoryCodes: Set<string> }>();

        // 3. Process Categories
        const catSheetName = sheetNames.find(s => s.toLowerCase().includes('category') && !s.toLowerCase().includes('sub'));
        if (catSheetName) {
            log('PROCESS', `Processing Categories from sheet: ${catSheetName}`);
            const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[catSheetName]);

            rows.forEach((row, index) => {
                // Adjust keys based on actual Excel headers (case insensitive lookup could be better but let's try standard)
                const code = row['Code'];
                const desc = row['Description'];

                if (code && desc) {
                    categoriesMap.set(code, { code, description: desc });
                }
            });
            log('PROCESS', `Loaded ${categoriesMap.size} unique categories.`);
        } else {
            log('WARN', 'Could not find a "Category" sheet.');
        }

        // 4. Process SubCategories
        const subCatSheetName = sheetNames.find(s => s.toLowerCase().includes('sub') && s.toLowerCase().includes('category'));
        if (subCatSheetName) {
            log('PROCESS', `Processing SubCategories from sheet: ${subCatSheetName}`);
            const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[subCatSheetName]);

            rows.forEach(row => {
                const code = row['Sub-Category Code'];
                const desc = row['Description'];
                const parentRaw = row['Category Code'];

                if (code && desc) {
                    if (!subCategoriesMap.has(code)) {
                        subCategoriesMap.set(code, { description: desc, categoryCodes: new Set() });
                    }

                    const entry = subCategoriesMap.get(code)!;
                    // Handle comma separated parents if any
                    const parents = parseCodes(parentRaw);
                    parents.forEach(p => entry.categoryCodes.add(p));
                }
            });
            log('PROCESS', `Loaded ${subCategoriesMap.size} unique sub-categories.`);
        } else {
            log('WARN', 'Could not find a "SubCategory" sheet.');
        }

        // 5. Process Details
        const detSheetName = sheetNames.find(s => s.toLowerCase().includes('detail'));
        if (detSheetName) {
            log('PROCESS', `Processing Details from sheet: ${detSheetName}`);
            const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[detSheetName]);

            rows.forEach(row => {
                // Note: Handling the typo "Deatails Code" from the user snippet, checking both just in case
                const code = row['Deatails Code'] || row['Details Code'] || row['Code'];
                const desc = row['Description'];
                const parentRaw = row['Sub Category Code'];

                if (code && desc) {
                    if (!detailsMap.has(code)) {
                        detailsMap.set(code, { description: desc, subCategoryCodes: new Set() });
                    }

                    const entry = detailsMap.get(code)!;
                    const parents = parseCodes(parentRaw);
                    parents.forEach(p => entry.subCategoryCodes.add(p));
                }
            });
            log('PROCESS', `Loaded ${detailsMap.size} unique details.`);
        } else {
            log('WARN', 'Could not find a "Details" sheet.');
        }

        // 6. Construct Final JSON
        log('BUILD', 'Constructing final JSON structure...');

        const output: TaxonomyData = {
            categories: Array.from(categoriesMap.values()),
            subCategories: Array.from(subCategoriesMap.entries()).map(([code, data]) => ({
                code,
                description: data.description,
                categoryCodes: Array.from(data.categoryCodes)
            })),
            details: Array.from(detailsMap.entries()).map(([code, data]) => ({
                code,
                description: data.description,
                subCategoryCodes: Array.from(data.subCategoryCodes)
            }))
        };

        // 7. Write to file
        log('WRITE', `Writing to ${OUTPUT_PATH}...`);
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));

        log('SUCCESS', 'Taxonomy data successfully updated!');
        log('STATS', `Final Counts -> Categories: ${output.categories.length}, SubCategories: ${output.subCategories.length}, Details: ${output.details.length}`);

    } catch (error) {
        console.error('\x1b[31m[ERROR]\x1b[0m', error);
        process.exit(1);
    }
}

main();