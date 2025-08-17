import { getOpenAI } from "./openai.server";

// Replicate API for specialized line art models
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export async function generateLineArtWithReplicate(imageBuffer: Buffer): Promise<Buffer> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }

  try {
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Try multiple line art models
    const models = [
      {
        name: "line-art-detection",
        version: "c4c54e3c8c97ef50f2d2c41748f53c67f261a63c6ffa2d197d3c4b4b8c0c0c0c",
        input: {
          image: dataUrl,
          model: "lineart_realistic"
        }
      },
      {
        name: "line-art-anime",
        version: "c4c54e3c8c97ef50f2d2c41748f53c67f261a63c6ffa2d197d3c4b4b8c0c0c0c",
        input: {
          image: dataUrl,
          model: "lineart_anime"
        }
      }
    ];

    // Try each model until one works
    for (const model of models) {
      try {
        console.log(`Trying Replicate model: ${model.name}`);
        
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version: model.version,
            input: model.input
          })
        });

        if (!response.ok) {
          console.log(`Model ${model.name} failed:`, response.status);
          continue;
        }

        const prediction = await response.json();
        
        // Poll for completion
        const result = await pollPrediction(prediction.id);
        if (result) {
          // Download the result image
          const imageResponse = await fetch(result);
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          return imageBuffer;
        }
      } catch (error) {
        console.log(`Model ${model.name} error:`, error);
        continue;
      }
    }

    throw new Error("All Replicate models failed");
  } catch (error) {
    console.error("Replicate API error:", error);
    throw new Error("Replicate API unavailable");
  }
}

async function pollPrediction(predictionId: string): Promise<string | null> {
  const maxAttempts = 30; // 30 seconds max
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Poll failed: ${response.status}`);
      }

      const prediction = await response.json();
      
      if (prediction.status === "succeeded") {
        return prediction.output;
      } else if (prediction.status === "failed") {
        throw new Error("Prediction failed");
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    } catch (error) {
      console.error("Poll error:", error);
      attempts++;
    }
  }

  throw new Error("Prediction timeout");
}

// Alternative: Use a simpler line art model
export async function generateSimpleLineArt(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Use a different approach - try to find a working line art model
    const base64Image = imageBuffer.toString('base64');
    
    // Try a different Replicate model that's more reliable
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "c4c54e3c8c97ef50f2d2c41748f53c67f261a63c6ffa2d197d3c4b4b8c0c0c0c",
        input: {
          image: `data:image/jpeg;base64,${base64Image}`,
          model: "lineart_realistic"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();
    const result = await pollPrediction(prediction.id);
    
    if (result) {
      const imageResponse = await fetch(result);
      return Buffer.from(await imageResponse.arrayBuffer());
    }

    throw new Error("No result from Replicate");
  } catch (error) {
    console.error("Simple line art error:", error);
    throw error;
  }
}
