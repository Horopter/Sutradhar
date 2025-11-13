<template>
  <div ref="containerRef" class="w-full h-96 bg-black relative overflow-hidden rounded-xl">
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
let animationId: number | null = null
let animationTime = 0
let waveMesh: THREE.Mesh | null = null

// Wave parameters
const wave1Source = new THREE.Vector2(-3, 0)
const wave2Source = new THREE.Vector2(3, 0)
const wavelength = 2.0
const frequency = 1.0
const amplitude = 0.5

// Calculate wave height at a point (superposition of two waves)
const calculateWaveHeight = (x: number, y: number, time: number): number => {
  // Distance from wave sources
  const dist1 = Math.sqrt((x - wave1Source.x) ** 2 + (y - wave1Source.y) ** 2)
  const dist2 = Math.sqrt((x - wave2Source.x) ** 2 + (y - wave2Source.y) ** 2)
  
  // Wave equations: A * sin(2π * (distance / wavelength - frequency * time))
  const wave1 = amplitude * Math.sin(2 * Math.PI * (dist1 / wavelength - frequency * time))
  const wave2 = amplitude * Math.sin(2 * Math.PI * (dist2 / wavelength - frequency * time))
  
  // Superposition (interference)
  return wave1 + wave2
}

const init = (): (() => void) => {
  if (!canvasRef.value || !containerRef.value) return () => {}

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0a)

  camera = new THREE.PerspectiveCamera(
    50,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 8, 12)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight1 = new THREE.DirectionalLight(0x00d4ff, 1.0)
  directionalLight1.position.set(5, 10, 5)
  scene.add(directionalLight1)

  const directionalLight2 = new THREE.DirectionalLight(0xff4444, 0.6)
  directionalLight2.position.set(-5, 5, -5)
  scene.add(directionalLight2)

  // Create wave surface using plane geometry
  const planeSize = 20
  const segments = 100
  const geometry = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments)
  
  // Create shader material for wave visualization
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      wave1Source: { value: new THREE.Vector2(wave1Source.x, wave1Source.y) },
      wave2Source: { value: new THREE.Vector2(wave2Source.x, wave2Source.y) },
      wavelength: { value: wavelength },
      frequency: { value: frequency },
      amplitude: { value: amplitude }
    },
    vertexShader: `
      uniform float time;
      uniform vec2 wave1Source;
      uniform vec2 wave2Source;
      uniform float wavelength;
      uniform float frequency;
      uniform float amplitude;
      
      varying vec3 vPosition;
      varying float vHeight;
      
      void main() {
        vec3 pos = position;
        
        // Calculate distances from wave sources
        float dist1 = distance(pos.xy, wave1Source);
        float dist2 = distance(pos.xy, wave2Source);
        
        // Wave equations
        float wave1 = amplitude * sin(2.0 * 3.14159 * (dist1 / wavelength - frequency * time));
        float wave2 = amplitude * sin(2.0 * 3.14159 * (dist2 / wavelength - frequency * time));
        
        // Superposition
        float height = wave1 + wave2;
        
        pos.z = height;
        
        vPosition = pos;
        vHeight = height;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;
      varying float vHeight;
      
      void main() {
        // Color based on wave height (constructive = bright, destructive = dark)
        float normalizedHeight = (vHeight + 1.0) / 2.0; // Normalize from -1 to 1 -> 0 to 1
        
        // Create interference pattern colors
        vec3 color1 = vec3(0.0, 0.83, 1.0); // Cyan
        vec3 color2 = vec3(1.0, 0.27, 0.27); // Red
        
        // Mix colors based on height
        vec3 color = mix(color2, color1, normalizedHeight);
        
        // Add brightness based on interference
        float brightness = abs(vHeight) * 0.5 + 0.5;
        color *= brightness;
        
        // Add glow for constructive interference
        if (normalizedHeight > 0.6) {
          color += vec3(0.3, 0.3, 0.5) * (normalizedHeight - 0.6) * 2.5;
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
    wireframe: false
  })

  waveMesh = new THREE.Mesh(geometry, material)
  waveMesh.rotation.x = -Math.PI / 2
  scene.add(waveMesh)

  // Add wave source indicators
  const sourceGeometry = new THREE.SphereGeometry(0.3, 16, 16)
  const source1Material = new THREE.MeshStandardMaterial({
    color: 0x00d4ff,
    emissive: 0x00d4ff,
    emissiveIntensity: 0.8
  })
  const source2Material = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0xff4444,
    emissiveIntensity: 0.8
  })

  const source1 = new THREE.Mesh(sourceGeometry, source1Material)
  source1.position.set(wave1Source.x, 0.5, wave1Source.y)
  scene.add(source1)

  const source2 = new THREE.Mesh(sourceGeometry, source2Material)
  source2.position.set(wave2Source.x, 0.5, wave2Source.y)
  scene.add(source2)

  // Add pulsing effect to sources
  const source1Pulse = source1.clone()
  source1Pulse.scale.set(2, 2, 2)
  source1Pulse.material = new THREE.MeshStandardMaterial({
    color: 0x00d4ff,
    transparent: true,
    opacity: 0.3,
    emissive: 0x00d4ff,
    emissiveIntensity: 0.5
  })
  scene.add(source1Pulse)

  const source2Pulse = source2.clone()
  source2Pulse.scale.set(2, 2, 2)
  source2Pulse.material = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    transparent: true,
    opacity: 0.3,
    emissive: 0xff4444,
    emissiveIntensity: 0.5
  })
  scene.add(source2Pulse)

  // Animation
  const animate = () => {
    animationTime += 0.016

    // Update shader time uniform
    if (waveMesh && waveMesh.material instanceof THREE.ShaderMaterial) {
      waveMesh.material.uniforms.time.value = animationTime
    }

    // Animate source pulses
    const pulseScale = 1.5 + Math.sin(animationTime * frequency * 2 * Math.PI) * 0.5
    source1Pulse.scale.set(pulseScale, pulseScale, pulseScale)
    source2Pulse.scale.set(pulseScale, pulseScale, pulseScale)
    
    const pulseOpacity = 0.2 + Math.sin(animationTime * frequency * 2 * Math.PI) * 0.2
    if (source1Pulse.material instanceof THREE.MeshStandardMaterial) {
      source1Pulse.material.opacity = pulseOpacity
    }
    if (source2Pulse.material instanceof THREE.MeshStandardMaterial) {
      source2Pulse.material.opacity = pulseOpacity
    }

    renderer.render(scene, camera)
    animationId = requestAnimationFrame(animate)
  }

  animate()

  return () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
    }
    renderer.dispose()
  }
}

onMounted(() => {
  const cleanup = init()
  
  const handleResize = () => {
    if (containerRef.value && camera && renderer) {
      camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    cleanup()
  })
})

onUnmounted(() => {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
canvas {
  display: block;
}
</style>

