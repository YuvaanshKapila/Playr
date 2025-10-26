import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyDMtyGWlUODWDtaL-HkSi8oXUX9mtGixZc'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(API_KEY)

// Get the model - using gemini-2.5-flash (stable version with multimodal support)
export const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.7,
  }
})

// Helper function to analyze video/skill performance
export async function analyzeSkillVideo(videoDescription, sport, skillType) {
  try {
    const prompt = `You are a ${sport} coaching AI. Analyze this skill video and provide concise feedback.

Video Description: ${videoDescription}
Skill Type: ${skillType}

IMPORTANT: Your response MUST start with "Score: X/100" where X is a number between 0-100.

Provide:
1. Score: [number]/100 - Rate the overall skill execution
2. Key Strengths: 1-2 points about what was done well
3. Areas for Improvement: 1-2 specific tips to improve
4. Recommended Drill: One specific drill to practice

Keep response under 150 words, be encouraging but honest.

Example format:
Score: 75/100

Key Strengths:
- Good ball control
- Solid footwork

Areas for Improvement:
- Work on follow-through
- Increase speed

Recommended Drill: Practice cone dribbling drills for 15 minutes daily.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('Gemini API Response:', text)

    return {
      success: true,
      analysis: text,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Gemini API Error:', error)
    return {
      success: false,
      error: error.message,
      analysis: 'Unable to analyze video at this time. Please try again later.'
    }
  }
}

// Helper to extract score from AI response (multiple patterns)
export function extractScore(analysisText) {
  if (!analysisText) return null

  // Try multiple patterns to extract score - most specific first
  const patterns = [
    /score[:\s]*(\d+)\/100/i,           // "Score: 75/100"
    /technique\s+score[:\s]*(\d+)/i,    // "Technique Score: 82"
    /(\d+)\/100/,                        // "75/100"
    /score[:\s]*(\d+)/i,                 // "Score: 75"
    /rating[:\s]*(\d+)/i,                // "Rating: 75"
    /\*\*score[:\s]*(\d+)\*\*/i,        // "**Score: 75**"
    /overall[:\s]*(\d+)/i                // "Overall: 75"
  ]

  for (const pattern of patterns) {
    const match = analysisText.match(pattern)
    if (match) {
      const score = parseInt(match[1])
      // Validate score is between 0-100
      if (score >= 0 && score <= 100) {
        console.log(`Extracted score ${score} using pattern: ${pattern}`)
        return score
      }
    }
  }

  // If no score found, log and return null
  console.warn('Could not extract score from analysis:', analysisText.substring(0, 100))
  return null
}

// Advanced video frame analysis using Gemini Vision
export async function analyzeVideoFrame(imageData, sport, skillType) {
  try {
    // Use Gemini 2.5 Flash for multimodal (text + image) analysis
    const visionModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    })

    const prompt = `You are an expert ${sport} coach analyzing an athlete's form and technique.

Analyze this video frame for ${skillType} technique.

IMPORTANT: Start your response with "Technique Score: X/100" where X is between 0-100.

Provide:
1. Technique Score: [number]/100 - Overall form and execution quality
2. Form Analysis: Body position, posture, alignment observations
3. Key Observations: 2-3 specific technical points you notice
4. Corrections: 1-2 immediate fixes to improve performance
5. Strengths: What's being done well

Be specific about body mechanics, angles, and positioning. Keep response under 200 words.

Example format:
Technique Score: 82/100

Form Analysis: Good knee bend, shoulders aligned...`

    const result = await visionModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      }
    ])

    const response = await result.response
    const text = response.text()

    return {
      success: true,
      analysis: text,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Gemini Vision API Error:', error)
    return {
      success: false,
      error: error.message,
      analysis: 'Unable to analyze video frame at this time.'
    }
  }
}

// Extract video frame as base64 image for analysis
export async function extractVideoFrame(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.preload = 'metadata'
    video.src = URL.createObjectURL(videoFile)

    video.onloadedmetadata = () => {
      // Seek to 2 seconds or middle of video
      video.currentTime = Math.min(2, video.duration / 2)
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get base64 image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      const base64Data = imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix

      URL.revokeObjectURL(video.src)
      resolve(base64Data)
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video'))
    }
  })
}
