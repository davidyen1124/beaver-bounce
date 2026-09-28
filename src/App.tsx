import { useEffect, useRef } from "react";

const DESKTOP_SPEED = { x: 235, y: 180, rotation: 65 };
const REDUCED_SPEED = { x: 85, y: 65, rotation: 16 };
const EDGE_BLEED = 2;
const BACKGROUND_COLORS = [
  "#f45a3d",
  "#ed5a76",
  "#a36bb8",
  "#4c8dca",
  "#2fa89b",
] as const;

// Convex hull of the visible pixels in beaver.png, normalized to its cropped
// artwork bounds. Collision against this silhouette avoids the empty corners
// created by a rotating rectangular image box.
const BEAVER_HULL = [
  [0, 0.3559],
  [0.0204, 0.3057],
  [0.1597, 0.0548],
  [0.2004, 0.0175],
  [0.2208, 0.0117],
  [0.6635, 0.0035],
  [0.7053, 0.0385],
  [0.9839, 0.5554],
  [1, 0.6173],
  [0.9925, 0.6861],
  [0.9625, 0.7503],
  [0.9175, 0.8016],
  [0.6377, 0.9965],
  [0.2101, 0.9942],
  [0.1715, 0.9627],
  [0.0332, 0.6651],
  [0.0236, 0.6266],
] as const;

export default function App() {
  const stageRef = useRef<HTMLElement>(null);
  const beaverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const beaver = beaverRef.current;

    if (!stage || !beaver) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const speed = reducedMotion ? REDUCED_SPEED : DESKTOP_SPEED;
    const motion = {
      centerX: 0,
      centerY: 0,
      velocityX: speed.x,
      velocityY: speed.y,
      angle: -8,
      rotationSpeed: speed.rotation,
      previousTime: 0,
    };
    let frame = 0;
    let backgroundIndex = 0;
    let lastColorChangeTime = Number.NEGATIVE_INFINITY;

    const measure = (angle: number) => {
      const stageBounds = stage.getBoundingClientRect();
      const width = beaver.offsetWidth;
      const height = beaver.offsetHeight;
      const radians = (angle * Math.PI) / 180;
      const cosine = Math.cos(radians);
      const sine = Math.sin(radians);
      let minOffsetX = Number.POSITIVE_INFINITY;
      let maxOffsetX = Number.NEGATIVE_INFINITY;
      let minOffsetY = Number.POSITIVE_INFINITY;
      let maxOffsetY = Number.NEGATIVE_INFINITY;

      for (const [normalizedX, normalizedY] of BEAVER_HULL) {
        const localX = (normalizedX - 0.5) * width;
        const localY = (normalizedY - 0.5) * height;
        const rotatedX = localX * cosine - localY * sine;
        const rotatedY = localX * sine + localY * cosine;

        minOffsetX = Math.min(minOffsetX, rotatedX);
        maxOffsetX = Math.max(maxOffsetX, rotatedX);
        minOffsetY = Math.min(minOffsetY, rotatedY);
        maxOffsetY = Math.max(maxOffsetY, rotatedY);
      }

      return {
        width,
        height,
        minX: -minOffsetX - EDGE_BLEED,
        maxX: stageBounds.width - maxOffsetX + EDGE_BLEED,
        minY: -minOffsetY - EDGE_BLEED,
        maxY: stageBounds.height - maxOffsetY + EDGE_BLEED,
      };
    };

    const render = (width: number, height: number) => {
      const x = motion.centerX - width / 2;
      const y = motion.centerY - height / 2;
      beaver.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${motion.angle}deg)`;
    };

    const placeInitially = () => {
      const { width, height, minX, maxX, minY, maxY } = measure(
        motion.angle,
      );
      motion.centerX = minX + (maxX - minX) * 0.18;
      motion.centerY = minY + (maxY - minY) * 0.24;
      render(width, height);
      beaver.dataset.ready = "true";
    };

    const animate = (time: number) => {
      if (!motion.previousTime) motion.previousTime = time;
      const delta = Math.min((time - motion.previousTime) / 1000, 0.04);
      motion.previousTime = time;

      motion.centerX += motion.velocityX * delta;
      motion.centerY += motion.velocityY * delta;
      motion.angle = (motion.angle + motion.rotationSpeed * delta) % 360;
      const { width, height, minX, maxX, minY, maxY } = measure(
        motion.angle,
      );
      let bounced = false;

      if (motion.centerX <= minX) {
        motion.centerX = minX;
        motion.velocityX = Math.abs(motion.velocityX);
        bounced = true;
      } else if (motion.centerX >= maxX) {
        motion.centerX = maxX;
        motion.velocityX = -Math.abs(motion.velocityX);
        bounced = true;
      }

      if (motion.centerY <= minY) {
        motion.centerY = minY;
        motion.velocityY = Math.abs(motion.velocityY);
        bounced = true;
      } else if (motion.centerY >= maxY) {
        motion.centerY = maxY;
        motion.velocityY = -Math.abs(motion.velocityY);
        bounced = true;
      }

      if (bounced && time - lastColorChangeTime > 200) {
        backgroundIndex = (backgroundIndex + 1) % BACKGROUND_COLORS.length;
        lastColorChangeTime = time;
        document.documentElement.style.setProperty(
          "--screen-color",
          BACKGROUND_COLORS[backgroundIndex],
        );
        stage.dataset.background = String(backgroundIndex);
      }

      render(width, height);
      frame = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      const { width, height, minX, maxX, minY, maxY } = measure(
        motion.angle,
      );
      motion.centerX = Math.min(Math.max(motion.centerX, minX), maxX);
      motion.centerY = Math.min(Math.max(motion.centerY, minY), maxY);
      render(width, height);
    };

    const handleVisibility = () => {
      motion.previousTime = performance.now();
    };

    placeInitially();
    document.documentElement.style.setProperty(
      "--screen-color",
      BACKGROUND_COLORS[0],
    );
    stage.dataset.background = "0";
    frame = requestAnimationFrame(animate);
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--screen-color");
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <main
      ref={stageRef}
      className="screensaver"
      aria-label="A beaver in a swim ring bouncing around the screen"
    >
      <div ref={beaverRef} className="beaver" aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}beaver.png`}
          alt=""
          draggable={false}
        />
      </div>
    </main>
  );
}
