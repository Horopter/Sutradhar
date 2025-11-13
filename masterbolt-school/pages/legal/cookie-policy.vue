<template>
  <div class="min-h-screen bg-white">
    <Navbar />
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
      <h1 class="text-4xl sm:text-5xl font-bold mb-8 text-gradient">Cookie Policy</h1>
      <div class="prose prose-lg max-w-none">
        <p class="text-slate-600 mb-6">Last updated: {{ new Date().toLocaleDateString() }}</p>
        
        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">What Are Cookies</h2>
          <p class="text-slate-600 mb-4">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">How We Use Cookies</h2>
          <p class="text-slate-600 mb-4">Masterbolt uses cookies for the following purposes:</p>
          <ul class="list-disc pl-6 text-slate-600 mb-4 space-y-2">
            <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
            <li><strong>Authentication Cookies:</strong> To keep you logged in and maintain your session</li>
            <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
            <li><strong>Analytics Cookies:</strong> To understand how visitors interact with our website</li>
            <li><strong>Performance Cookies:</strong> To improve website performance and user experience</li>
          </ul>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Types of Cookies We Use</h2>
          
          <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2 text-slate-800">Session Cookies</h3>
            <p class="text-slate-600">
              These are temporary cookies that are deleted when you close your browser. They help maintain your session while using our platform.
            </p>
          </div>

          <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2 text-slate-800">Persistent Cookies</h3>
            <p class="text-slate-600">
              These cookies remain on your device for a set period or until you delete them. They help us remember your preferences and improve your experience.
            </p>
          </div>

          <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2 text-slate-800">Third-Party Cookies</h3>
            <p class="text-slate-600">
              Some cookies are placed by third-party services that appear on our pages. We use these for analytics and to improve our services.
            </p>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Managing Cookies</h2>
          <p class="text-slate-600 mb-4">
            You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can impact your user experience and parts of our website may no longer be fully accessible.
          </p>
          <p class="text-slate-600 mb-4">Most browsers automatically accept cookies, but you can modify your browser settings to decline cookies if you prefer.</p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Updates to This Policy</h2>
          <p class="text-slate-600 mb-4">
            We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section class="mb-8">
          <h2 class="text-2xl font-bold mb-4 text-slate-800">Contact Us</h2>
          <p class="text-slate-600 mb-4">
            If you have questions about our use of cookies, please contact us at <a href="#contact" @click.prevent="handleContactClick" class="text-primary hover:underline">our contact page</a>.
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
  title: 'Cookie Policy - Masterbolt',
  meta: [
    { name: 'description', content: 'Masterbolt Cookie Policy - Learn about how we use cookies on our platform.' }
  ]
})
</script>

