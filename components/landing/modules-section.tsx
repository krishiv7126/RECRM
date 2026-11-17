"use client";

import { useEffect, useState, useRef } from "react";

const modules = [
  { name: "Leads & inquiries", area: "Sales", note: "Capture" },
  { name: "Deals", area: "Sales", note: "Pipeline" },
  { name: "Follow-ups & site visits", area: "Sales", note: "Daily plan" },
  { name: "Properties & projects", area: "Inventory", note: "Units" },
  { name: "Customers", area: "After sale", note: "History" },
  { name: "WhatsApp & broadcasts", area: "Engage", note: "Per agent" },
  { name: "Automation", area: "Engage", note: "Rules" },
  { name: "Staff & analytics", area: "Manage", note: "Reports" },
];

export function ModulesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveModule((prev) => (prev + 1) % modules.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="modules" ref={sectionRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              Modules
            </span>
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight mb-8">
              Every desk,
              <br />
              one login.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-12">
              Sales, reception, inventory and management work from the same records. A walk-in logged
              at the front desk is in the sales pipeline, already scored, before the visitor sits down.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2">4</div>
                <div className="text-sm text-muted-foreground">Team roles</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2">6</div>
                <div className="text-sm text-muted-foreground">AI tools</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-display mb-2">8</div>
                <div className="text-sm text-muted-foreground">Core modules</div>
              </div>
            </div>
          </div>

          {/* Right: Location list */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-foreground/10">
              {/* Header */}
              <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
                <span className="text-sm font-mono text-muted-foreground">Workspace</span>
                <span className="flex items-center gap-2 text-xs font-mono text-primary">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Live, in sync
                </span>
              </div>

              {/* Locations */}
              <div>
                {modules.map((module, index) => (
                  <div
                    key={module.name}
                    className={`px-6 py-5 border-b border-foreground/5 last:border-b-0 flex items-center justify-between transition-all duration-300 ${
                      activeModule === index ? "bg-foreground/[0.02]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span 
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          activeModule === index ? "bg-foreground" : "bg-foreground/20"
                        }`}
                      />
                      <div>
                        <div className="font-medium">{module.name}</div>
                        <div className="text-sm text-muted-foreground">{module.area}</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">{module.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
