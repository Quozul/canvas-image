import { loadImagePromise } from "./loadImage.ts";
import { listenMouseMove } from "./listenMouseMove.ts";

class CanvasImage extends HTMLElement {
  static observedAttributes = ["src"];

  private source: HTMLImageElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | undefined;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private displayWidth: number = 0;
  private displayHeight: number = 0;
  private zoomFactor: number = 1;

  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      canvas {
        width: 100%;
        height: 100%;
        touch-action: none;
         box-sizing: border-box;
      }
    `;
    shadow.appendChild(style);

    console.log("Custom element added to page.");
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    shadow.appendChild(this.canvas);

    const resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.calculateImageZoom(true);
    });

    this.updateCanvasSize();

    resizeObserver.observe(this.canvas);

    if (this.context === null) return;
    this.loadImage();
    window.requestAnimationFrame(this.draw);

    listenMouseMove(
      this.canvas,
      (x, y) => {
        if (!this.context) return;
        this.offsetX += x;
        this.offsetY += y;

        if (!this.source) return;
        this.offsetX = Math.max(0, Math.min(this.offsetX, this.context.canvas.width - this.displayWidth));
        this.offsetY = Math.max(0, Math.min(this.offsetY, this.context.canvas.height - this.displayHeight));
      },
      (x: number, y: number, zoomLevel: number) => {
        if (!this.context) return;
        const zoomedX = (x / this.context.canvas.width) * this.displayWidth + this.offsetX;
        const zoomedY = (y / this.context.canvas.height) * this.displayHeight + this.offsetY;

        const newZoomedX = (x / this.context.canvas.width) * (this.displayWidth * zoomLevel) + this.offsetX;
        const newZoomedY = (y / this.context.canvas.height) * (this.displayHeight * zoomLevel) + this.offsetY;

        const zoomX = zoomedX - newZoomedX;
        const zoomY = zoomedY - newZoomedY;

        this.offsetX += zoomX;
        this.offsetY += zoomY;
        this.zoomFactor = this.zoomFactor * zoomLevel;
        this.calculateImageZoom();
      },
    );
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");

    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "src") {
      this.loadImage(newValue);
      this.calculateImageZoom(true);
    }
  }

  private calculateImageZoom(forceCenter: boolean = false) {
    if (!this.context || !this.source) return;

    if (forceCenter) {
      this.zoomFactor = Math.min(
        this.context.canvas.width / this.source.width,
        this.context.canvas.height / this.source.height,
      );
    }

    this.displayWidth = this.source.width * this.zoomFactor;
    this.displayHeight = this.source.height * this.zoomFactor;

    if (forceCenter) {
      this.offsetX = this.context.canvas.width / 2 - this.displayWidth / 2;
      this.offsetY = this.context.canvas.height / 2 - this.displayHeight / 2;
    }
  }

  private draw = () => {
    this.animationFrameId = window.requestAnimationFrame(this.draw);

    if (!this.context || !this.source) return;
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

    this.context.drawImage(
      this.source,
      0,
      0,
      this.source.width,
      this.source.height,
      this.offsetX,
      this.offsetY,
      this.displayWidth,
      this.displayHeight,
    );
  };

  private async loadImage(src: string | null = this.getAttribute("src")) {
    if (!src) {
      this.source = null;
      return;
    }
    this.source = await loadImagePromise(src);
    this.calculateImageZoom(true);
  }

  private updateCanvasSize() {
    if (!this.canvas) return;

    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }
}

customElements.define("canvas-image", CanvasImage);
