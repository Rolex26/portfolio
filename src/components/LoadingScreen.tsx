import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoadingScreenProps {
    progress: number;
    isLoaded: boolean;
}

export default function LoadingScreen({ progress, isLoaded }: LoadingScreenProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (isLoaded && !hasAnimated.current) {
            hasAnimated.current = true;
            gsap.to(overlayRef.current, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => {
                    if (overlayRef.current) {
                        overlayRef.current.style.pointerEvents = 'none';
                        overlayRef.current.style.display = 'none';
                    }
                }
            });
        }
    }, [isLoaded]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
        >
            <p className="text-white text-sm uppercase tracking-[0.3em] mb-8 font-semibold opacity-60">
                Loading Experience
            </p>

            {/* Progress bar container */}
            <div className="w-48 h-[2px] bg-gray-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.round(progress)}%` }}
                />
            </div>

            <p className="text-gray-500 text-xs mt-4 font-mono">
                {Math.round(progress)}%
            </p>
        </div>
    );
}
