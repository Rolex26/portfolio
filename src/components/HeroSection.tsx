import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import LoadingScreen from "./LoadingScreen";
import "./HeroSection.css";

gsap.registerPlugin(ScrollTrigger);

interface SequenceConfig {
    folder: string;
    frameCount: number;
    sectionId: string;
}

const sequences: SequenceConfig[] = [
    { folder: "s1", frameCount: 240, sectionId: "#section-1" },
    { folder: "s2", frameCount: 240, sectionId: "#section-2" },
    { folder: "s3", frameCount: 240, sectionId: "#section-3" },
];

const pad = (number: number, length: number) => {
    let str = "" + number;
    while (str.length < length) str = "0" + str;
    return str;
};

/**
 * Load a batch of images and report progress.
 * Returns an array of loaded HTMLImageElement.
 */
function loadSequenceImages(
    seq: SequenceConfig,
    onProgress?: (loaded: number, total: number) => void
): Promise<HTMLImageElement[]> {
    return new Promise((resolve) => {
        const images: HTMLImageElement[] = [];
        let loaded = 0;

        for (let i = 1; i <= seq.frameCount; i++) {
            const img = new Image();
            img.src = `/sequence/${seq.folder}/ezgif-frame-${pad(i, 3)}.jpg`;
            img.onload = img.onerror = () => {
                loaded++;
                onProgress?.(loaded, seq.frameCount);
                if (loaded === seq.frameCount) {
                    resolve(images);
                }
            };
            images.push(img);
        }
    });
}

export default function HeroSection() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Store mutable refs for animation state
    const allImagesRef = useRef<HTMLImageElement[][]>([[], [], []]);
    const currentSeqIndexRef = useRef(0);
    const currentFrameIndexRef = useRef(0);

    const drawImageProp = useCallback(
        (ctx: CanvasRenderingContext2D, img: HTMLImageElement, offsetX = 0.5, offsetY = 0.5) => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            let iw = img.width,
                ih = img.height,
                r = Math.min(w / iw, h / ih),
                nw = iw * r,
                nh = ih * r,
                cx, cy, cw, ch, ar = 1;

            if (nw < w) ar = w / nw;
            if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
            nw *= ar;
            nh *= ar;

            cw = iw / (nw / w);
            ch = ih / (nh / h);
            cx = (iw - cw) * offsetX;
            cy = (ih - ch) * offsetY;

            if (cx < 0) cx = 0;
            if (cy < 0) cy = 0;
            if (cw > iw) cw = iw;
            if (ch > ih) ch = ih;

            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, cx, cy, cw, ch, 0, 0, w, h);
        },
        []
    );

    useEffect(() => {
        // 1. Initialize Lenis
        const lenis = new Lenis({
            duration: 1.2,
            smoothWheel: true,
            syncTouch: true,
        });

        lenis.on("scroll", ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0, 0);

        // 2. Setup Canvas
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        const render = () => {
            const seqIndex = currentSeqIndexRef.current;
            const frameIndex = currentFrameIndexRef.current;
            const images = allImagesRef.current[seqIndex];
            if (!images || !images[frameIndex]) return;
            const img = images[frameIndex];
            if (img.complete && img.naturalWidth > 0) {
                drawImageProp(context, img);
            }
        };

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + "px";
            canvas.style.height = window.innerHeight + "px";
            context.resetTransform();
            context.scale(dpr, dpr);
            render();
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        // 3. Progressive Loading — load s1 first, then s2 & s3 in background
        let cancelled = false;

        (async () => {
            // Phase 1: Load s1 with progress reporting
            const s1Images = await loadSequenceImages(sequences[0], (loaded, total) => {
                if (!cancelled) setLoadingProgress((loaded / total) * 100);
            });

            if (cancelled) return;

            allImagesRef.current[0] = s1Images;
            setIsLoaded(true);

            // Draw first frame immediately
            if (s1Images[0]?.complete) {
                drawImageProp(context, s1Images[0]);
            }

            // Phase 2: Load s2 and s3 in the background (no progress bar needed)
            const s2Images = await loadSequenceImages(sequences[1]);
            if (cancelled) return;
            allImagesRef.current[1] = s2Images;

            const s3Images = await loadSequenceImages(sequences[2]);
            if (cancelled) return;
            allImagesRef.current[2] = s3Images;
        })();

        // 4. GSAP Frame Triggers
        const triggers: ScrollTrigger[] = [];

        sequences.forEach((seq, index) => {
            const obj = { frame: 0 };
            const trigger = gsap.to(obj, {
                frame: seq.frameCount - 1,
                snap: "frame",
                ease: "none",
                scrollTrigger: {
                    trigger: seq.sectionId,
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.5,
                    onUpdate: () => {
                        currentSeqIndexRef.current = index;
                        currentFrameIndexRef.current = Math.round(obj.frame);
                        render();
                    },
                },
            });
            if (trigger.scrollTrigger) triggers.push(trigger.scrollTrigger);
        });

        // 5. GSAP Text Fades
        gsap.set("#text-1", { opacity: 1 });

        sequences.forEach((seq, index) => {
            const trigger = ScrollTrigger.create({
                trigger: seq.sectionId,
                start: "top 60%",
                end: "bottom 60%",
                onEnter: () => gsap.to(`#text-${index + 1}`, { opacity: 1, duration: 1, ease: "power2.out" }),
                onLeave: () => gsap.to(`#text-${index + 1}`, { opacity: 0, duration: 1, ease: "power2.out" }),
                onEnterBack: () => gsap.to(`#text-${index + 1}`, { opacity: 1, duration: 1, ease: "power2.out" }),
                onLeaveBack: () => {
                    if (index !== 0) gsap.to(`#text-${index + 1}`, { opacity: 0, duration: 1, ease: "power2.out" });
                },
            });
            triggers.push(trigger);
        });

        // Cleanup — only kill this component's own triggers
        return () => {
            cancelled = true;
            window.removeEventListener("resize", resizeCanvas);
            lenis.destroy();
            triggers.forEach(t => t.kill());
        };
    }, [drawImageProp]);

    return (
        <>
            <LoadingScreen progress={loadingProgress} isLoaded={isLoaded} />
            <div ref={containerRef} className="hero-container">
                <div className="canvas-container relative h-[auto]">
                    <canvas ref={canvasRef} id="hero-canvas"></canvas>
                </div>

                <div className="fixed-text-container">
                    <div className="text-container fixed-text" id="text-1">
                        <h2>Hello! I'm Sabarish</h2>
                        <p>Welcome to my portfolio. Scroll down to explore my journey and work.</p>
                    </div>
                    <div className="text-container fixed-text" id="text-2">
                        <h2>The Evolution</h2>
                        <p>Seamlessly transitioning into the next phase of innovation and sophisticated digital design.</p>
                    </div>
                    <div className="text-container fixed-text" id="text-3">
                        <h2>The Future</h2>
                        <p>Step into tomorrow with unmatched visual fidelity. The experience continues from here.</p>
                    </div>
                </div>

                <main className="scroll-content">
                    <section className="sequence-section" id="section-1"></section>
                    <section className="sequence-section" id="section-2"></section>
                    <section className="sequence-section" id="section-3"></section>
                </main>
            </div>
        </>
    );
}
