import { loadImagePromise } from "./loadImage.ts";

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
  private evCache: PointerEvent[] = [];
  private previousDistance = -1;
  private maxZoom: number = 1;
  private minZoom: number = 1;

  constructor() {
    super();
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = "canvas{width:100%;height:100%;touch-action:none;box-sizing:border-box;}";
    shadow.appendChild(style);

    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    shadow.appendChild(this.canvas);

    const resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.calculateImageZoom(true);
    });

    this.updateCanvasSize();

    resizeObserver.observe(this.canvas);
    this.loadImage();
    window.requestAnimationFrame(this.draw);
    this.initEvents(this.canvas);
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

  private initEvents(element: HTMLCanvasElement) {
    const handleMove = (event: PointerEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const index = this.evCache.findIndex((cachedEv) => cachedEv.pointerId === event.pointerId);
      if (index === -1) return;

      if (this.evCache.length === 2) {
        const currentDistance = calculateTouchDistance(this.evCache);
        const zoomLevel = currentDistance / this.previousDistance;
        this.handleZoom(event.clientX - element.clientLeft, event.clientY - element.clientTop, zoomLevel);
        this.previousDistance = currentDistance;
      }

      const previousPointerEvent = this.evCache[index];
      const offsetX = (event.clientX - previousPointerEvent.clientX) / this.evCache.length;
      const offsetY = (event.clientY - previousPointerEvent.clientY) / this.evCache.length;
      this.fixOffsets(offsetX, offsetY);

      this.evCache[index] = event;
    };

    const handleStart = (event: PointerEvent) => {
      handleMove(event);
      this.evCache.push(event);
      this.previousDistance = calculateTouchDistance(this.evCache);
      element.setPointerCapture(event.pointerId);
    };

    const handleEnd = (event: PointerEvent) => {
      const index = this.evCache.findIndex((cachedEv) => cachedEv.pointerId === event.pointerId);
      if (index === -1) return;
      this.evCache.splice(index, 1);
      element.releasePointerCapture(event.pointerId);
    };

    const handleWheel = (event: WheelEvent) => {
      const delta = event.deltaY;
      const zoomLevel = delta > 0 ? 0.9 : 1.1;

      const mouseX = event.clientX - element.clientLeft;
      const mouseY = event.clientY - element.clientTop;

      this.handleZoom(mouseX, mouseY, zoomLevel);
    };

    element.addEventListener("pointerdown", handleStart);
    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerup", handleEnd);
    element.addEventListener("pointercancel", handleEnd);
    element.addEventListener("pointerout", handleEnd);
    element.addEventListener("pointerleave", handleEnd);
    element.addEventListener("wheel", handleWheel);
  }

  private calculateImageZoom(forceCenter: boolean = false) {
    if (!this.context || !this.source) return;

    if (forceCenter) {
      this.minZoom = this.zoomFactor = Math.min(
        this.context.canvas.width / this.source.width,
        this.context.canvas.height / this.source.height,
      );

      this.minZoom *= 0.9;
      this.maxZoom = 10;
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

    this.context.imageSmoothingEnabled = false;
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

  private handleZoom(x: number, y: number, zoomLevel: number) {
    if (!this.source) return;

    const newZoomFactor = between(this.zoomFactor * zoomLevel, this.minZoom, this.maxZoom);

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
  }

  private async loadImage(src: string | null = this.getAttribute("src")) {
    if (!src) {
      this.source = null;
      return;
    }
    this.source = await loadImagePromise(src);
    this.calculateImageZoom(true);
  }

  private fixOffsets(x: number, y: number) {
    if (!this.context) return;
    this.offsetX = between(this.offsetX + x, -this.displayWidth / 2, this.context.canvas.width - this.displayWidth / 2);
    this.offsetY = between(
      this.offsetY + y,
      -this.displayHeight / 2,
      this.context.canvas.height - this.displayHeight / 2,
    );
  }

  private updateCanvasSize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }
}

customElements.define("canvas-image", CanvasImage);

const calculateTouchDistance = (evCache: PointerEvent[]) => {
  if (evCache.length === 2) {
    const touch1 = evCache[0];
    const touch2 = evCache[1];
    return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
  }
  return 0;
};

const between = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));
