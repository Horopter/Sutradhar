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
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let animationId: number
let graphLines: THREE.Line[] = []
let checkpoints: THREE.Mesh[] = []
let progressBar: THREE.Mesh | null = null
let labels: THREE.Sprite[] = []

const init = (): (() => void) => {
  if (!canvasRef.value || !containerRef.value) return () => {}

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0a)
  
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  
  // Use orthographic camera for 2D graph
  camera = new THREE.OrthographicCamera(
    -width / 2, width / 2,
    height / 2, -height / 2,
    0.1, 1000
  )
  camera.position.z = 100

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Graph dimensions
  const graphWidth = width * 0.7
  const graphHeight = height * 0.6
  const graphX = -graphWidth / 2
  const graphY = -graphHeight / 2
  const padding = 60

  // Create axes
  const axisMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 })
  
  // X-axis
  const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(graphX, graphY, 0),
    new THREE.Vector3(graphX + graphWidth, graphY, 0)
  ])
  const xAxis = new THREE.Line(xAxisGeometry, axisMaterial)
  scene.add(xAxis)

  // Y-axis
  const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(graphX, graphY, 0),
    new THREE.Vector3(graphX, graphY + graphHeight, 0)
  ])
  const yAxis = new THREE.Line(yAxisGeometry, axisMaterial)
  scene.add(yAxis)

  // Grid lines
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 1 })
  
  // Horizontal grid lines (score levels)
  for (let i = 0; i <= 5; i++) {
    const y = graphY + (graphHeight / 5) * i
    const gridGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(graphX, y, 0),
      new THREE.Vector3(graphX + graphWidth, y, 0)
    ])
    const gridLine = new THREE.Line(gridGeometry, gridMaterial)
    scene.add(gridLine)
  }

  // Vertical grid lines (time periods)
  for (let i = 0; i <= 6; i++) {
    const x = graphX + (graphWidth / 6) * i
    const gridGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, graphY, 0),
      new THREE.Vector3(x, graphY + graphHeight, 0)
    ])
    const gridLine = new THREE.Line(gridGeometry, gridMaterial)
    scene.add(gridLine)
  }

  // Checkpoint data (time, score, label) - brighter colors with time periods
  const checkpointData = [
    { time: 0, score: 0.3, label: '2 weeks', color: 0xff0000 },
    { time: 1, score: 0.45, label: '1 month', color: 0xff6600 },
    { time: 2, score: 0.6, label: '2 months', color: 0xffff00 },
    { time: 3, score: 0.75, label: '3 months', color: 0x00ffff },
    { time: 4, score: 0.85, label: '4 months', color: 0x0088ff },
    { time: 5, score: 0.95, label: '6 months', color: 0x0000ff }
  ]

  // Create checkpoint markers
  checkpointData.forEach((checkpoint, index) => {
    const x = graphX + (graphWidth / 6) * checkpoint.time
    const y = graphY + graphHeight * checkpoint.score

    // Checkpoint sphere
    const checkpointGeometry = new THREE.SphereGeometry(10, 16, 16)
    const checkpointMaterial = new THREE.MeshStandardMaterial({
      color: checkpoint.color,
      emissive: new THREE.Color(checkpoint.color).multiplyScalar(1.0),
      metalness: 0.9,
      roughness: 0.1
    })
    const checkpointMesh = new THREE.Mesh(checkpointGeometry, checkpointMaterial)
    checkpointMesh.position.set(x, y, 0)
    checkpointMesh.userData = { originalY: y, index, label: checkpoint.label }
    scene.add(checkpointMesh)
    checkpoints.push(checkpointMesh)

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(15, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: checkpoint.color,
      transparent: true,
      opacity: 0.4
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.set(x, y, -1)
    scene.add(glow)

    // Checkpoint line to axis
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, graphY, 0),
      new THREE.Vector3(x, y, 0)
    ])
    const lineMaterial = new THREE.LineDashedMaterial({
      color: checkpoint.color,
      dashSize: 3,
      gapSize: 2,
      transparent: true,
      opacity: 0.3
    })
    const dashLine = new THREE.Line(lineGeometry, lineMaterial)
    dashLine.computeLineDistances()
    scene.add(dashLine)

    // Create text label using canvas sprite
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context) {
      canvas.width = 120
      canvas.height = 40
      context.fillStyle = '#ffffff'
      context.font = 'bold 14px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(checkpoint.label, canvas.width / 2, canvas.height / 2)
      
      const texture = new THREE.CanvasTexture(canvas)
      texture.needsUpdate = true
      
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9
      })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.set(x, graphY - 25, 0)
      sprite.scale.set(120, 40, 1)
      scene.add(sprite)
      labels.push(sprite)
    }
  })

  // Create progress line (will be animated)
  const linePoints: THREE.Vector3[] = []
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    linewidth: 4
  })
  const progressLine = new THREE.Line(lineGeometry, lineMaterial)
  scene.add(progressLine)
  graphLines.push(progressLine)

  // Create area under curve
  const areaPoints: THREE.Vector3[] = [
    new THREE.Vector3(graphX, graphY, 0)
  ]
  const areaGeometry = new THREE.BufferGeometry().setFromPoints(areaPoints)
  const areaMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })
  const areaMesh = new THREE.Mesh(areaGeometry, areaMaterial)
  scene.add(areaMesh)

  // Add point lights for checkpoint glow
  const pointLight = new THREE.PointLight(0x00ffff, 2.5, 200)
  pointLight.position.set(0, 0, 50)
  scene.add(pointLight)

  // Add ambient light for better visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  // Animation variables
  let animationProgress = 0
  let currentCheckpoint = 0

  // Animation loop
  const clock = new THREE.Clock()
  
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = clock.getDelta()

    // Animate progress
    animationProgress += deltaTime * 0.3
    if (animationProgress > 1) {
      animationProgress = 0
      currentCheckpoint = (currentCheckpoint + 1) % checkpointData.length
    }

    // Update progress line
    const linePoints: THREE.Vector3[] = []
    const areaPoints: THREE.Vector3[] = [new THREE.Vector3(graphX, graphY, 0)]

    for (let i = 0; i <= currentCheckpoint; i++) {
      const checkpoint = checkpointData[i]
      const x = graphX + (graphWidth / 6) * checkpoint.time
      const y = graphY + graphHeight * checkpoint.score
      linePoints.push(new THREE.Vector3(x, y, 0))
      areaPoints.push(new THREE.Vector3(x, y, 0))
    }

    // Add current animated point
    if (currentCheckpoint < checkpointData.length - 1) {
      const current = checkpointData[currentCheckpoint]
      const next = checkpointData[currentCheckpoint + 1]
      const t = animationProgress
      
      const x = graphX + (graphWidth / 6) * (current.time + (next.time - current.time) * t)
      const y = graphY + graphHeight * (current.score + (next.score - current.score) * t)
      
      linePoints.push(new THREE.Vector3(x, y, 0))
      areaPoints.push(new THREE.Vector3(x, y, 0))
    }

    // Close area shape
    areaPoints.push(new THREE.Vector3(graphX, graphY, 0))

    // Update geometries
    progressLine.geometry.setFromPoints(linePoints)
    areaMesh.geometry.setFromPoints(areaPoints)
    areaMesh.geometry.computeVertexNormals()

    // Animate checkpoint markers (pulse effect)
    checkpoints.forEach((checkpoint, index) => {
      const pulse = Math.sin(elapsedTime * 2 + index) * 0.1 + 1
      checkpoint.scale.set(pulse, pulse, pulse)
      
      // Highlight current checkpoint
      if (index === currentCheckpoint) {
        const highlight = Math.sin(elapsedTime * 4) * 0.3 + 0.7
        checkpoint.material.emissive = new THREE.Color(checkpointData[index].color).multiplyScalar(highlight)
      }
    })

    // Move point light to current checkpoint
    if (currentCheckpoint < checkpointData.length) {
      const checkpoint = checkpointData[currentCheckpoint]
      const x = graphX + (graphWidth / 6) * checkpoint.time
      const y = graphY + graphHeight * checkpoint.score
      pointLight.position.set(x, y, 50)
    }

    renderer.render(scene, camera)
  }

  animate()

  // Handle resize
  const handleResize = () => {
    if (containerRef.value && canvasRef.value) {
      const width = containerRef.value.clientWidth
      const height = containerRef.value.clientHeight
      
      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2
      camera.updateProjectionMatrix()
      
      renderer.setSize(width, height)
    }
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
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

