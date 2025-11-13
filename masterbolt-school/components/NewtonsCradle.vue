<template>
  <div ref="containerRef" class="w-full h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-black relative">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let balls: THREE.Mesh[] = []
let strings: THREE.Line[] = []
let ballPositions: THREE.Vector3[] = []
let ballVelocities: number[] = []
let ballDisplacements: number[] = [] // Horizontal displacement from rest position
let stringLength = 3
let gravity = 9.8
let damping = 0.998
let clicked = false
let ballCount = 7
let ballSpacing = 0.825 // 10% more apart
let ballRadius = 0.4
let startX = 0
let rodHeight = 0.3
let stringAttachmentY = 0
let collisionFlash: Map<number, number> = new Map() // Track multiple balls flashing: ballIndex -> intensity

// VIBGYOR color mapping for 7 balls (Violet, Indigo, Blue, Green, Yellow, Orange, Red)
const vibgyorColors = [
  0x8b00ff, // Violet
  0x4b0082, // Indigo
  0x0000ff, // Blue
  0x00ff00, // Green
  0xffff00, // Yellow
  0xff8800, // Orange
  0xff0000  // Red
]

// Physics constants
const restitution = 0.98 // Coefficient of restitution (slightly less than 1 for realism)
const minCollisionVelocity = 0.01 // Minimum velocity for collision detection

const init = (): (() => void) => {
  if (!canvasRef.value || !containerRef.value) return () => {}

  scene = new THREE.Scene()
  // Sunset gradient background - brighter for visibility
  scene.background = new THREE.Color(0x2d1f2d) // Brighter purple-pink sunset base
  scene.fog = new THREE.FogExp2(0x2d1f2d, 0.015) // Lighter fog for depth
  
  camera = new THREE.PerspectiveCamera(
    50,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000
  )
  // Camera at 20° above horizontal, centered on middle ball
  camera.position.set(0, 2, 12)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Sunset lighting - warm, golden hour atmosphere (brightened)
  // Warm ambient light (sunset glow) - much brighter
  const ambientLight = new THREE.AmbientLight(0xffa07a, 0.8) // Bright warm orange ambient
  scene.add(ambientLight)

  // Main sunset light (warm golden-orange, simulating setting sun) - brighter
  const sunsetLight = new THREE.DirectionalLight(0xff8c42, 2.5) // Bright orange sunset
  sunsetLight.position.set(5, 6, 8) // Positioned like setting sun
  sunsetLight.castShadow = true
  sunsetLight.shadow.mapSize.width = 2048
  sunsetLight.shadow.mapSize.height = 2048
  sunsetLight.shadow.camera.near = 0.5
  sunsetLight.shadow.camera.far = 50
  sunsetLight.shadow.camera.left = -10
  sunsetLight.shadow.camera.right = 10
  sunsetLight.shadow.camera.top = 10
  sunsetLight.shadow.camera.bottom = -10
  sunsetLight.shadow.bias = -0.0001
  scene.add(sunsetLight)

  // Warm fill light (soft pink-orange from opposite side) - brighter
  const fillLight = new THREE.DirectionalLight(0xffb88c, 1.0) // Bright light salmon
  fillLight.position.set(-5, 3, -5)
  scene.add(fillLight)

  // Sky light (warm purple-pink from above, simulating sky reflection) - brighter
  const skyLight = new THREE.DirectionalLight(0xff8fa3, 0.6) // Brighter pink sky
  skyLight.position.set(0, 10, 0)
  scene.add(skyLight)

  // Rim light (warm golden rim for chrome reflections) - brighter
  const rimLight = new THREE.DirectionalLight(0xffe135, 0.7) // Bright gold rim
  rimLight.position.set(-3, 2, -8)
  scene.add(rimLight)

  // Point light for warm accent (like a warm lamp) - brighter
  const pointLight = new THREE.PointLight(0xffa07a, 1.5, 25) // Bright warm orange point light
  pointLight.position.set(0, 3, 5)
  scene.add(pointLight)

  // Additional overhead light for general visibility
  const overheadLight = new THREE.DirectionalLight(0xffd4a3, 0.6) // Warm peach overhead
  overheadLight.position.set(0, 8, 0)
  scene.add(overheadLight)

  // Create rectangular frame structure (chrome-plated steel look)
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888, // Metallic gray
    metalness: 0.95,
    roughness: 0.1,
    envMapIntensity: 1.0
  })

  // Two vertical support rods
  rodHeight = 0.4
  const rodWidth = 0.12
  const rodDepth = 0.15
  
  // Left vertical rod
  const leftRodGeometry = new THREE.BoxGeometry(rodWidth, rodHeight, rodDepth)
  const leftRod = new THREE.Mesh(leftRodGeometry, frameMaterial)
  leftRod.position.set(-4, 4, 0)
  leftRod.castShadow = true
  leftRod.receiveShadow = true
  scene.add(leftRod)
  
  // Right vertical rod
  const rightRodGeometry = new THREE.BoxGeometry(rodWidth, rodHeight, rodDepth)
  const rightRod = new THREE.Mesh(rightRodGeometry, frameMaterial)
  rightRod.position.set(4, 4, 0)
  rightRod.castShadow = true
  rightRod.receiveShadow = true
  scene.add(rightRod)
  
  // Top crossbar connecting the two rods
  const crossbarWidth = 8.3
  const crossbarHeight = 0.15
  const crossbarDepth = 0.15
  const crossbarGeometry = new THREE.BoxGeometry(crossbarWidth, crossbarHeight, crossbarDepth)
  const crossbar = new THREE.Mesh(crossbarGeometry, frameMaterial)
  crossbar.position.set(0, 4 + rodHeight / 2, 0)
  crossbar.castShadow = true
  crossbar.receiveShadow = true
  scene.add(crossbar)

  // Base (wooden or acrylic look)
  const baseWidth = 10
  const baseDepth = 4
  const baseHeight = 0.3
  const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth)
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a, // Dark wood/acrylic
    roughness: 0.7,
    metalness: 0.1
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.set(0, -1.5, 0)
  base.receiveShadow = true
  scene.add(base)

  // Initialize ball positions
  startX = -(ballCount - 1) * ballSpacing / 2
  const restY = 4 - stringLength
  stringAttachmentY = 4 + rodHeight / 2

  // Create 7 chrome-plated steel balls with VIBGYOR colors
  for (let i = 0; i < ballCount; i++) {
    // Ball geometry - polished sphere
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32)
    
    const baseColor = vibgyorColors[i]
    const baseColorObj = new THREE.Color(baseColor)
    
    // Chrome-plated steel material with high reflectivity
    // Color stays constant, only brightness changes on impact
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: baseColor, // VIBGYOR color - never changes
      metalness: 0.98, // Very metallic
      roughness: 0.05, // Highly polished
      envMapIntensity: 1.5, // Strong reflections
      emissive: new THREE.Color(0x000000) // Start with no emissive (brightness controlled here)
    })
    
    const ball = new THREE.Mesh(ballGeometry, ballMaterial)
    ball.castShadow = true
    ball.receiveShadow = true
    
    // Position balls at rest (just touching)
    const x = startX + i * ballSpacing
    ball.position.set(x, restY, 0)
    ballPositions.push(new THREE.Vector3(x, restY, 0))
    ballDisplacements.push(0) // No initial displacement
    ballVelocities.push(0) // No initial velocity
    
    scene.add(ball)
    balls.push(ball)

    // Create two parallel strings/wires for each ball (steel wire look)
    const stringMaterial = new THREE.LineBasicMaterial({
      color: 0xaaaaaa, // Steel wire color
      linewidth: 1
    })
    
    // Left string
    const leftStringGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x - 0.15, stringAttachmentY, 0),
      new THREE.Vector3(x - 0.15, restY, 0)
    ])
    const leftString = new THREE.Line(leftStringGeometry, stringMaterial)
    scene.add(leftString)
    strings.push(leftString)
    
    // Right string
    const rightStringGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x + 0.15, stringAttachmentY, 0),
      new THREE.Vector3(x + 0.15, restY, 0)
    ])
    const rightString = new THREE.Line(rightStringGeometry, stringMaterial)
    scene.add(rightString)
    strings.push(rightString)
  }

  // Ground plane for shadows (warm surface with sunset glow) - brighter
  const groundGeometry = new THREE.PlaneGeometry(20, 20)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3a2a, // Brighter warm brown surface
    roughness: 0.8,
    metalness: 0.1,
    emissive: 0x1a0f0a, // Subtle warm glow
    emissiveIntensity: 0.2
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -2
  ground.receiveShadow = true
  scene.add(ground)

  // Click handler to start animation
  const handleClick = (event: MouseEvent) => {
    if (clicked) return
    clicked = true
    
    // Pull the first ball to the right (horizontal displacement)
    // Amplitude: ~30° from vertical = ~1.5 units displacement
    ballDisplacements[0] = -1.5
    ballVelocities[0] = 0 // Start from rest
  }

  canvasRef.value.addEventListener('click', handleClick)

  // Animation loop
  const clock = new THREE.Clock()
  
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    const deltaTime = Math.min(clock.getDelta(), 0.1) // Cap deltaTime for stability
    const time = clock.getElapsedTime()

    // Update physics for each ball - pure 1D horizontal movement
    for (let i = 0; i < ballCount; i++) {
      const displacement = ballDisplacements[i]
      const velocity = ballVelocities[i]
      
      // Simple harmonic motion for pendulum: a = -(g/L) * x
      const omega = Math.sqrt(gravity / stringLength) // Angular frequency
      const acceleration = -omega * omega * displacement
      
      // Update velocity and displacement
      ballVelocities[i] += acceleration * deltaTime
      ballVelocities[i] *= damping // Apply damping (energy loss)
      ballDisplacements[i] += ballVelocities[i] * deltaTime

      // Update ball position - pure horizontal movement (1D)
      const restX = startX + i * ballSpacing
      const x = restX + ballDisplacements[i]
      const y = 4 - stringLength // Keep Y constant (no vertical movement)
      ballPositions[i].set(x, y, 0)
      balls[i].position.copy(ballPositions[i])

      // Update strings - two parallel strings per ball
      const stringIndex = i * 2
      // Left string
      const leftStringPoints = [
        new THREE.Vector3(restX - 0.15, stringAttachmentY, 0),
        new THREE.Vector3(x - 0.15, y, 0)
      ]
      strings[stringIndex].geometry.setFromPoints(leftStringPoints)
      
      // Right string
      const rightStringPoints = [
        new THREE.Vector3(restX + 0.15, stringAttachmentY, 0),
        new THREE.Vector3(x + 0.15, y, 0)
      ]
      strings[stringIndex + 1].geometry.setFromPoints(rightStringPoints)

      // Collision flash effect (brightness increase on impact, color stays VIBGYOR)
      const flashIntensity = collisionFlash.get(i)
      if (flashIntensity !== undefined && flashIntensity > 0.1) {
        const baseColor = vibgyorColors[i]
        // Increase brightness by making emissive match the base color with intensity
        balls[i].material.emissive = new THREE.Color(baseColor).multiplyScalar(flashIntensity)
        // Decay flash
        const newIntensity = flashIntensity * 0.9
        collisionFlash.set(i, newIntensity)
        if (newIntensity < 0.1) {
          collisionFlash.delete(i)
          balls[i].material.emissive = new THREE.Color(0x000000)
        }
      } else {
        // Ensure emissive is reset when not flashing
        if (balls[i].material.emissive.r > 0.01 || balls[i].material.emissive.g > 0.01 || balls[i].material.emissive.b > 0.01) {
          balls[i].material.emissive = new THREE.Color(0x000000)
        }
      }
    }

    // Collision detection and resolution between adjacent balls
    // Using proper elastic collision equations for 1D motion
    for (let i = 0; i < ballCount - 1; i++) {
      const ball1Pos = ballPositions[i]
      const ball2Pos = ballPositions[i + 1]
      const distance = Math.abs(ball1Pos.x - ball2Pos.x)
      const minDistance = 2 * ballRadius // Balls just touching

      // Check for collision
      if (distance < minDistance) {
        const v1 = ballVelocities[i]
        const v2 = ballVelocities[i + 1]
        const relativeVel = v1 - v2 // Velocity of ball1 relative to ball2
        
        // Only process collision if balls are approaching each other
        if (relativeVel > minCollisionVelocity) {
          // Elastic collision with coefficient of restitution
          const newV1 = (1 - restitution) * v1 + restitution * v2
          const newV2 = restitution * v1 + (1 - restitution) * v2
          
          ballVelocities[i] = newV1
          ballVelocities[i + 1] = newV2
          
          // Visual collision flash (metallic click effect) - flash both colliding balls simultaneously
          collisionFlash.set(i, 0.8)
          collisionFlash.set(i + 1, 0.8)
          
          // Separate balls to prevent overlap (position correction)
          const overlap = minDistance - distance
          const correction = overlap / 2
          if (ball1Pos.x < ball2Pos.x) {
            ballDisplacements[i] -= correction
            ballDisplacements[i + 1] += correction
          } else {
            ballDisplacements[i] += correction
            ballDisplacements[i + 1] -= correction
          }
          
          // Update positions immediately
          const restX1 = startX + i * ballSpacing
          const restX2 = startX + (i + 1) * ballSpacing
          ballPositions[i].set(restX1 + ballDisplacements[i], 4 - stringLength, 0)
          ballPositions[i + 1].set(restX2 + ballDisplacements[i + 1], 4 - stringLength, 0)
          balls[i].position.copy(ballPositions[i])
          balls[i + 1].position.copy(ballPositions[i + 1])
        }
      }
    }

    // Auto-restart after a delay if all balls are still
    let allStill = true
    for (let i = 0; i < ballCount; i++) {
      if (Math.abs(ballVelocities[i]) > 0.01 || Math.abs(ballDisplacements[i]) > 0.01) {
        allStill = false
        break
      }
    }

    if (allStill && clicked && time > 3) {
      // Reset after 3 seconds of stillness
      clicked = false
      for (let i = 0; i < ballCount; i++) {
        ballDisplacements[i] = 0
        ballVelocities[i] = 0
        const x = startX + i * ballSpacing
        const y = 4 - stringLength
        ballPositions[i].set(x, y, 0)
        balls[i].position.copy(ballPositions[i])
        // Reset emissive but keep base color (VIBGYOR)
        balls[i].material.emissive = new THREE.Color(0x000000)
      }
      collisionFlash.clear()
    }

    // Keep camera fixed at 20° above horizontal, centered on middle ball
    camera.position.set(0, 2, 12)
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)
  }

  animate()

  // Handle resize
  const handleResize = () => {
    if (containerRef.value && canvasRef.value) {
      const width = containerRef.value.clientWidth
      const height = containerRef.value.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
    if (canvasRef.value) {
      canvasRef.value.removeEventListener('click', handleClick)
    }
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    renderer.dispose()
  }
}

let cleanup: (() => void) | null = null

onMounted(() => {
  cleanup = init()
})

onUnmounted(() => {
  if (cleanup) {
    cleanup()
  }
})
</script>

<style scoped>
canvas {
  display: block;
  cursor: pointer;
}
</style>
