import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker source to use the local copy in public folder
// This avoids CORS issues and CDN dependencies
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

/**
 * Converts the first page of a PDF file to a base64 image string.
 * @param file The PDF file object.
 * @returns A promise that resolves to the base64 string (data:image/png;base64,...).
 */
export async function convertPdfPageToImage(file: File): Promise<string> {
    try {
        console.log("Starting PDF conversion for:", file.name, "Size:", file.size, "bytes");

        const arrayBuffer = await file.arrayBuffer();
        console.log("PDF loaded into memory, parsing...");

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log("PDF parsed successfully, pages:", pdf.numPages);

        // Get the first page
        const page = await pdf.getPage(1);
        console.log("First page loaded");

        // Set scale for quality (2.0 is usually good for OCR/AI)
        const viewport = page.getViewport({ scale: 2.0 });
        console.log("Viewport created:", viewport.width, "x", viewport.height);

        // Create a canvas to render the page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Could not create canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render
        console.log("Rendering PDF page to canvas...");
        await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
        }).promise;

        console.log("PDF rendered successfully, converting to image...");

        // Convert to base64
        const dataUrl = canvas.toDataURL('image/png');
        console.log("PDF converted to image successfully");

        return dataUrl;
    } catch (error) {
        console.error("PDF conversion failed:", error);
        throw error;
    }
}
