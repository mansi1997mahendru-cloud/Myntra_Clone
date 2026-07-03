import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Carrot, ShoppingBag, ArrowRight } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Fast grocery delivery",
      description: "Get your groceries delivered to your doorstep in just 10 minutes. Fast, reliable, and convenient.",
      icon: Truck,
      color: "bg-amber-100 text-amber-600",
      accent: "text-amber-500",
      bgGradient: "from-amber-500 to-yellow-400"
    },
    {
      title: "Fresh fruits and vegetables",
      description: "Sourced directly from local farms. Handpicked to ensure you receive the finest quality produce.",
      icon: Carrot,
      color: "bg-emerald-100 text-emerald-600",
      accent: "text-emerald-500",
      bgGradient: "from-emerald-600 to-teal-500"
    },
    {
      title: "Daily essentials delivered quickly",
      description: "Milk, bread, eggs, and all your household essentials delivered within minutes whenever you need them.",
      icon: ShoppingBag,
      color: "bg-rose-100 text-rose-600",
      accent: "text-rose-500",
      bgGradient: "from-rose-500 to-pink-500"
    }
  ];

  const handleFinishOnboarding = () => {
    // Save onboarding completion status to localStorage
    localStorage.setItem('has_seen_onboarding', 'true');
    navigate('/login');
  };

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    }
  };

  const IconComponent = slides[activeSlide].icon;
  const isLastSlide = activeSlide === slides.length - 1;

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center items-center px-4">
      {/* Mobile Scaffold Container */}
      <div className="w-full max-w-md min-h-screen md:min-h-0 md:h-[650px] bg-white shadow-2xl relative flex flex-col justify-between p-6 border-x border-neutral-200 md:border md:rounded-3xl">
        
        {/* Top Header Row (Skip Button) */}
        <div className="flex justify-end pt-2 min-h-[32px]">
          {!isLastSlide && (
            <button 
              onClick={handleFinishOnboarding}
              className="text-xs font-black text-neutral-400 hover:text-neutral-600 tracking-wider uppercase transition-colors"
            >
              Skip
            </button>
          )}
        </div>

        {/* Carousel Content */}
        <div className="my-auto space-y-8 py-8 text-center">
          {/* Illustration Container */}
          <div className="flex justify-center">
            <div className={`h-32 w-32 rounded-full ${slides[activeSlide].color} flex items-center justify-center shadow-inner transition-all duration-300 transform hover:scale-105`}>
              <IconComponent className="h-16 w-16 stroke-[1.75]" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3 px-4">
            <h2 className="text-2xl font-black text-neutral-800 tracking-tight leading-tight transition-all duration-350">
              {slides[activeSlide].title}
            </h2>
            <p className="text-xs text-neutral-500 font-semibold leading-relaxed transition-all duration-350">
              {slides[activeSlide].description}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 pt-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === idx ? 'w-6 bg-yellow-400' : 'w-2 bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="pb-6">
          {isLastSlide ? (
            <button
              onClick={handleFinishOnboarding}
              className="w-full py-4 text-white font-black rounded-2xl shadow-md flex justify-center items-center space-x-2 active:scale-95 transition-transform bg-gradient-to-r from-emerald-600 to-teal-500"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={`w-full py-4 text-white font-black rounded-2xl shadow-md flex justify-center items-center space-x-2 active:scale-95 transition-transform bg-gradient-to-r ${slides[activeSlide].bgGradient}`}
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
