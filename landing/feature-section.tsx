"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "../src/lib/utils"

interface Feature {
  step: string
  title?: string
  content: string
  image: string
}

interface FeatureStepsProps {
  features: Feature[]
  className?: string
  title?: string
  autoPlayInterval?: number
  imageHeight?: string
}

export function FeatureSteps({
  features,
  className,
  title = "How to get Started",
  autoPlayInterval = 3000,
  imageHeight = "h-[400px]",
}: FeatureStepsProps) {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (autoPlayInterval / 100))
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length)
        setProgress(0)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [progress, features.length, autoPlayInterval])

  return (
    <div className={cn("p-8 md:p-12", className)}>
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-10 text-center">
          {title}
        </h2>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10">
          <div className="order-2 md:order-1 space-y-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-6 md:gap-8"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    index === currentFeature
                      ? "bg-orange-600 border-orange-600 text-white scale-110"
                      : "bg-gray-100 border-gray-300 text-gray-600",
                  )}
                >
                  {index <= currentFeature ? (
                    <span className="text-lg font-bold">✓</span>
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-semibold">
                    {feature.title || feature.step}
                  </h3>
                  <p className="text-sm md:text-lg text-gray-600">
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            className={cn(
              "order-1 md:order-2 relative h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden rounded-lg"
            )}
          >
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-lg overflow-hidden"
                      initial={{ y: 100, opacity: 0, rotateX: -20 }}
                      animate={{ y: 0, opacity: 1, rotateX: 0 }}
                      exit={{ y: -100, opacity: 0, rotateX: 20 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <Image
                        src={feature.image}
                        alt={feature.step}
                        className="w-full h-full object-cover transition-transform transform"
                        width={1000}
                        height={500}
                      />
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

const networkingFeatures = [
  {
    step: 'Step 1',
    title: 'Add Your Contacts',
    content: 'Import your existing contacts or add them manually. Agary automatically enriches profiles with AI-powered insights.',
    image: 'https://images.unsplash.com/photo-1560472355-536de3962603?q=80&w=2026&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    step: 'Step 2',
    title: 'Ask the AI Assistant',
    content: 'Use natural language to find the perfect contacts. Ask questions like "Who can help me with fundraising?" and get instant results.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    step: 'Step 3',
    title: 'Build Meaningful Connections',
    content: 'Leverage AI-powered insights to make strategic introductions and grow your professional network effectively.',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
]

export function AgaryFeatureSteps() {
  return (
      <FeatureSteps
        features={networkingFeatures}
        title="How Agary Works"
        autoPlayInterval={4000}
        imageHeight="h-[500px]"
      />
  )
}