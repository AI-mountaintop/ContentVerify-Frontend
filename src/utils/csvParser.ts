/**
 * Content File Parser Utility
 * Parses CSV and XLSX content data uploaded by content writers
 */

import * as XLSX from 'xlsx';

export interface ParsedContentData {
    meta_title: string;
    meta_description: string;
    h1: string[];
    h2: string[];
    h3: string[];
    paragraphs: string[];
}

/**
 * Parse content file (CSV or XLSX) into structured content data
 */
export async function parseContentFile(file: File): Promise<ParsedContentData> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
        const text = await readFileAsText(file);
        return parseCSVContent(text);
    } else if (extension === 'xlsx' || extension === 'xls') {
        return parseExcelContent(file);
    } else {
        throw new Error('Unsupported file format. Please use CSV or XLSX.');
    }
}

/**
 * Parse Excel file content
 */
async function parseExcelContent(file: File): Promise<ParsedContentData> {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { header: 1 });

    if (data.length < 2) {
        throw new Error('Excel file must have a header row and at least one data row');
    }

    // First row is headers
    const headers = data[0] as unknown as string[];
    const values = data[1] as unknown as string[];

    // Create header map
    const headerMap: Record<string, number> = {};
    headers.forEach((h, index) => {
        if (h) {
            headerMap[String(h).toLowerCase().trim()] = index;
        }
    });

    // Extract values
    const getValue = (key: string): string => {
        const index = headerMap[key];
        return index !== undefined ? String(values[index] || '').trim() : '';
    };

    // Parse semicolon-separated values for headings
    const parseMultiple = (value: string): string[] => {
        return value.split(';').map(s => s.trim()).filter(s => s);
    };

    // Parse paragraphs (separated by double newlines within the cell)
    const parseParagraphs = (value: string): string[] => {
        return value.split(/\n\n+/).map(s => s.trim()).filter(s => s);
    };

    return {
        meta_title: getValue('meta_title'),
        meta_description: getValue('meta_description'),
        h1: parseMultiple(getValue('h1')),
        h2: parseMultiple(getValue('h2')),
        h3: parseMultiple(getValue('h3')),
        paragraphs: parseParagraphs(getValue('paragraphs')),
    };
}

/**
 * Parse CSV content into structured content data
 */
export function parseCSVContent(csvText: string): ParsedContentData {
    const lines = csvText.split('\n');

    if (lines.length < 2) {
        throw new Error('CSV must have a header row and at least one data row');
    }

    // Parse header
    const headers = parseCSVLine(lines[0].trim());

    // Validate headers
    const headerMap: Record<string, number> = {};
    headers.forEach((h, index) => {
        headerMap[h.toLowerCase().trim()] = index;
    });

    // Parse data row (we take the first data row)
    // Join remaining lines in case paragraphs contain newlines
    const dataLines = lines.slice(1).join('\n');
    const values = parseCSVLine(dataLines);

    // Extract values
    const getValue = (key: string): string => {
        const index = headerMap[key];
        return index !== undefined ? (values[index] || '').trim() : '';
    };

    // Parse semicolon-separated values for headings
    const parseMultiple = (value: string): string[] => {
        return value.split(';').map(s => s.trim()).filter(s => s);
    };

    // Parse paragraphs (separated by double newlines within the cell)
    const parseParagraphs = (value: string): string[] => {
        return value.split(/\n\n+/).map(s => s.trim()).filter(s => s);
    };

    return {
        meta_title: getValue('meta_title'),
        meta_description: getValue('meta_description'),
        h1: parseMultiple(getValue('h1')),
        h2: parseMultiple(getValue('h2')),
        h3: parseMultiple(getValue('h3')),
        paragraphs: parseParagraphs(getValue('paragraphs')),
    };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Read file as ArrayBuffer (for Excel)
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Validate content file (CSV or XLSX)
 */
export function validateContentFile(file: File): { valid: boolean; error?: string } {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
        return { valid: false, error: 'Please upload a CSV or Excel (.xlsx) file' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { valid: false, error: 'File size must be less than 5MB' };
    }

    return { valid: true };
}

// Keep old function for backward compatibility
export const validateCSVFile = validateContentFile;
