import React from 'react';
import { motion } from 'motion/react';
import { Headphones, Play } from 'lucide-react';

interface SplashScreenProps {
    onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => {
    return (
        <div className="w-full h-full min-h-[750px] relative flex flex-col justify-between overflow-hidden bg-[#13121b] select-none text-white">
            {/* Background radial atmosphere matching Nocturne Audio theme */}
            <div
                className="absolute inset-0 pointer-events-none -z-10"
                style={{
                    background: 'radial-gradient(circle at 50% 35%, rgba(124, 58, 237, 0.22) 0%, rgba(19, 18, 27, 0.95) 70%, #13121b 100%)'
                }}
            />

            {/* Center Brand Logo Section */}
            <motion.main
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex-1 flex flex-col items-center justify-center -mt-8 px-6 text-center"
            >
                {/* Headphone SVG icon with violet drop shadow */}
                <div className="mb-5 relative">
                    <div className="absolute inset-0 rounded-full bg-[#7c3aed]/30 blur-2xl transform scale-125 pointer-events-none"></div>
                    <div className="w-20 h-20 text-[#d2bbff] relative flex items-center justify-center filter drop-shadow-[0_4px_24px_rgba(210,187,255,0.45)]">
                        <Headphones className="w-20 h-20 stroke-[1.5] text-[#d2bbff]" />
                    </div>
                </div>

                {/* Stylized "WISE" Typography Logo */}
                <h1
                    className="text-white font-keania font-extrabold text-[46px] leading-none tracking-widest uppercase drop-shadow-md mb-2"
                    style={{
                        textShadow: '0 0 24px rgba(208, 188, 255, 0.45)'
                    }}
                >
                    WISE
                </h1>
                <p className="text-xs uppercase tracking-[0.3em] text-[#c7bfff]/70 font-semibold font-sans">
                    Offline Music Player
                </p>
            </motion.main>

            {/* Bottom Slogan Section */}
            <motion.footer
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="w-full pb-8 px-8 flex flex-col items-center z-20"
            >
                {/* Title: "Set The Tone" with underlined divider */}
                <div className="w-full max-w-[340px] flex flex-col items-center">
                    <h2 className="text-white font-script text-[42px] leading-tight font-medium tracking-wide text-center drop-shadow">
                        Set The Tone
                    </h2>

                    {/* Horizontal Crisp Gradient Underline */}
                    <div
                        className="w-full h-[1.5px] mt-1 mb-2 opacity-95"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(208, 188, 255, 0.8) 30%, #ffffff 50%, rgba(208, 188, 255, 0.8) 70%, transparent 100%)'
                        }}
                    />

                    {/* Tagline: "Listen anywhere, anytime!" */}
                    <p className="text-[#9e9aaf] text-[18px] tracking-tight font-sans font-light text-center">
                        Listen anywhere, anytime!
                    </p>

                    {/* Enter Player CTA Button */}
                    <button
                        onClick={onEnter}
                        className="mt-7 w-full py-3.5 px-6 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/40 transition-all cursor-pointer"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Start Listening</span>
                    </button>
                </div>

                {/* iOS Home Indicator */}
                <div className="mt-8 w-32 h-1 bg-white/30 rounded-full"></div>
            </motion.footer>
        </div>
    );
};