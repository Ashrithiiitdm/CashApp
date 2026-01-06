import { GoogleGenerativeAI } from "@google/generative-ai";
import Tesseract from "tesseract.js";
import { createRequire } from "module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// ---------------- CONFIGURATION ----------------
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// ---------------- PROMPT ----------------
const SYSTEM_PROMPT = `
You are an expert menu / product list analyzer.

Extract ALL items with their categories and prices from the provided menu/document.

Guidelines:
- Identify all food/product categories
- Extract complete item names (including descriptions if present)
- Extract prices (handle various formats: $10, Rs.500, €20, ₹20, etc.)
- If price is missing, use null
- Preserve original category names
- Handle multi-page menus

Return ONLY valid JSON in this exact format:
{
  "Category Name": [
    {"item": "Item Name", "price": 10.99},
    {"item": "Another Item", "price": null}
  ],
  "Another Category": [
    {"item": "Item", "price": 5.50}
  ]
}

Do not include any markdown formatting, explanations, or additional text.
`;

// ---------------- IMAGE PROCESSING ----------------
async function processImage(fileBuffer) {
    try {
        console.log("🖼️  Processing image...");

        // Read and optimize image
        const imageBuffer = await sharp(fileBuffer)
            .resize(4096, 4096, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

        const base64Image = imageBuffer.toString("base64");

        // Use Gemini Vision API
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            SYSTEM_PROMPT,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        return parseJSON(text);
    } catch (error) {
        console.error("❌ Image processing failed:", error);
        throw error;
    }
}

// ---------------- PDF PROCESSING ----------------
async function processPDF(fileBuffer) {
    try {
        console.log("📋 Processing PDF...");

        const data = await pdf(fileBuffer);

        let text = data.text;
        console.log(`📄 Extracted ${text.length} characters from PDF`);

        // If very little text, PDF might be scanned - use OCR
        if (text.length < 100) {
            console.log("⚠️  Scanned PDF detected, using OCR...");
            text = await performOCR(fileBuffer);
        }

        // Use Gemini to analyze text
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent([
            `${SYSTEM_PROMPT}\n\nDocument Content:\n${text}`,
        ]);

        const response = await result.response;
        const responseText = response.text();

        return parseJSON(responseText);
    } catch (error) {
        console.error("❌ PDF processing failed:", error);
        throw error;
    }
}

// ---------------- OCR FALLBACK ----------------
async function performOCR(fileBuffer) {
    try {
        console.log("🔍 Performing OCR...");

        const {
            data: { text },
        } = await Tesseract.recognize(fileBuffer, "eng", {
            logger: (m) => {
                if (m.status === "recognizing text") {
                    console.log(
                        `   Progress: ${Math.round(m.progress * 100)}%`
                    );
                }
            },
        });

        console.log(`✅ OCR completed, extracted ${text.length} characters`);
        return text;
    } catch (error) {
        console.error("❌ OCR failed:", error);
        throw error;
    }
}

// ---------------- JSON PARSING ----------------
function parseJSON(text) {
    try {
        // Remove markdown code blocks if present
        let cleanText = text.trim();

        if (cleanText.startsWith("```")) {
            const parts = cleanText.split("```");
            cleanText = parts[1] || parts[0];
            if (cleanText.startsWith("json")) {
                cleanText = cleanText.substring(4);
            }
        }

        cleanText = cleanText.trim();

        // Parse JSON
        const data = JSON.parse(cleanText);

        // Validate structure
        if (typeof data !== "object" || data === null) {
            throw new Error("Response is not a valid JSON object");
        }

        // Count total items
        const totalItems = Object.values(data).reduce(
            (sum, items) => sum + (Array.isArray(items) ? items.length : 0),
            0
        );

        console.log(
            `✅ Parsed ${Object.keys(data).length} categories with ${totalItems} items`
        );

        return data;
    } catch (error) {
        console.error("❌ JSON parsing failed:", error);
        console.error("Raw response:", text.substring(0, 500));
        throw new Error("Failed to parse response as valid JSON");
    }
}

// ---------------- TRANSFORM TO FRONTEND FORMAT ----------------
function transformToItems(extractedData) {
    const items = [];
    let idCounter = 1;

    for (const [category, categoryItems] of Object.entries(extractedData)) {
        if (Array.isArray(categoryItems)) {
            for (const item of categoryItems) {
                items.push({
                    id: idCounter++,
                    name: item.item || "",
                    price: item.price || 0,
                    category: category,
                    quantity: 1,
                });
            }
        }
    }

    return items;
}

// ---------------- MAIN EXTRACTION FUNCTION ----------------
export async function extractItemsFromFile(
    fileBuffer,
    mimeType,
    filename = "uploaded-file"
) {
    try {
        console.log(`\n📂 Starting extraction for: ${filename}`);
        console.log(`   MIME Type: ${mimeType}`);

        let extractedData;

        // Determine file type and process accordingly
        if (mimeType.startsWith("image/")) {
            extractedData = await processImage(fileBuffer);
        } else if (mimeType === "application/pdf") {
            extractedData = await processPDF(fileBuffer);
        } else {
            throw new Error(`Unsupported file type: ${mimeType}`);
        }

        // Transform to frontend format
        const items = transformToItems(extractedData);

        console.log(`✅ Extraction complete: ${items.length} items found\n`);

        return {
            success: true,
            items: items,
            rawData: extractedData,
        };
    } catch (error) {
        console.error("❌ Extraction failed:", error);
        return {
            success: false,
            error: error.message,
            items: [],
        };
    }
}
