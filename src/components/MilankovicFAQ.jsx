import React, { useState } from 'react';
import { ObservatoryPanel } from './ObservatoryPanel';

/**
 * MilankovicFAQ - A component displaying frequently asked questions about Milanković cycles
 * This component serves both educational purposes and improves SEO with relevant content
 */
export function MilankovicFAQ() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: "What are Milanković cycles?",
      answer: "Milanković cycles are periodic changes in Earth's orbit and axial rotation that affect the amount of solar radiation (insolation) Earth receives. Named after Serbian scientist Milutin Milanković, these cycles include three main components: eccentricity (the shape of Earth's orbit), axial tilt (the angle of Earth's axis), and precession (the wobbling of Earth's axis). Together, these cycles influence Earth's climate patterns over long time periods and are associated with the timing of glacial and interglacial periods."
    },
    {
      question: "How do Milanković cycles affect Earth's climate?",
      answer: "Milanković cycles affect Earth's climate by changing how much solar energy different parts of Earth receive throughout the year. When orbital conditions reduce summer sunlight in high northern latitudes, snow may persist year-round, allowing ice sheets to gradually form. These conditions can trigger ice ages when combined with other climate feedbacks. Conversely, when the cycles increase summer sunlight in the Northern Hemisphere, ice sheets tend to retreat, leading to warmer interglacial periods."
    },
    {
      question: "What is orbital eccentricity in Milanković cycles?",
      answer: "Orbital eccentricity refers to the shape of Earth's orbit around the Sun, which varies from nearly circular (low eccentricity) to more elliptical (high eccentricity). This cycle operates over approximately 100,000 and 413,000-year periods. Higher eccentricity increases the difference in solar radiation received at perihelion (closest approach to the Sun) versus aphelion (farthest point), affecting seasonal contrasts. Currently, Earth's eccentricity is about 0.0167 and decreasing."
    },
    {
      question: "What is axial tilt (obliquity) in Milanković cycles?",
      answer: "Axial tilt, or obliquity, is the angle between Earth's rotational axis and its orbital plane. It varies between about 22.1° and 24.5° over a 41,000-year cycle. Greater tilt increases seasonal contrast between summer and winter in both hemispheres. When axial tilt is higher, summers receive more solar radiation and winters receive less. Currently, Earth's axial tilt is about 23.4° and gradually decreasing."
    },
    {
      question: "What is axial precession in Milanković cycles?",
      answer: "Axial precession is the gradual shift in the orientation of Earth's axis, which completes a full cycle every 26,000 years. This 'wobbling' changes which hemisphere is tilted toward the Sun during perihelion (closest approach to the Sun). When the Northern Hemisphere is tilted toward the Sun during perihelion, it experiences more intense summers and milder winters. The opposite occurs when the Southern Hemisphere is tilted toward the Sun at perihelion."
    },
    {
      question: "How do scientists use Milanković cycles to understand paleoclimate?",
      answer: "Scientists use Milanković cycles as a framework for understanding past climate changes. By calculating past orbital parameters, researchers can predict periods when orbital conditions may have triggered ice ages. They then compare these predictions with paleoclimate evidence from ice cores, ocean sediments, and other records. The strong correlation between orbital cycles and climate records confirms the Milanković theory as a fundamental driver of Earth's long-term climate variations."
    },
    {
      question: "Did Milanković cycles cause all ice ages?",
      answer: "Milanković cycles are considered the primary pacemaker for the timing of glacial-interglacial cycles during the Quaternary period (the last 2.6 million years). However, they work in concert with other climate factors like atmospheric CO₂ concentrations, ocean circulation patterns, and continental configurations. The complex interplay between these factors amplifies the relatively small changes in solar radiation caused by orbital variations, leading to the dramatic climate shifts of ice ages."
    },
    {
      question: "How do Milanković cycles relate to modern climate change?",
      answer: "Milanković cycles operate over very long time scales (tens of thousands to hundreds of thousands of years) and are currently pushing Earth toward cooler conditions over the next several thousand years. However, human-caused climate change through greenhouse gas emissions is occurring much more rapidly (over decades to centuries) and is overwhelming the natural cooling influence of the current orbital configuration. Understanding Milanković cycles helps scientists distinguish between natural climate variability and anthropogenic climate change."
    }
  ];

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ObservatoryPanel title="Milanković Cycles: Frequently Asked Questions" variant="info">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-slate-blue border-opacity-20 pb-4 last:border-0">
            <button
              onClick={() => toggleFAQ(index)}
              className="text-left w-full flex justify-between items-center text-stardust-white hover:text-pale-gold transition-colors"
            >
              <h3 className="font-medium text-lg">{faq.question}</h3>
              <span className="text-xl">{expandedIndex === index ? '−' : '+'}</span>
            </button>
            
            {expandedIndex === index && (
              <div className="mt-2 text-stardust-white/80 text-sm leading-relaxed">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </ObservatoryPanel>
  );
} 