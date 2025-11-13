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
let layers: THREE.Mesh[][] = []
let connections: THREE.Line[] = []
let dataFlow: THREE.Points[] = []

const init = (): (() => void) => {
  if (!canvasRef.value || !containerRef.value) return () => {}

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0a)
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.03)
  
  camera = new THREE.PerspectiveCamera(
    50,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 18) // Closer to the network
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

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  // Add directional lights - brighter
  const light1 = new THREE.DirectionalLight(0x00ffff, 1.2)
  light1.position.set(5, 5, 5)
  light1.castShadow = true
  scene.add(light1)

  const light2 = new THREE.DirectionalLight(0xff0000, 1.0)
  light2.position.set(-5, 5, -5)
  light2.castShadow = true
  scene.add(light2)

  // Neural network structure: [input, hidden1, hidden2, hidden3, hidden4, output]
  const layerSizes = [10, 12, 16, 14, 18, 5]
  const layerSpacing = 4.0 // Wider spacing between layers
  const startX = -(layerSizes.length - 1) * layerSpacing / 2

  // Create layers - each with different height
  const layerHeights = [5, 8, 16, 8, 12, 2] // Different heights for each layer (increased height for second-to-last layer)
  layerSizes.forEach((size, layerIndex) => {
    const layer: THREE.Mesh[] = []
    const x = startX + layerIndex * layerSpacing
    const layerHeight = layerHeights[layerIndex] || 3
    const nodeSpacing = size > 1 ? layerHeight / (size - 1) : 0
    const startY = -(size - 1) * nodeSpacing / 2

    for (let nodeIndex = 0; nodeIndex < size; nodeIndex++) {
      const y = startY + nodeIndex * nodeSpacing
      
      // Node (neuron) geometry
      const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16)
      
      // Color based on layer position (input = red, output = cyan, hidden = gradient) - brighter
      let nodeColor: number
      if (layerIndex === 0) {
        nodeColor = 0xff0000 // Bright Red (input)
      } else if (layerIndex === layerSizes.length - 1) {
        nodeColor = 0x00ffff // Bright Cyan (output)
      } else {
        // Gradient from red to cyan for hidden layers
        const progress = layerIndex / (layerSizes.length - 1)
        nodeColor = new THREE.Color().lerpColors(
          new THREE.Color(0xff0000),
          new THREE.Color(0x00ffff),
          progress
        ).getHex()
      }

      const nodeMaterial = new THREE.MeshStandardMaterial({
        color: nodeColor,
        emissive: new THREE.Color(nodeColor).multiplyScalar(1.0),
        metalness: 0.8,
        roughness: 0.2
      })

      const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
      node.position.set(x, y, 0)
      node.castShadow = true
      node.userData = { 
        layerIndex, 
        nodeIndex, 
        originalColor: nodeColor,
        activation: 0 
      }
      
      scene.add(node)
      layer.push(node)
    }
    
    layers.push(layer)
  })

  // Create connections (synapses) between layers - remove 50% randomly
  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
    const currentLayer = layers[layerIndex]
    const nextLayer = layers[layerIndex + 1]

    currentLayer.forEach((node1) => {
      nextLayer.forEach((node2) => {
        // Randomly skip 50% of connections
        if (Math.random() < 0.5) {
          return // Skip this connection
        }
        
        const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
          node1.position.clone(),
          node2.position.clone()
        ])
        
        // Connection color based on layer - brighter
        const progress = (layerIndex + 0.5) / (layers.length - 1)
        const connectionColor = new THREE.Color().lerpColors(
          new THREE.Color(0xff0000),
          new THREE.Color(0x00ffff),
          progress
        )

        const connectionMaterial = new THREE.LineBasicMaterial({
          color: connectionColor,
          transparent: true,
          opacity: 0.4
        })

        const connection = new THREE.Line(connectionGeometry, connectionMaterial)
        connection.userData = { 
          fromNode: node1, 
          toNode: node2,
          weight: Math.random() * 0.5 + 0.5,
          active: false
        }
        
        scene.add(connection)
        connections.push(connection)
      })
    })
  }

  // Create data flow particles - enhanced for better visibility
  // Only create particles for connections that exist (skip 50% to match removed connections)
  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
    const currentLayer = layers[layerIndex]
    const nextLayer = layers[layerIndex + 1]

    // Create particles for each connection - more particles for better flow
    currentLayer.forEach((node1, nodeIndex) => {
      nextLayer.forEach((node2) => {
        // Skip particles for connections that were removed (50%)
        if (Math.random() < 0.5) {
          return // Skip this particle system
        }
        
        const particleCount = 8 // Increased from 3 for smoother flow
        const particleGeometry = new THREE.BufferGeometry()
        const positions = new Float32Array(particleCount * 3)
        const colors = new Float32Array(particleCount * 3)

        const progress = (layerIndex + 0.5) / (layers.length - 1)
        const particleColor = new THREE.Color().lerpColors(
          new THREE.Color(0xff0000),
          new THREE.Color(0x00ffff),
          progress
        )

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3
          const t = i / particleCount // Evenly spaced particles
          const pos = new THREE.Vector3().lerpVectors(node1.position, node2.position, t)
          positions[i3] = pos.x
          positions[i3 + 1] = pos.y
          positions[i3 + 2] = pos.z

          colors[i3] = particleColor.r
          colors[i3 + 1] = particleColor.g
          colors[i3 + 2] = particleColor.b
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const particleMaterial = new THREE.PointsMaterial({
          size: 0.15, // Slightly larger for better visibility
          vertexColors: true,
          transparent: true,
          opacity: 1.0,
          blending: THREE.AdditiveBlending
        })

        const particles = new THREE.Points(particleGeometry, particleMaterial)
        particles.userData = {
          fromNode: node1,
          toNode: node2,
          progress: Math.random(),
          speed: 0.015 + Math.random() * 0.01 // Consistent speed for smooth flow
        }
        
        scene.add(particles)
        dataFlow.push(particles)
      })
    })
  }

  // Animation loop
  const clock = new THREE.Clock()
  
  const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = clock.getDelta()

    // Animate node activations (pulsing)
    layers.forEach((layer, layerIndex) => {
      layer.forEach((node, nodeIndex) => {
        const activation = Math.sin(elapsedTime * 2 + nodeIndex * 0.5 + layerIndex) * 0.5 + 0.5
        node.userData.activation = activation
        
        // Scale based on activation
        const scale = 0.8 + activation * 0.4
        node.scale.set(scale, scale, scale)
        
        // Brightness based on activation
        const brightness = 0.3 + activation * 0.7
        const color = new THREE.Color(node.userData.originalColor).multiplyScalar(brightness)
        ;(node.material as THREE.MeshStandardMaterial).emissive = color
      })
    })

    // Animate connections (pulse based on data flow)
    connections.forEach((connection, index) => {
      const material = connection.material as THREE.LineBasicMaterial
      const pulse = Math.sin(elapsedTime * 3 + index * 0.1) * 0.3 + 0.7
      material.opacity = 0.1 + pulse * 0.3
      
      // Update line color based on activation
      const fromNode = connection.userData.fromNode
      const toNode = connection.userData.toNode
      const avgActivation = (fromNode.userData.activation + toNode.userData.activation) / 2
      
      const progress = (fromNode.userData.layerIndex + 0.5) / (layers.length - 1)
      const baseColor = new THREE.Color().lerpColors(
        new THREE.Color(0xff4444),
        new THREE.Color(0x00d4ff),
        progress
      )
      const activeColor = baseColor.multiplyScalar(0.5 + avgActivation * 0.5)
      material.color = activeColor
    })

    // Animate data flow particles - continuous flow between layers
    dataFlow.forEach((particles) => {
      const fromNode = particles.userData.fromNode
      const toNode = particles.userData.toNode
      const progress = particles.userData.progress
      const speed = particles.userData.speed

      // Update particle positions - create continuous flowing effect
      const positions = particles.geometry.attributes.position.array as Float32Array
      const particleCount = positions.length / 3
      const newProgress = (progress + speed * deltaTime * 15) % 1 // Faster flow

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        // Space particles evenly along the connection with continuous flow
        const spacing = 1.0 / particleCount
        const t = (newProgress + i * spacing) % 1
        const pos = new THREE.Vector3().lerpVectors(fromNode.position, toNode.position, t)
        positions[i3] = pos.x
        positions[i3 + 1] = pos.y
        positions[i3 + 2] = pos.z
        
        // Add slight pulsing effect based on position
        const pulse = Math.sin(elapsedTime * 4 + t * Math.PI * 2) * 0.05
        positions[i3 + 2] += pulse
      }

      particles.userData.progress = newProgress
      particles.geometry.attributes.position.needsUpdate = true
      
      // Update particle opacity based on flow direction for better visibility
      const opacity = 0.7 + Math.sin(elapsedTime * 3) * 0.3
      ;(particles.material as THREE.PointsMaterial).opacity = opacity
    })

    // Keep camera fixed position
    camera.position.set(0, 0, 18)
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

