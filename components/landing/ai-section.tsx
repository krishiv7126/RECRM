"use client";

import { useState, useEffect, useRef } from "react";

const codeExamples = [
  {
    label: "Copilot",
    code: `You   Which hot leads haven't heard
      from us this week?

AI    3 leads, all scored 80+:
      · Rohan Mehta   3 BHK   ₹1.1 Cr
      · Ayesha Khan   Villa   ₹2.4 Cr
      · Dev Patel     2 BHK   ₹72 L`,
  },
  {
    label: "Lead intelligence",
    code: `Rohan Mehta                Score 82
Temperature                Hot
Stage                      Site visit

Why: two visits in 10 days, asked
for the payment plan, budget fits
Tower B inventory.`,
  },
  {
    label: "Forecast",
    code: `Pipeline this quarter
Negotiation      ₹4.8 Cr
Site visit       ₹9.2 Cr
Proposal         ₹6.1 Cr

Weighted forecast ₹7.3 Cr`,
  },
];

const features = [
  {
    title: "Copilot",
    description: "Ask about your leads, deals and team in plain language.",
  },
  {
    title: "Customer summary",
    description: "A buyer's whole history condensed before you call.",
  },
  {
    title: "Email generator",
    description: "Follow-ups written from the lead's own requirements.",
  },
  {
    title: "Proposal generator",
    description: "Unit, pricing and payment plan drafted into a proposal.",
  },
];

const codeAnimationStyles = `
  .dev-code-line {
    opacity: 0;
    transform: translateX(-8px);
    animation: devLineReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  
  @keyframes devLineReveal {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .dev-code-char {
    opacity: 0;
    filter: blur(8px);
    animation: devCharReveal 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  
  @keyframes devCharReveal {
    to {
      opacity: 1;
      filter: blur(0);
    }
  }
`;

export function AiSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);



  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="ai" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: codeAnimationStyles }} />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              AI workspace
            </span>
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-8">
              Know who to call.
              <br />
              <span className="text-muted-foreground">Know what to say.</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Six AI tools that read your own CRM data: scores and temperature on every lead,
              summaries before each call, forecasts from the live pipeline, and drafts your agents
              can send.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 50 + 200}ms` }}
                >
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right: Code block */}
          <div
            className={`lg:sticky lg:top-32 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-foreground/10">
              {/* Tabs */}
              <div className="flex items-center border-b border-foreground/10">
                {codeExamples.map((example, idx) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-6 py-4 text-sm font-mono transition-colors relative ${
                      activeTab === idx
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {example.label}
                    {activeTab === idx && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
                    )}
                  </button>
                ))}
                <div className="flex-1" />

              </div>
              
              {/* Code content */}
              <div className="p-8 font-mono text-sm bg-foreground/[0.01] min-h-[220px]">
                <pre className="text-foreground/80">
                  {codeExamples[activeTab].code.split('\n').map((line, lineIndex) => (
                    <div 
                      key={`${activeTab}-${lineIndex}`} 
                      className="leading-loose dev-code-line"
                      style={{ animationDelay: `${lineIndex * 80}ms` }}
                    >
                      <span className="inline-flex">
                        {line.split('').map((char, charIndex) => (
                          <span
                            key={`${activeTab}-${lineIndex}-${charIndex}`}
                            className="dev-code-char"
                            style={{
                              animationDelay: `${lineIndex * 80 + charIndex * 15}ms`,
                            }}
                          >
                            {char === ' ' ? '\u00A0' : char}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>
            
            <p className="mt-6 font-mono text-xs text-muted-foreground">
              Illustrative examples with sample data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
