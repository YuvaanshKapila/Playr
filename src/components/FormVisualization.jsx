import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import './FormVisualization.css'

export default function FormVisualization({ sport, skillType, corrections }) {
  const sketchRef = useRef()
  const p5Instance = useRef(null)
  const [focusAreas, setFocusAreas] = useState([])

  // Analyze corrections to determine what to highlight
  useEffect(() => {
    if (!corrections || corrections.length === 0) return

    const allText = corrections.join(' ').toLowerCase()
    const areas = []

    // Identify focus areas from feedback
    if (allText.includes('elbow') || allText.includes('arm') || allText.includes('release') || allText.includes('wrist') || allText.includes('shoulder')) {
      areas.push('arm')
    }
    if (allText.includes('knee') || allText.includes('leg') || allText.includes('stance') || allText.includes('squat') || allText.includes('bend')) {
      areas.push('legs')
    }
    if (allText.includes('foot') || allText.includes('balance') || allText.includes('plant') || allText.includes('step')) {
      areas.push('feet')
    }
    if (allText.includes('follow through') || allText.includes('extension') || allText.includes('finish')) {
      areas.push('followthrough')
    }
    if (allText.includes('posture') || allText.includes('back') || allText.includes('core') || allText.includes('straight') || allText.includes('upright')) {
      areas.push('posture')
    }
    if (allText.includes('hip') || allText.includes('rotation') || allText.includes('twist') || allText.includes('turn')) {
      areas.push('hips')
    }

    setFocusAreas(areas)
  }, [corrections])

  useEffect(() => {
    const sketch = (p) => {
      let frameCount = 0
      let showComparison = false
      let transitionProgress = 0

      p.setup = () => {
        p.createCanvas(800, 500)
        p.frameRate(30)
      }

      p.draw = () => {
        // Gradient background
        for (let i = 0; i < p.height; i++) {
          const inter = p.map(i, 0, p.height, 0, 1)
          const c = p.lerpColor(p.color(240, 248, 255), p.color(230, 240, 255), inter)
          p.stroke(c)
          p.line(0, i, p.width, i)
        }

        frameCount++

        // Draw side-by-side comparison
        const leftX = p.width / 4
        const rightX = (p.width / 4) * 3
        const baseY = 420

        // Labels
        p.fill(220, 38, 38)
        p.noStroke()
        p.textSize(18)
        p.textAlign(p.CENTER)
        p.textStyle(p.BOLD)
        p.text('❌ Common Mistakes', leftX, 30)

        p.fill(34, 197, 94)
        p.text('✓ Correct Form', rightX, 30)

        // Instructions
        p.textSize(14)
        p.fill(100)
        p.textStyle(p.NORMAL)
        if (focusAreas.length > 0) {
          p.text(`Focus on: ${focusAreas.join(', ').toUpperCase()}`, p.width / 2, 55)
        }

        // Draw court/field elements
        drawEnvironment(p, sport)

        // Draw both figures based on sport
        if (sport?.toLowerCase() === 'basketball') {
          drawBasketballComparison(p, frameCount, leftX, rightX, baseY, focusAreas)
        } else if (sport?.toLowerCase() === 'soccer' || sport?.toLowerCase() === 'football') {
          drawSoccerComparison(p, frameCount, leftX, rightX, baseY, focusAreas)
        } else if (sport?.toLowerCase() === 'baseball') {
          drawBaseballComparison(p, frameCount, leftX, rightX, baseY, focusAreas)
        } else {
          drawGenericComparison(p, frameCount, leftX, rightX, baseY, focusAreas)
        }

        // Draw motion trail effect
        drawMotionTrails(p, frameCount)
      }

      // Draw court/field background elements
      const drawEnvironment = (p, sport) => {
        p.push()
        p.strokeWeight(2)
        p.stroke(200, 200, 220, 100)

        if (sport?.toLowerCase() === 'basketball') {
          // Basketball hoop on right side
          p.noFill()
          p.arc(p.width * 0.75 + 120, 150, 70, 70, 0, p.PI)
          p.fill(255, 100, 50, 150)
          p.noStroke()
          p.rect(p.width * 0.75 + 85, 148, 70, 3)
        } else if (sport?.toLowerCase() === 'soccer') {
          // Soccer goal
          p.noFill()
          p.stroke(200, 200, 220, 150)
          p.rect(p.width * 0.75 + 80, 200, 100, 60)
        }

        // Ground line
        p.stroke(180, 180, 200, 100)
        p.strokeWeight(2)
        p.line(0, 430, p.width, 430)
        p.pop()
      }

      const drawMotionTrails = (p, frame) => {
        // Add subtle motion lines for effect
        const cycle = frame % 90
        if (cycle > 45) {
          p.push()
          p.stroke(100, 150, 255, 50)
          p.strokeWeight(2)
          const trailY = 200 + Math.sin(frame * 0.1) * 50
          for (let i = 0; i < 3; i++) {
            p.line(p.width * 0.75 + i * 15, trailY, p.width * 0.75 + i * 15 + 10, trailY - 5)
          }
          p.pop()
        }
      }

      // Basketball shooting comparison
      const drawBasketballComparison = (p, frame, leftX, rightX, baseY, focusAreas) => {
        const cycle = frame % 90
        const progress = cycle / 90

        // INCORRECT FORM (Left)
        p.push()
        const wrongArmAngle = p.map(progress, 0, 1, 20, 100) // Poor angle
        const wrongKnee = 0 // No knee bend
        const wrongElbow = 60 // Elbow out

        drawDetailedFigure(p, leftX, baseY, {
          armAngle: wrongArmAngle,
          kneeAngle: wrongKnee,
          elbowOut: wrongElbow,
          focusAreas,
          isCorrect: false,
          armRaised: progress > 0.3,
          followThrough: progress > 0.7 ? 20 : 0
        })

        // Ball with incorrect arc
        if (progress > 0.7) {
          const ballY = baseY - 150 - (progress - 0.7) * 200
          const ballX = leftX + 30 + (progress - 0.7) * 80
          p.fill(255, 140, 0, 200)
          p.noStroke()
          p.circle(ballX, ballY, 28)

          // X mark showing it will miss
          if (progress > 0.85) {
            p.stroke(255, 0, 0)
            p.strokeWeight(3)
            p.line(ballX - 8, ballY - 8, ballX + 8, ballY + 8)
            p.line(ballX + 8, ballY - 8, ballX - 8, ballY + 8)
          }
        }
        p.pop()

        // CORRECT FORM (Right)
        p.push()
        const correctArmAngle = p.map(progress, 0, 1, -30, 160) // Proper arc
        const correctKnee = progress < 0.5 ? p.map(progress, 0, 0.5, 0, 35) : p.map(progress, 0.5, 1, 35, 10)
        const correctElbow = 0 // Elbow in

        drawDetailedFigure(p, rightX, baseY, {
          armAngle: correctArmAngle,
          kneeAngle: correctKnee,
          elbowOut: correctElbow,
          focusAreas,
          isCorrect: true,
          armRaised: progress > 0.3,
          followThrough: progress > 0.7 ? 50 : 0
        })

        // Ball with correct arc
        if (progress > 0.7) {
          const ballY = baseY - 180 - (progress - 0.7) * 250
          const ballX = rightX + 20 + (progress - 0.7) * 100
          p.fill(255, 140, 0, 200)
          p.noStroke()
          p.circle(ballX, ballY, 28)

          // Check mark showing good shot
          if (progress > 0.85) {
            p.stroke(34, 197, 94)
            p.strokeWeight(3)
            p.noFill()
            p.arc(ballX, ballY, 20, 20, 0, p.PI * 1.5)
          }

          // Motion blur effect
          p.fill(255, 140, 0, 50)
          p.circle(ballX - 5, ballY + 5, 24)
        }
        p.pop()

        // Add angle indicators
        if (focusAreas.includes('arm')) {
          // Show angle arc for correct form
          p.push()
          p.stroke(34, 197, 94)
          p.strokeWeight(2)
          p.noFill()
          p.arc(rightX, baseY - 140, 60, 60, p.radians(-90), p.radians(correctArmAngle - 90))
          p.fill(34, 197, 94)
          p.textSize(12)
          p.text('90°', rightX + 35, baseY - 130)
          p.pop()
        }
      }

      // Soccer kick comparison
      const drawSoccerComparison = (p, frame, leftX, rightX, baseY, focusAreas) => {
        const cycle = frame % 90
        const progress = cycle / 90

        // INCORRECT (Left) - weak kick
        const wrongLegAngle = p.map(progress, 0, 0.5, 0, 60)
        drawDetailedFigure(p, leftX, baseY, {
          legKick: progress < 0.5,
          legAngle: wrongLegAngle,
          focusAreas,
          isCorrect: false,
          hipRotation: 0
        })

        const wrongBallX = leftX + 50 + (progress > 0.5 ? (progress - 0.5) * 150 : 0)
        p.fill(255, 255, 255)
        p.stroke(0)
        p.strokeWeight(2)
        p.circle(wrongBallX, baseY - 30, 32)
        drawSoccerPattern(p, wrongBallX, baseY - 30, progress)

        // CORRECT (Right) - powerful kick
        const correctLegAngle = p.map(progress, 0, 0.5, 0, 110)
        const hipRotation = p.map(progress, 0, 0.5, 0, 25)
        drawDetailedFigure(p, rightX, baseY, {
          legKick: progress < 0.5,
          legAngle: correctLegAngle,
          focusAreas,
          isCorrect: true,
          hipRotation,
          plantFoot: true
        })

        const correctBallX = rightX + 50 + (progress > 0.5 ? (progress - 0.5) * 300 : 0)
        p.fill(255, 255, 255)
        p.stroke(0)
        p.strokeWeight(2)
        p.circle(correctBallX, baseY - 30, 32)
        drawSoccerPattern(p, correctBallX, baseY - 30, progress * 2)

        // Speed lines for power
        if (progress > 0.5) {
          p.push()
          p.stroke(100, 150, 255, 100)
          p.strokeWeight(3)
          for (let i = 0; i < 4; i++) {
            p.line(correctBallX - 20 - i * 10, baseY - 30, correctBallX - 35 - i * 10, baseY - 30)
          }
          p.pop()
        }
      }

      const drawSoccerPattern = (p, x, y, rotation) => {
        p.push()
        p.translate(x, y)
        p.rotate(rotation * p.TWO_PI)
        p.fill(0)
        p.noStroke()
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * p.TWO_PI
          p.beginShape()
          p.vertex(p.cos(angle) * 10, p.sin(angle) * 10)
          p.vertex(p.cos(angle + 0.4) * 10, p.sin(angle + 0.4) * 10)
          p.vertex(0, 0)
          p.endShape(p.CLOSE)
        }
        p.pop()
      }

      // Baseball swing comparison
      const drawBaseballComparison = (p, frame, leftX, rightX, baseY, focusAreas) => {
        const cycle = frame % 90
        const progress = cycle / 90

        // Wrong - no hip rotation
        const wrongBatAngle = p.map(progress, 0, 1, -100, 30)
        drawDetailedFigure(p, leftX, baseY, {
          swing: true,
          batAngle: wrongBatAngle,
          hipRotation: 0,
          focusAreas,
          isCorrect: false
        })

        // Correct - full hip rotation
        const correctBatAngle = p.map(progress, 0, 1, -120, 60)
        const hipRotation = p.map(progress, 0, 1, 0, 50)
        drawDetailedFigure(p, rightX, baseY, {
          swing: true,
          batAngle: correctBatAngle,
          hipRotation,
          focusAreas,
          isCorrect: true
        })

        // Draw bats
        drawBat(p, leftX + 25, baseY - 120, wrongBatAngle, false)
        drawBat(p, rightX + 25, baseY - 120, correctBatAngle, true)
      }

      const drawBat = (p, x, y, angle, isCorrect) => {
        p.push()
        p.translate(x, y)
        p.rotate(p.radians(angle))
        p.strokeWeight(10)
        p.stroke(isCorrect ? 139 : 100, 69, 19)
        p.line(0, 0, 0, -90)
        // Bat knob
        p.fill(isCorrect ? 139 : 100, 69, 19)
        p.circle(0, 5, 12)
        p.pop()
      }

      // Generic athletic movement
      const drawGenericComparison = (p, frame, leftX, rightX, baseY, focusAreas) => {
        const cycle = frame % 60
        const progress = cycle / 60

        drawDetailedFigure(p, leftX, baseY, {
          armAngle: p.sin(progress * p.TWO_PI) * 20,
          legAngle: 0,
          focusAreas,
          isCorrect: false
        })

        drawDetailedFigure(p, rightX, baseY, {
          armAngle: p.sin(progress * p.TWO_PI) * 40,
          legAngle: p.cos(progress * p.TWO_PI) * 25,
          focusAreas,
          isCorrect: true
        })
      }

      // Enhanced figure drawing with detailed anatomy
      const drawDetailedFigure = (p, x, y, options = {}) => {
        const {
          armAngle = 0,
          kneeAngle = 0,
          elbowOut = 0,
          legAngle = 0,
          legKick = false,
          hipRotation = 0,
          swing = false,
          batAngle = 0,
          focusAreas = [],
          isCorrect = true,
          armRaised = false,
          followThrough = 0,
          plantFoot = false
        } = options

        const bodyColor = isCorrect ? [80, 180, 255] : [255, 100, 100]
        const highlightColor = [255, 220, 50]
        const baseStroke = isCorrect ? 5 : 4

        // Shadow
        p.noStroke()
        p.fill(0, 0, 0, 30)
        p.ellipse(x, y + 5, 80, 15)

        // Apply hip rotation
        p.push()
        p.translate(x, y - 80)
        p.rotate(p.radians(hipRotation))
        p.translate(-x, -(y - 80))

        // Head
        const shouldHighlightHead = focusAreas.includes('head') && !isCorrect
        p.stroke(shouldHighlightHead ? highlightColor : [0])
        p.strokeWeight(shouldHighlightHead ? 6 : 3)
        p.fill(...bodyColor, 200)
        p.circle(x, y - 180, 45)

        // Eyes
        p.fill(0)
        p.noStroke()
        p.circle(x - 8, y - 185, 5)
        p.circle(x + 8, y - 185, 5)

        // Torso
        const shouldHighlightPosture = focusAreas.includes('posture') && !isCorrect
        p.stroke(shouldHighlightPosture ? highlightColor : [0])
        p.strokeWeight(shouldHighlightPosture ? 8 : baseStroke)
        p.line(x, y - 160, x, y - 80)

        // Hips indicator
        const shouldHighlightHips = focusAreas.includes('hips') && !isCorrect
        p.stroke(shouldHighlightHips ? highlightColor : bodyColor)
        p.strokeWeight(shouldHighlightHips ? 8 : 6)
        p.line(x - 20, y - 80, x + 20, y - 80)

        p.pop()

        // Arms
        const shouldHighlightArm = (focusAreas.includes('arm') || focusAreas.includes('followthrough')) && !isCorrect
        const armStroke = shouldHighlightArm ? 8 : baseStroke
        const armColor = shouldHighlightArm ? highlightColor : bodyColor

        const leftArmAngle = armAngle + elbowOut
        const rightArmAngle = armRaised ? -150 + followThrough : (armAngle - elbowOut)

        // Left arm
        p.push()
        p.translate(x, y - 140)
        p.rotate(p.radians(leftArmAngle))
        p.stroke(armColor)
        p.strokeWeight(armStroke)
        p.line(0, 0, -55, 0)
        // Elbow
        p.fill(...bodyColor, 200)
        p.circle(-55, 0, 15)
        // Forearm
        p.rotate(p.radians(-30))
        p.line(-55, 0, -100, 0)
        // Hand
        p.circle(-100, 0, 12)
        p.pop()

        // Right arm
        p.push()
        p.translate(x, y - 140)
        p.rotate(p.radians(rightArmAngle))
        p.stroke(armColor)
        p.strokeWeight(armStroke)
        p.line(0, 0, 55, 0)
        p.fill(...bodyColor, 200)
        p.circle(55, 0, 15)
        p.rotate(p.radians(30 + followThrough / 2))
        p.line(55, 0, 100, 0)
        p.circle(100, 0, 12)
        p.pop()

        // Legs
        const shouldHighlightLegs = focusAreas.includes('legs') && !isCorrect
        const legStroke = shouldHighlightLegs ? 8 : baseStroke
        const legColor = shouldHighlightLegs ? highlightColor : bodyColor

        const leftLegAngle = legKick ? -legAngle : 0
        const rightLegAngle = legKick ? legAngle : kneeAngle

        // Left leg (plant foot)
        p.push()
        p.translate(x, y - 80)
        p.rotate(p.radians(leftLegAngle))
        p.stroke(legColor)
        p.strokeWeight(legStroke)
        p.line(0, 0, -25, 85)
        p.pop()

        // Right leg
        p.push()
        p.translate(x, y - 80)
        p.rotate(p.radians(rightLegAngle))
        p.stroke(legColor)
        p.strokeWeight(legStroke)
        p.line(0, 0, 25, 85)
        p.pop()

        // Feet
        const shouldHighlightFeet = focusAreas.includes('feet') && !isCorrect
        p.fill(shouldHighlightFeet ? highlightColor : bodyColor)
        p.stroke(shouldHighlightFeet ? highlightColor : [0])
        p.strokeWeight(shouldHighlightFeet ? 5 : 3)

        // Plant foot emphasis
        if (plantFoot && isCorrect) {
          p.fill(34, 197, 94)
          p.stroke(34, 197, 94)
        }
        p.ellipse(x - 25, y, 20, 10)

        p.fill(shouldHighlightFeet ? highlightColor : bodyColor)
        p.stroke(shouldHighlightFeet ? highlightColor : [0])
        p.ellipse(x + 25, y, 20, 10)
      }
    }

    // Initialize p5
    if (sketchRef.current && !p5Instance.current) {
      p5Instance.current = new p5(sketch, sketchRef.current)
    }

    // Cleanup
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
        p5Instance.current = null
      }
    }
  }, [sport, skillType, corrections, focusAreas])

  return (
    <div className="form-visualization">
      <div ref={sketchRef} className="p5-canvas"></div>

      {corrections && corrections.length > 0 && (
        <div className="corrections-detail">
          <h4>Key Improvements Needed:</h4>
          <ul>
            {corrections.map((correction, idx) => (
              <li key={idx}>
                <span className="correction-bullet">→</span>
                {correction}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
