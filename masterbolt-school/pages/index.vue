<template>
  <div class="min-h-screen">
    <!-- Navigation -->
    <Navbar />

    <!-- Hero Section with Blackhole Background -->
    <section id="product" class="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <BlackholeBackground />
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="flex justify-center mb-8 animate-fade-in">
          <Logo :size="256" :show-text="true" />
        </div>
        <p class="text-xl sm:text-2xl md:text-3xl mb-4 text-gradient-theme font-medium animate-[fadeIn_1s_ease-out_0.2s_forwards]">
          Your AI-Powered Learning Companion
        </p>
        <p class="text-lg sm:text-xl mb-8 text-slate-200 max-w-3xl mx-auto animate-[fadeIn_1s_ease-out_0.4s_forwards]">
          An agentic AI-driven learning platform that guides, visualizes, and adapts to help everyone learn better.
          Powered by <span class="font-semibold text-primary">Sutradhar</span>.
        </p>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="section-padding bg-slate-900">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            Guided Learning, Not Just Answers
          </h2>
          <p class="text-xl text-slate-200 max-w-3xl mx-auto">
            While other platforms give direct answers, we guide students to discover answers themselves.
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <NewtonsCradle />
          </div>
          <div>
            <h3 class="text-3xl font-bold mb-4 text-gradient-theme">Socratic Method</h3>
            <p class="text-lg text-slate-200 mb-4">
              Our agentic AI system, <span class="font-semibold text-primary">Optimus</span>, uses the Socratic method—asking leading questions instead of providing solutions. This encourages critical thinking and deep understanding.
            </p>
            <h3 class="text-3xl font-bold mb-4 text-gradient-theme mt-8 font-sans">Feynman Technique</h3>
            <p class="text-lg text-slate-200">
              We encourage students to explain concepts back in simple terms, which reveals gaps in understanding. When a student can explain it simply, they've truly mastered it.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="section-padding bg-slate-800">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            See It, Don't Just Read It
          </h2>
          <p class="text-xl text-slate-200 max-w-3xl mx-auto">
            We generate custom images and videos on-demand to explain complex concepts instantly.
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 class="text-3xl font-bold mb-4 text-gradient-theme">Custom Visualizations</h3>
            <ul class="space-y-4 text-lg text-slate-200">
              <li class="flex items-start">
                <span class="text-primary mr-3">✨</span>
                <span>Personalized diagrams and illustrations tailored to your question</span>
              </li>
              <li class="flex items-start">
                <span class="text-secondary mr-3">🎥</span>
                <span>Short, personalized video explanations showing step-by-step processes</span>
              </li>
              <li class="flex items-start">
                <span class="text-accent mr-3">💻</span>
                <span>Code visualizations showing execution flow and data structures</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">📊</span>
                <span>Interactive diagrams—flowcharts, mind maps, concept maps</span>
              </li>
            </ul>
          </div>
          <div>
            <WaveInterference />
          </div>
        </div>
      </div>
    </section>

    <!-- Use Cases Section -->
    <section id="use-cases" class="section-padding bg-slate-900">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            Learning That Adapts to You
          </h2>
          <p class="text-xl text-slate-200 max-w-3xl mx-auto">
            We don't just adapt to how you learn—we adapt to who you are.
          </p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="use-case-card">
            <div class="use-case-icon">👁️</div>
            <h3 class="card-heading text-gradient-theme">Visual Learners</h3>
            <p class="use-case-text">
              Interactive diagrams and animated visualizations. Learn the water cycle through animated clouds and rain.
            </p>
          </div>
          <div class="use-case-card">
            <div class="use-case-icon">🌍</div>
            <h3 class="card-heading text-gradient-theme">Non-Native Speakers</h3>
            <p class="use-case-text">
              Simplified explanations with basic vocabulary and visual aids, not complex jargon.
            </p>
          </div>
          <div class="use-case-card">
            <div class="use-case-icon">📚</div>
            <h3 class="card-heading text-gradient-theme">Dyslexic Students</h3>
            <p class="use-case-text">
              Multi-modal content with voice narration, timelines, and visual maps instead of dense paragraphs.
            </p>
          </div>
          <div class="use-case-card">
            <div class="use-case-icon">🌐</div>
            <h3 class="card-heading text-gradient-theme">Cultural Awareness</h3>
            <p class="use-case-text">
              Examples adapted to your background. No more plum pudding models for students who've never seen one.
            </p>
          </div>
          <div class="use-case-card">
            <div class="use-case-icon">🔇</div>
            <h3 class="card-heading text-gradient-theme">Introverted Students</h3>
            <p class="use-case-text">
              Private, judgment-free AI tutoring. No fear of asking 'dumb questions' in public.
            </p>
          </div>
          <div class="use-case-card">
            <div class="use-case-icon">🎯</div>
            <h3 class="card-heading text-gradient-theme">Practice-Focused</h3>
            <p class="use-case-text">
              Unlimited practice problems. Get 50 variations of quadratic equations until you master it.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Assessment & Gamification -->
    <section class="section-padding bg-slate-800">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            Learn, Compete, Achieve
          </h2>
          <p class="text-xl text-slate-200 max-w-3xl mx-auto">
            Every quiz is AI-generated and unique. Every code submission gets instant, detailed feedback.
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <SuccessGraph />
          </div>
          <div>
            <h3 class="text-3xl font-bold mb-4 text-gradient-theme">Smart Assessment</h3>
            <p class="text-lg text-slate-200 mb-6">
              We don't just grade—we teach. Our system explains why answers are wrong, identifies strengths and weaknesses, and provides actionable improvement suggestions.
            </p>
            <h3 class="text-3xl font-bold mb-4 text-gradient-theme mt-8 font-sans">Gamification</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-700/80 rounded-lg p-4 border-2 border-yellow-500/50 bg-yellow-500/10">
                <div class="text-2xl mb-2">🏆</div>
                <div class="font-semibold text-gradient-theme">Badges</div>
              </div>
              <div class="bg-slate-700/80 rounded-lg p-4 border-2 border-orange-500/50 bg-orange-500/10">
                <div class="text-2xl mb-2">🔥</div>
                <div class="font-semibold text-gradient-theme">Streaks</div>
              </div>
              <div class="bg-slate-700/80 rounded-lg p-4 border-2 border-blue-500/50 bg-blue-500/10">
                <div class="text-2xl mb-2">📊</div>
                <div class="font-semibold text-gradient-theme">Leaderboards</div>
              </div>
              <div class="bg-slate-700/80 rounded-lg p-4 border-2 border-yellow-400/50 bg-yellow-400/10">
                <div class="text-2xl mb-2">⭐</div>
                <div class="font-semibold text-gradient-theme">Points</div>
              </div>
            </div>
            <p class="text-sm text-slate-400 mt-4">
              Students with active streaks are 3x more likely to complete courses.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Evolving Models Section -->
    <section class="section-padding bg-slate-900">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            Beyond K-12: Learning at Every Stage
          </h2>
          <p class="text-xl text-slate-200 max-w-3xl mx-auto">
            While we focus on K-12 now, we're building something much bigger.
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-8">
          <div class="glass rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-2">
            <div class="text-5xl mb-4">💻</div>
            <h3 class="text-2xl font-bold mb-3 text-gradient-theme font-sans">Code Project Onboarding</h3>
            <p class="text-slate-200 mb-4">
              Upload a codebase, and Optimus analyzes the architecture, identifies key components, and generates personalized tutorials explaining how everything connects.
            </p>
            <p class="text-sm text-slate-400">
              What used to take weeks of confusion now takes days of guided learning.
            </p>
          </div>
          <div class="glass rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-2">
            <div class="text-5xl mb-4">🔌</div>
            <h3 class="card-heading text-gradient-theme">API Tutorials</h3>
            <p class="text-slate-200 mb-4">
              Need to integrate Stripe? We generate interactive tutorials with code examples tailored to your specific tech stack—React, Python, Node.js, whatever you use.
            </p>
            <p class="text-sm text-slate-400">
              Working examples, not abstract concepts.
            </p>
          </div>
          <div class="glass rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-2">
            <div class="text-5xl mb-4">📖</div>
            <h3 class="card-heading text-gradient-theme">Literary Analysis</h3>
            <p class="text-slate-200 mb-4">
              Studying Shakespeare? Optimus provides historical context, explains themes, and offers critical commentaries from different perspectives.
            </p>
            <p class="text-sm text-slate-400">
              Understand not just what the text says, but why it matters.
            </p>
          </div>
          <div class="glass rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-2">
            <div class="text-5xl mb-4">🔬</div>
            <h3 class="card-heading text-gradient-theme">Research Assistance</h3>
            <p class="text-slate-200 mb-4">
              Writing your thesis? Optimus helps you research, synthesize information, identify gaps in literature, and structure your arguments.
            </p>
            <p class="text-sm text-slate-400">
              A research assistant that never sleeps.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="section-padding bg-slate-900">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            Simple, Transparent Pricing
          </h2>
          <p class="text-xl text-slate-200 max-w-3xl mx-auto">
            Choose the plan that works for you. All plans include 24/7 AI tutoring.
          </p>
        </div>

        <!-- FIX: vertical stack by default; columns only on lg+ -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Free -->
          <div class="glass rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-2 h-full">
            <h3 class="text-2xl font-bold mb-4 text-gradient-theme font-sans">Free</h3>
            <div class="text-4xl font-bold text-primary mb-4">$0</div>
            <ul class="space-y-3 text-slate-200 mb-8">
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Basic AI tutoring</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Limited practice problems</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Community support</span>
              </li>
            </ul>
          </div>

          <!-- Pro -->
          <div class="glass rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-2 border-2 border-primary h-full">
            <div class="bg-primary text-white rounded-full px-4 py-1 text-sm font-semibold inline-block mb-4">Popular</div>
            <h3 class="text-2xl font-bold mb-4 text-gradient-theme font-sans">Pro</h3>
            <div class="text-4xl font-bold text-primary mb-4">$29<span class="text-lg text-slate-400">/mo</span></div>
            <ul class="space-y-3 text-slate-200 mb-8">
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Unlimited AI tutoring</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Unlimited practice problems</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Custom visualizations</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Priority support</span>
              </li>
            </ul>
          </div>

          <!-- Enterprise -->
          <div class="glass rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-2 h-full">
            <h3 class="text-2xl font-bold mb-4 text-gradient-theme font-sans">Enterprise</h3>
            <div class="text-4xl font-bold text-primary mb-4">Custom</div>
            <ul class="space-y-3 text-slate-200 mb-8">
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Everything in Pro</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Custom integrations</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Dedicated support</span>
              </li>
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>Advanced analytics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Sutradhar Technology Section -->
    <section class="section-padding bg-gradient-to-br from-cyan-900/50 via-red-900/50 to-black">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="section-heading text-gradient-theme">
            Powered by Sutradhar
          </h2>
          <p class="section-description">
            Our flagship core AI orchestrator that sets us apart from every competitor.
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 class="subsection-heading text-gradient-theme">The Brain Behind Optimus</h3>
            <p class="body-text mb-6">
              Sutradhar isn't just a component—it's the sophisticated orchestration engine that powers Optimus, coordinates all our AI agents, manages complex learning workflows, and ensures every interaction is perfectly personalized.
            </p>
            <ul class="feature-list">
              <li class="feature-item">
                <span class="feature-icon">✓</span>
                <span>Multi-agent orchestration system coordinating tutoring, assessment, analytics, and content generation agents</span>
              </li>
              <li class="feature-item">
                <span class="feature-icon">✓</span>
                <span>Scales to millions while maintaining personalization for each student</span>
              </li>
              <li class="feature-item">
                <span class="feature-icon">✓</span>
                <span>Predictive analytics that identify at-risk students before they drop out</span>
              </li>
              <li class="feature-item">
                <span class="feature-icon">✓</span>
                <span>24/7 AI tutoring that never gets tired or frustrated</span>
              </li>
            </ul>
          </div>
          <div>
            <NeuralNetwork />
          </div>
        </div>
      </div>
    </section>

    <!-- Content Quality Section -->
    <section class="section-padding bg-slate-800">
      <div class="max-w-7xl mx-auto text-center">
        <div class="mb-8">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            Ethically Sourced Content
          </h2>
          <p class="text-xl text-slate-200 max-w-3xl mx-auto">
            All our course material is ethically sourced from Rice University's curated OpenStax curriculum—high-quality, peer-reviewed educational content trusted by institutions worldwide.
          </p>
        </div>
        <div class="flex justify-center items-center gap-8 flex-wrap">
          <div class="text-center">
            <div class="text-5xl font-bold text-primary mb-2">3x</div>
            <div class="text-slate-200">Higher Completion Rates</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-secondary mb-2">24/7</div>
            <div class="text-slate-200">Always Available</div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section-padding bg-slate-900">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            About Us
          </h2>
          <p class="text-xl text-slate-200 max-w-3xl mx-auto">
            We're building the future of personalized learning, one student at a time.
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 class="text-3xl font-bold mb-4 text-gradient-theme font-sans">Our Mission</h3>
            <p class="text-lg text-slate-200 mb-6">
              We are here to help teachers teach better and students learn better. We guide, we visualize, we adapt, we include everyone. Powered by Sutradhar, we're building a platform that truly helps everyone learn better.
            </p>
            <h3 class="text-3xl font-bold mb-4 text-gradient-theme mt-8 font-sans">Our Vision</h3>
            <p class="text-lg text-slate-200">
              To make personalized, high-quality education accessible to everyone, regardless of their learning style, background, or circumstances.
            </p>
          </div>
          <div class="glass rounded-2xl p-8">
            <h3 class="text-2xl font-bold mb-4 text-gradient-theme font-sans">Key Achievements</h3>
            <ul class="space-y-4 text-slate-200">
              <li class="flex items-start">
                <span class="text-primary mr-3">✓</span>
                <span>3x higher course completion rates compared to traditional platforms</span>
              </li>
              <li class="flex items-start">
                <span class="text-secondary mr-3">✓</span>
                <span>Ethically sourced content from Rice University's OpenStax curriculum</span>
              </li>
              <li class="flex items-start">
                <span class="text-accent mr-3">✓</span>
                <span>Powered by Sutradhar - advanced AI orchestration technology</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="section-padding bg-slate-800">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl sm:text-5xl font-bold mb-4 text-gradient font-sans">
            Get in Touch
          </h2>
          <p class="text-xl text-slate-200">
            Have questions? We'd love to hear from you.
          </p>
        </div>
        <div class="glass rounded-2xl p-8">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div v-if="formMessage" :class="['p-4 rounded-lg', formSuccess ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50']">
              {{ formMessage }}
            </div>
            <div>
              <label class="block text-sm font-semibold text-gradient-theme mb-2">Name</label>
              <input 
                v-model="formData.name"
                type="text" 
                required
                class="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                placeholder="Your name"
                :disabled="isSubmitting"
              >
            </div>
            <div>
              <label class="block text-sm font-semibold text-white mb-2">Email</label>
              <input 
                v-model="formData.email"
                type="email" 
                required
                class="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                placeholder="your@email.com"
                :disabled="isSubmitting"
              >
            </div>
            <div>
              <label class="block text-sm font-semibold text-white mb-2">Message</label>
              <textarea 
                v-model="formData.message"
                rows="5" 
                required
                class="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                placeholder="Your message"
                :disabled="isSubmitting"
              ></textarea>
            </div>
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="w-full px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span v-if="!isSubmitting">Send Message</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            </button>
          </form>
        </div>
      </div>
    </section>


    <!-- Footer -->
    <footer class="bg-slate-900 text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo :size="128" :show-text="true" />
            <p class="text-slate-400 text-sm mt-2">
              Powered by Sutradhar
            </p>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Product</h4>
            <ul class="space-y-2 text-sm text-slate-400">
              <li><a href="#features" @click.prevent="handleAnchorClick($event, 'features')" class="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" @click.prevent="handleAnchorClick($event, 'how-it-works')" class="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#use-cases" @click.prevent="handleAnchorClick($event, 'use-cases')" class="hover:text-white transition-colors">Use Cases</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Company</h4>
            <ul class="space-y-2 text-sm text-slate-400">
              <li><a href="#about" @click.prevent="handleAnchorClick($event, 'about')" class="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#contact" @click.prevent="handleAnchorClick($event, 'contact')" class="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Legal</h4>
            <ul class="space-y-2 text-sm text-slate-400">
              <li><a href="/legal/privacy-policy" class="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/legal/terms-of-service" class="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/legal/cookie-policy" class="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-slate-800 pt-8 text-center">
          <p class="text-slate-500 text-sm">
            2025. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const route = useRoute()

useHead({
  title: 'Masterbolt',
  meta: [
    {
      name: 'description',
      content: 'An agentic AI-driven learning platform that guides, visualizes, and adapts to help everyone learn better. Powered by Sutradhar.'
    }
  ]
})

// Contact form state
const formData = ref({
  name: '',
  email: '',
  message: ''
})
const isSubmitting = ref(false)
const formMessage = ref('')
const formSuccess = ref(false)

const handleSubmit = async () => {
  isSubmitting.value = true
  formMessage.value = ''
  formSuccess.value = false

  try {
    const response = await $fetch('/api/contact', {
      method: 'POST',
      body: formData.value
    })

    formSuccess.value = true
    formMessage.value = response.message || 'Thank you for your message! We will get back to you soon.'
    
    // Reset form
    formData.value = {
      name: '',
      email: '',
      message: ''
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      formMessage.value = ''
    }, 5000)
  } catch (error: any) {
    formSuccess.value = false
    formMessage.value = error.data?.message || error.message || 'Failed to send message. Please try again later.'
  } finally {
    isSubmitting.value = false
  }
}

const handleAnchorClick = (e: Event, sectionId: string) => {
  e.preventDefault()
  if (route.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          window.history.pushState(null, '', `#${sectionId}`)
        }
      }, 100)
    })
  } else {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.pushState(null, '', `#${sectionId}`)
    }
  }
}

onMounted(() => {
  // Professional scroll animations using Intersection Observer
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gsap.to(entry.target, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out'
        })
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  // Animate glass elements
  document.querySelectorAll('.glass').forEach((el) => {
    gsap.set(el, { opacity: 0, y: 50 })
    observer.observe(el)
  })

  // Animate feature cards
  document.querySelectorAll('section > div > div').forEach((el) => {
    if (el.classList.contains('grid')) {
      Array.from(el.children).forEach((child, index) => {
        gsap.set(child, { opacity: 0, y: 30 })
        observer.observe(child)
      })
    }
  })
})
</script>

