import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function ParticleEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const createParticles = useCallback((x: number, y: number) => {
    const count = 8 + Math.floor(Math.random() * 6);
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 3;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        size: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: 1,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only trigger on empty space clicks (body, main containers)
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' || target.closest('button') || target.closest('a') ||
          target.closest('input') || target.closest('textarea') || target.closest('.arco-select')) {
        return;
      }
      createParticles(e.clientX, e.clientY);
    };
    window.addEventListener('click', handleClick);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      const alive: Particle[] = [];

      for (const p of particles) {
        const newP = {
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.05,
          vx: p.vx * 0.99,
          life: p.life + 1,
          opacity: 1 - p.life / p.maxLife,
        };

        if (newP.life < newP.maxLife) {
          alive.push(newP);
          ctx.save();
          ctx.globalAlpha = newP.opacity;
          ctx.fillStyle = newP.color;
          ctx.beginPath();
          ctx.arc(newP.x, newP.y, newP.size * (1 - newP.life / newP.maxLife * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      particlesRef.current = alive;
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [createParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
