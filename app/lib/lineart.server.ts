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
    // Step 1: Preprocess the image
    const preprocessed = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .grayscale()
      .blur(0.5) // Slight blur to reduce noise
      .sharpen(1) // Sharpen to enhance edges
      .toBuffer();

    // Step 2: Apply Canny-like edge detection
    const edges = await sharp(preprocessed)
      .convolve({
        width: 5,
        height: 5,
        kernel: [
          -2, -1, 0, 1, 2,
          -2, -1, 0, 1, 2,
          -2, -1, 0, 1, 2,
          -2, -1, 0, 1, 2,
          -2, -1, 0, 1, 2
        ]
      })
      .convolve({
        width: 5,
        height: 5,
        kernel: [
          -2, -2, -2, -2, -2,
          -1, -1, -1, -1, -1,
          0, 0, 0, 0, 0,
          1, 1, 1, 1, 1,
          2, 2, 2, 2, 2
        ]
      })
      .normalize()
      .toBuffer();

    // Step 3: Apply threshold and clean up
    const lineArt = await sharp(edges)
      .threshold(150)
      .negate() // White lines on black background
      .png()
      .toBuffer();

    return lineArt;
  } catch (error) {
    console.error("Line art V2 conversion error:", error);
    throw new Error("Failed to convert image to line art");
  }
}
