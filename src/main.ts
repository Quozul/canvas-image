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

    listenMouseMove(this.canvas, this.fixOffsets.bind(this), (x: number, y: number, zoomLevel: number) => {
      if (!this.context || !this.source) return;

      const newZoomFactor = this.zoomFactor * zoomLevel;

      const newDisplayedWidth = this.source.width * newZoomFactor;
      const newDisplayedHeight = this.source.height * newZoomFactor;

      const currentWidth = this.displayWidth;
      const currentHeight = this.displayHeight;

      const additionalWidth = newDisplayedWidth - currentWidth;
      const additionalHeight = newDisplayedHeight - currentHeight;

      this.zoomFactor = newZoomFactor;
      this.calculateImageZoom();

      const imageX = x - this.offsetX;
      const imageY = y - this.offsetY;

      const centerPercentX = imageX / currentWidth;
      const centerPercentY = imageY / currentHeight;
      this.fixOffsets(-additionalWidth * centerPercentX, -additionalHeight * centerPercentY);
    });
  }

  disconnectedCallback() {
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
    }
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "src") {
      this.loadImage(newValue);
      this.calculateImageZoom(true);
    }
  }

  private fixOffsets(x: number, y: number) {
    if (!this.context) return;
    this.offsetX = Math.max(-this.displayWidth + 10, Math.min(this.offsetX + x, this.context.canvas.width - 10));
    this.offsetY = Math.max(-this.displayHeight + 10, Math.min(this.offsetY + y, this.context.canvas.height - 10));
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
