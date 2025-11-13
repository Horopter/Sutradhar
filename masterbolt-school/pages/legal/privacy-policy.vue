<template>
  <div class="min-h-screen bg-white">
    <Navbar />
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
      <h1 class="text-4xl sm:text-5xl font-bold mb-8 text-gradient">Privacy Policy</h1>
      <div class="prose prose-lg max-w-none">
        <p class="text-slate-600 mb-6">Last updated: {{ new Date().toLocaleDateString() }}</p>
        
        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Introduction</h2>
          <p class="text-slate-600 mb-4">
            Masterbolt ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered learning platform.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Information We Collect</h2>
          <p class="text-slate-600 mb-4">We collect information that you provide directly to us, including:</p>
          <ul class="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>Account information (name, email address, password)</li>
            <li>Learning data (progress, quiz results, course completions)</li>
            <li>Communication data (messages, feedback, support requests)</li>
            <li>Payment information (processed securely through third-party payment processors)</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">How We Use Your Information</h2>
          <p class="text-slate-600 mb-4">We use the information we collect to:</p>
          <ul class="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Personalize your learning experience</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Data Security</h2>
          <p class="text-slate-600 mb-4">
            We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Your Rights</h2>
          <p class="text-slate-600 mb-4">You have the right to:</p>
          <ul class="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing your personal data</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Contact Us</h2>
          <p class="text-slate-600 mb-4">
            If you have questions about this Privacy Policy, please contact us at <a href="#contact" @click.prevent="handleContactClick" class="text-primary hover:underline">our contact page</a>.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleContactClick = (e: Event) => {
  e.preventDefault()
  router.push('/').then(() => {
    setTimeout(() => {
      const element = document.getElementById('contact')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.pushState(null, '', `#contact`)
      }
    }, 100)
  })
}

useHead({
  title: 'Privacy Policy - Masterbolt',
  meta: [
    { name: 'description', content: 'Masterbolt Privacy Policy - Learn how we collect, use, and protect your information.' }
  ]
})
</script>

