"use client";
import React from 'react';
import Link from 'next/link';
import { MilankovicFAQ } from '@/components/MilankovicFAQ';
import { ObservatoryButton } from '@/components/ObservatoryPanel';

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-deep-space text-stardust-white p-6 md:p-8 relative overflow-hidden">
      {/* Background stars effect */}
      <div className="absolute inset-0 z-0 bg-[url('/stars-bg.png')] bg-repeat opacity-60"></div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl md:text-5xl font-playfair text-stardust-white mb-4 md:mb-0">
            <span className="text-pale-gold">Milanković</span> Cycles FAQ
          </h1>
          
          <div className="flex space-x-4">
            <Link href="/">
              <ObservatoryButton variant="secondary">
                Back to Simulation
              </ObservatoryButton>
            </Link>
            
            <Link href="/about">
              <ObservatoryButton variant="secondary">
                About
              </ObservatoryButton>
            </Link>
          </div>
        </header>
        
        <div className="prose prose-lg prose-invert max-w-none mb-8">
          <p className="text-xl text-stardust-white/90 leading-relaxed">
            Find answers to frequently asked questions about Milanković cycles, their components, and how they influence Earth's climate over long periods of time.
          </p>
        </div>
        
        <MilankovicFAQ />
        
        <footer className="mt-16 text-center text-stardust-white/60 text-sm">
          <p>Created by Filip van Harreveld</p>
          <p className="mt-2">
            <Link href="/" className="hover:text-pale-gold transition-colors">
              Return to Simulation
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
} 