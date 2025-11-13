<template>
  <div class="min-h-screen bg-white">
    <Navbar />
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
      <h1 class="text-4xl sm:text-5xl font-bold mb-8 text-gradient">Terms of Service</h1>
      <div class="prose prose-lg max-w-none">
        <p class="text-slate-600 mb-6">Last updated: {{ new Date().toLocaleDateString() }}</p>
        
        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Agreement to Terms</h2>
          <p class="text-slate-600 mb-4">
            By accessing or using Masterbolt's AI-powered learning platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Use License</h2>
          <p class="text-slate-600 mb-4">
            Permission is granted to temporarily access Masterbolt for personal, non-commercial use. This license does not include:
          </p>
          <ul class="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>Modifying or copying materials</li>
            <li>Using materials for commercial purposes</li>
            <li>Attempting to reverse engineer any software</li>
            <li>Removing copyright or proprietary notations</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">User Accounts</h2>
          <p class="text-slate-600 mb-4">
            When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding your password and for all activities that occur under your account.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Prohibited Uses</h2>
          <p class="text-slate-600 mb-4">You may not use our service:</p>
          <ul class="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li>In any way that violates any applicable law or regulation</li>
            <li>To transmit any malicious code or viruses</li>
            <li>To collect or track personal information of others</li>
            <li>To spam, phish, or engage in any fraudulent activity</li>
            <li>To interfere with or disrupt the service</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Intellectual Property</h2>
          <p class="text-slate-600 mb-4">
            The service and its original content, features, and functionality are owned by Masterbolt and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Termination</h2>
          <p class="text-slate-600 mb-4">
            We may terminate or suspend your account and access to the service immediately, without prior notice, for any reason, including breach of these Terms of Service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Limitation of Liability</h2>
          <p class="text-slate-600 mb-4">
            In no event shall Masterbolt be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Contact Us</h2>
          <p class="text-slate-600 mb-4">
            If you have questions about these Terms of Service, please contact us at <a href="#contact" @click.prevent="handleContactClick" class="text-primary hover:underline">our contact page</a>.
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
  title: 'Terms of Service - Masterbolt',
  meta: [
    { name: 'description', content: 'Masterbolt Terms of Service - Read our terms and conditions for using our AI-powered learning platform.' }
  ]
})
</script>

