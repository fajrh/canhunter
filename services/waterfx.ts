// waterfx.ts
import type { Vector2 } from "../types";

type Dim = { width: number; height: number };

export class WaterFX {
  private tileA: HTMLCanvasElement;
  private tileB: HTMLCanvasElement;

  constructor(private baseHue = 208 /*blue-ish*/, private foam = true) {
    this.tileA = document.createElement("canvas");
    this.tileB = document.createElement("canvas");
    this.buildTiles();
  }

  private buildTiles() {
    const W = (this.tileA.width = this.tileB.width = 256);
    const H = (this.tileA.height = this.tileB.height = 256);

    // Tile A: soft blue gradient + diagonal bands (slow)
    {
      const ctx = this.tileA.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `hsl(${this.baseHue}, 55%, 26%)`);
      g.addColorStop(1, `hsl(${this.baseHue}, 60%, 36%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // subtle caustic lines
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = `hsla(${this.baseHue + 20}, 85%, 80%, 0.8)`;
      ctx.lineWidth = 1.2;
      for (let i = -W; i < W * 2; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Tile B: high-frequency ripple dots (fast)
    {
      const ctx = this.tileB.getContext("2d")!;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let y = 0; y < H; y += 4) {
        for (let x = 0; x < W; x += 4) {
          // pseudo-random jitter for sparkle
          const j = Math.sin(x * 0.3) * Math.cos(y * 0.27);
          const a = 0.05 + (j + 1) * 0.05;
          ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  }

  /** Draw one polygon water body with animated effect */
  drawWaterBody(
    ctx: CanvasRenderingContext2D,
    poly: Vector2[],
    camera: Vector2,
    canvasDim: Dim,
    timeMs: number,
    fillTint?: string
  ) {
    // Build world->screen path (clip area for water)
    ctx.save();
    ctx.beginPath();
    poly.forEach((p, i) => {
      const sx = p.x - camera.x + canvasDim.width / 2;
      const sy = p.y - camera.y + canvasDim.height / 2;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.closePath();

    // Fill with an opaque base color first to ensure visibility
    ctx.fillStyle = 'rgba(100, 150, 220, 0.8)'; // A solid, visible blue
    ctx.fill();

    ctx.clip(); // Clip subsequent effects to this path


    // Parallax UV scroll speeds (tweak for “RuneScape-y” flow)
    const t = timeMs / 1000;
    const scrollA = { x: t * 18, y: t * -9 };  // slow
    const scrollB = { x: t * -42, y: t * 25 }; // fast, opposite dir

    // Apply two tiled layers with different rotations (fake normal parallax)
    this.fillTiled(ctx, this.tileA, scrollA.x, scrollA.y, 18 * Math.PI / 180, 0.85, fillTint);
    this.fillTiled(ctx, this.tileB, scrollB.x, scrollB.y, -12 * Math.PI / 180, 1.0);

    // Specular sweep (fake sun glint)
    const sweepY = ((t * 40) % (canvasDim.height * 2)) - canvasDim.height;
    const grad = ctx.createLinearGradient(0, sweepY - 80, 0, sweepY + 80);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.08)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasDim.width, canvasDim.height);
    ctx.globalCompositeOperation = "source-over";

    ctx.restore();

    // Animated shoreline foam along the polygon edge
    if (this.foam) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -timeMs / 100; // moves foam
      ctx.beginPath();
      poly.forEach((p, i) => {
        const sx = p.x - camera.x + canvasDim.width / 2;
        const sy = p.y - camera.y + canvasDim.height / 2;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  private fillTiled(
    ctx: CanvasRenderingContext2D,
    tile: HTMLCanvasElement,
    offX: number,
    offY: number,
    rotationRad: number,
    alpha = 1,
    tint?: string
  ) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // rotate the pattern space (so layers “criss-cross”)
    const cx = 0, cy = 0;
    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);
    ctx.translate(-cx, -cy);

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // draw tiles across the whole viewport with scrolling offset
    const TW = tile.width;
    const TH = tile.height;
    const x0 = Math.floor((-offX % TW) - TW);
    const y0 = Math.floor((-offY % TH) - TH);

    if (tint) {
      // optional tint pass (multiply-like)
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = tint;
      ctx.fillRect(-w, -h, w * 3, h * 3);
      ctx.globalCompositeOperation = "source-over";
    }

    for (let y = y0; y < h + TH; y += TH) {
      for (let x = x0; x < w + TW; x += TW) {
        ctx.drawImage(tile, x + offX, y + offY);
      }
    }
    ctx.restore();
  }
}