<template>
  <div ref="containerRef" class="fixed inset-0 w-full h-full overflow-hidden -z-10">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
    <div class="absolute top-4 left-4 text-white/80 bg-black/50 p-3 rounded-lg backdrop-blur-sm">
      <p class="text-xs mb-1">Interactive Black Hole Simulation</p>
      <p class="text-xs opacity-70">Move mouse to orbit camera</p>
    </div>
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
let mouse = { x: 0, y: 0 }
let composer: any

const init = (): (() => void) => {
  if (!canvasRef.value || !containerRef.value) return () => {}

  // Scene setup with fog for depth
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000000, 0.02)
  
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 2, 8)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: false,
    antialias: true,
    powerPreference: "high-performance"
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Create event horizon (perfectly black sphere)
  const eventHorizonGeometry = new THREE.SphereGeometry(0.5, 64, 64)
  const eventHorizonMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide // Only visible from inside
  })
  const eventHorizon = new THREE.Mesh(eventHorizonGeometry, eventHorizonMaterial)
  scene.add(eventHorizon)

  // Create photon sphere (gravitational lensing effect)
  const photonSphereGeometry = new THREE.SphereGeometry(0.75, 64, 64)
  const photonSphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.8,
    side: THREE.BackSide
  })
  const photonSphere = new THREE.Mesh(photonSphereGeometry, photonSphereMaterial)
  scene.add(photonSphere)

  // Create accretion disk with custom shader for realistic colors
  const diskInnerRadius = 1.0
  const diskOuterRadius = 6.0
  const diskSegments = 256
  const diskRings = 128

  // Custom geometry for accretion disk
  const diskGeometry = new THREE.RingGeometry(
    diskInnerRadius,
    diskOuterRadius,
    diskSegments,
    diskRings
  )

  // Shader material for accretion disk with Doppler shift
  const diskMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      innerRadius: { value: diskInnerRadius },
      outerRadius: { value: diskOuterRadius }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float innerRadius;
      uniform float outerRadius;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        float radius = length(vPosition.xy);
        float normalizedRadius = (radius - innerRadius) / (outerRadius - innerRadius);
        
        // Temperature gradient (hotter near center)
        float temperature = 1.0 - normalizedRadius;
        
        // Doppler shift based on rotation direction and viewing angle
        float angle = atan(vPosition.y, vPosition.x);
        float dopplerShift = sin(angle - time * 2.0) * 0.3;
        
        // Color based on temperature and Doppler shift
        vec3 color;
        float shift = temperature + dopplerShift;
        
        if (shift > 0.8) {
          // Blueshifted (approaching) - blue/white
          color = mix(vec3(0.5, 0.7, 1.0), vec3(1.0, 1.0, 1.0), (shift - 0.8) * 5.0);
        } else if (shift > 0.5) {
          // White/yellow (neutral)
          color = mix(vec3(1.0, 0.9, 0.6), vec3(0.5, 0.7, 1.0), (shift - 0.5) * 3.33);
        } else if (shift > 0.2) {
          // Yellow/orange
          color = mix(vec3(1.0, 0.4, 0.1), vec3(1.0, 0.9, 0.6), (shift - 0.2) * 3.33);
        } else {
          // Redshifted (receding) - red/dark
          color = mix(vec3(0.3, 0.0, 0.0), vec3(1.0, 0.4, 0.1), shift * 5.0);
        }
        
        // Add spiral structure
        float spiral = sin(angle * 3.0 - radius * 2.0 + time) * 0.1;
        float brightness = temperature * temperature * (0.8 + spiral);
        
        // Fade at edges
        brightness *= 1.0 - smoothstep(0.8, 1.0, normalizedRadius);
        brightness *= smoothstep(0.0, 0.05, normalizedRadius);
        
        gl_FragColor = vec4(color * brightness, brightness * 0.9);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  })

  const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial)
  accretionDisk.rotation.x = -Math.PI / 2.2 // Slight tilt for better view
  scene.add(accretionDisk)

  // Create vertical accretion disk (edge-on view for 3D effect)
  const verticalDisk = new THREE.Mesh(diskGeometry, diskMaterial.clone())
  verticalDisk.rotation.x = -Math.PI / 8
  verticalDisk.rotation.z = Math.PI / 2
  scene.add(verticalDisk)

  // Create relativistic jets (blue particles shooting from poles)
  const jetParticleCount = 500
  const jetGeometry = new THREE.BufferGeometry()
  const jetPositions = new Float32Array(jetParticleCount * 3)
  const jetVelocities = new Float32Array(jetParticleCount * 3)
  const jetColors = new Float32Array(jetParticleCount * 3)
  const jetSizes = new Float32Array(jetParticleCount)
  
  for (let i = 0; i < jetParticleCount; i++) {
    // Initialize at poles
    const isTopJet = i < jetParticleCount / 2
    jetPositions[i * 3] = (Math.random() - 0.5) * 0.2
    jetPositions[i * 3 + 1] = isTopJet ? 0.5 : -0.5
    jetPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.2
    
    // Set velocities (shooting outward from poles)
    jetVelocities[i * 3] = (Math.random() - 0.5) * 0.01
    jetVelocities[i * 3 + 1] = isTopJet ? 0.1 + Math.random() * 0.05 : -0.1 - Math.random() * 0.05
    jetVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    
    // Blueshifted colors (high energy)
    jetColors[i * 3] = 0.3 + Math.random() * 0.2
    jetColors[i * 3 + 1] = 0.6 + Math.random() * 0.2
    jetColors[i * 3 + 2] = 0.9 + Math.random() * 0.1
    
    jetSizes[i] = 0.5 + Math.random() * 1.5
  }
  
  jetGeometry.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3))
  jetGeometry.setAttribute('color', new THREE.BufferAttribute(jetColors, 3))
  jetGeometry.setAttribute('size', new THREE.BufferAttribute(jetSizes, 1))
  
  const jetMaterial = new THREE.PointsMaterial({
    size: 0.05,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const jets = new THREE.Points(jetGeometry, jetMaterial)
  scene.add(jets)

  // Create matter particles orbiting (with proper Doppler shift)
  const orbitParticleCount = 3000
  const orbitGeometry = new THREE.BufferGeometry()
  const orbitPositions = new Float32Array(orbitParticleCount * 3)
  const orbitVelocities = new Float32Array(orbitParticleCount * 3)
  const orbitColors = new Float32Array(orbitParticleCount * 3)
  const orbitSizes = new Float32Array(orbitParticleCount)
  const orbitRadii = new Float32Array(orbitParticleCount)
  const orbitAngles = new Float32Array(orbitParticleCount)
  
  for (let i = 0; i < orbitParticleCount; i++) {
    // Random orbital radius
    const radius = 1.5 + Math.random() * 6
    const angle = Math.random() * Math.PI * 2
    const height = (Math.random() - 0.5) * 0.5 * Math.exp(-radius / 3)
    
    orbitRadii[i] = radius
    orbitAngles[i] = angle
    
    orbitPositions[i * 3] = radius * Math.cos(angle)
    orbitPositions[i * 3 + 1] = height
    orbitPositions[i * 3 + 2] = radius * Math.sin(angle)
    
    // Orbital velocity (Kepler's third law - closer = faster)
    const orbitalSpeed = 1.0 / Math.sqrt(radius)
    orbitVelocities[i * 3] = -Math.sin(angle) * orbitalSpeed
    orbitVelocities[i * 3 + 1] = 0
    orbitVelocities[i * 3 + 2] = Math.cos(angle) * orbitalSpeed
    
    // Initial colors will be updated based on Doppler shift
    orbitColors[i * 3] = 1.0
    orbitColors[i * 3 + 1] = 1.0
    orbitColors[i * 3 + 2] = 1.0
    
    orbitSizes[i] = 0.3 + Math.random() * 0.7
  }
  
  orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3))
  orbitGeometry.setAttribute('color', new THREE.BufferAttribute(orbitColors, 3))
  orbitGeometry.setAttribute('size', new THREE.BufferAttribute(orbitSizes, 1))
  
  const orbitMaterial = new THREE.PointsMaterial({
    size: 0.03,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const orbitParticles = new THREE.Points(orbitGeometry, orbitMaterial)
  scene.add(orbitParticles)

  // Add background stars
  const starsGeometry = new THREE.BufferGeometry()
  const starsCount = 5000
  const starsPositions = new Float32Array(starsCount * 3)
  const starsSizes = new Float32Array(starsCount)
  
  for (let i = 0; i < starsCount; i++) {
    const radius = 20 + Math.random() * 80
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    starsPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    starsPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    starsPositions[i * 3 + 2] = radius * Math.cos(phi)
    
    starsSizes[i] = 0.1 + Math.random() * 0.3
  }
  
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3))
  starsGeometry.setAttribute('size', new THREE.BufferAttribute(starsSizes, 1))
  
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  })
  
  const stars = new THREE.Points(starsGeometry, starsMaterial)
  scene.add(stars)

  // Add subtle ambient light
  const ambientLight = new THREE.AmbientLight(0x0a0a0a)
  scene.add(ambientLight)

  // Mouse movement
  const handleMouseMove = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  window.addEventListener('mousemove', handleMouseMove)

  // Animation loop
  const clock = new THREE.Clock()
  
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = clock.getDelta()

    // Update shader uniforms
    if (diskMaterial.uniforms) {
      diskMaterial.uniforms.time.value = elapsedTime * 0.5
    }
    if (verticalDisk.material && (verticalDisk.material as any).uniforms) {
      (verticalDisk.material as any).uniforms.time.value = elapsedTime * 0.5
    }

    // Rotate accretion disk slowly
    accretionDisk.rotation.z = elapsedTime * 0.05
    verticalDisk.rotation.y = elapsedTime * 0.05

    // Update jet particles
    const jetPos = jetGeometry.attributes.position.array as Float32Array
    const jetVel = jetVelocities
    
    for (let i = 0; i < jetParticleCount; i++) {
      // Update position
      jetPos[i * 3] += jetVel[i * 3]
      jetPos[i * 3 + 1] += jetVel[i * 3 + 1]
      jetPos[i * 3 + 2] += jetVel[i * 3 + 2]
      
      // Reset particles that go too far
      const dist = Math.abs(jetPos[i * 3 + 1])
      if (dist > 10) {
        const isTopJet = jetVel[i * 3 + 1] > 0
        jetPos[i * 3] = (Math.random() - 0.5) * 0.2
        jetPos[i * 3 + 1] = isTopJet ? 0.5 : -0.5
        jetPos[i * 3 + 2] = (Math.random() - 0.5) * 0.2
      }
      
      // Add slight spiral
      const angle = elapsedTime * 2 + i * 0.1
      jetPos[i * 3] += Math.cos(angle) * 0.001
      jetPos[i * 3 + 2] += Math.sin(angle) * 0.001
    }
    jetGeometry.attributes.position.needsUpdate = true

    // Update orbiting particles with Doppler shift
    const orbitPos = orbitGeometry.attributes.position.array as Float32Array
    const orbitCol = orbitGeometry.attributes.color.array as Float32Array
    
    for (let i = 0; i < orbitParticleCount; i++) {
      // Update orbital angle
      const radius = orbitRadii[i]
      const orbitalSpeed = 0.5 / Math.sqrt(radius)
      orbitAngles[i] += orbitalSpeed * deltaTime
      
      // Update position
      const angle = orbitAngles[i]
      const height = orbitPos[i * 3 + 1]
      
      orbitPos[i * 3] = radius * Math.cos(angle)
      orbitPos[i * 3 + 2] = radius * Math.sin(angle)
      
      // Calculate Doppler shift based on motion relative to camera
      const toCameraX = camera.position.x - orbitPos[i * 3]
      const toCameraZ = camera.position.z - orbitPos[i * 3 + 2]
      const velocityX = -Math.sin(angle) * orbitalSpeed
      const velocityZ = Math.cos(angle) * orbitalSpeed
      
      // Dot product for radial velocity (positive = approaching = blueshift)
      const radialVelocity = (velocityX * toCameraX + velocityZ * toCameraZ) / 
                           Math.sqrt(toCameraX * toCameraX + toCameraZ * toCameraZ)
      
      // Apply Doppler shift to color
      const dopplerFactor = radialVelocity * 5.0
      
      if (dopplerFactor > 0) {
        // Blueshifted (approaching)
        orbitCol[i * 3] = 0.3 + dopplerFactor * 0.2
        orbitCol[i * 3 + 1] = 0.5 + dopplerFactor * 0.3
        orbitCol[i * 3 + 2] = 0.9 + dopplerFactor * 0.1
      } else {
        // Redshifted (receding)
        orbitCol[i * 3] = 0.9 - dopplerFactor * 0.3
        orbitCol[i * 3 + 1] = 0.4 - dopplerFactor * 0.2
        orbitCol[i * 3 + 2] = 0.2 - dopplerFactor * 0.1
      }
      
      // Add gravitational redshift (stronger near black hole)
      const gravitationalRedshift = 1.0 / radius
      orbitCol[i * 3] += gravitationalRedshift * 0.2
      orbitCol[i * 3 + 1] -= gravitationalRedshift * 0.1
      orbitCol[i * 3 + 2] -= gravitationalRedshift * 0.15
      
      // Clamp colors
      orbitCol[i * 3] = Math.min(1, Math.max(0, orbitCol[i * 3]))
      orbitCol[i * 3 + 1] = Math.min(1, Math.max(0, orbitCol[i * 3 + 1]))
      orbitCol[i * 3 + 2] = Math.min(1, Math.max(0, orbitCol[i * 3 + 2]))
      
      // Particles slowly spiral inward
      if (radius > 1.2) {
        orbitRadii[i] -= 0.0001
      } else {
        // Reset particle far away
        orbitRadii[i] = 5 + Math.random() * 3
        orbitAngles[i] = Math.random() * Math.PI * 2
      }
    }
    orbitGeometry.attributes.position.needsUpdate = true
    orbitGeometry.attributes.color.needsUpdate = true

    // Camera orbit based on mouse
    const cameraRadius = 10
    const cameraAngle = elapsedTime * 0.1 + mouse.x * Math.PI
    const cameraHeight = 3 + mouse.y * 3
    
    camera.position.x = Math.sin(cameraAngle) * cameraRadius
    camera.position.y = cameraHeight
    camera.position.z = Math.cos(cameraAngle) * cameraRadius
    camera.lookAt(0, 0, 0)

    // Rotate stars slowly for parallax effect
    stars.rotation.y = elapsedTime * 0.01

    renderer.render(scene, camera)
  }

  animate()

  // Handle resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('mousemove', handleMouseMove)
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
}
</style>