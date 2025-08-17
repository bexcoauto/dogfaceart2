import sharp from "sharp";

export async function convertToLineArt(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Step 1: Resize and normalize the image
    const resized = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .grayscale()
      .toBuffer();

    // Step 2: Apply edge detection using multiple techniques
    const edgeDetected = await sharp(resized)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, -1, -1,
          -1,  8, -1,
          -1, -1, -1
        ]
      })
      .normalize()
      .toBuffer();

    // Step 3: Apply additional edge enhancement
    const enhanced = await sharp(edgeDetected)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          0, -1, 0,
          -1, 5, -1,
          0, -1, 0
        ]
      })
      .normalize()
      .toBuffer();

    // Step 4: Apply threshold to create clean lines
    const thresholded = await sharp(enhanced)
      .threshold(128)
      .negate() // Invert to get white lines on black background
      .toBuffer();

    // Step 5: Clean up and create final line art
    const lineArt = await sharp(thresholded)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();

    return lineArt;
  } catch (error) {
    console.error("Line art conversion error:", error);
    throw new Error("Failed to convert image to line art");
  }
}

// Alternative method using morphological operations
export async function convertToLineArtV2(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Step 1: Preprocess the image with better noise reduction
    const preprocessed = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .grayscale()
      .median(2) // Better noise reduction
      .sharpen(2, 1, 1) // Enhanced sharpening
      .toBuffer();

    // Step 2: Apply multiple edge detection techniques
    const edge1 = await sharp(preprocessed)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, -1, -1,
          -1,  8, -1,
          -1, -1, -1
        ]
      })
      .normalize()
      .toBuffer();

    const edge2 = await sharp(preprocessed)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          0, -1, 0,
          -1, 4, -1,
          0, -1, 0
        ]
      })
      .normalize()
      .toBuffer();

    // Step 3: Combine edge detections
    const combined = await sharp(edge1)
      .composite([{ input: edge2, blend: 'multiply' }])
      .normalize()
      .toBuffer();

    // Step 4: Apply adaptive threshold and clean up
    const lineArt = await sharp(combined)
      .threshold(120)
      .negate() // White lines on black background
      .png()
      .toBuffer();

    return lineArt;
  } catch (error) {
    console.error("Line art V2 conversion error:", error);
    throw new Error("Failed to convert image to line art");
  }
}
