export function listenMouseMove(
  element: HTMLElement,
  callback: (deltaX: number, deltaY: number) => void,
  zoomCallback: (x: number, y: number, zoomLevel: number) => void,
) {
  const evCache: PointerEvent[] = [];
  let previousDistance = -1;

  const calculateTouchDistance = () => {
    if (evCache.length === 2) {
      const touch1 = evCache[0];
      const touch2 = evCache[1];
      return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
    }
    return 0;
  };

  const handleMove = (event: PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === event.pointerId);
    if (index === -1) return;
    const previousPointerEvent = evCache[index];

    if (evCache.length === 2) {
      // Calculate the distance between the two pointers
      const currentDistance = calculateTouchDistance();
      const zoomLevel = currentDistance / previousDistance;

      const mouseX = event.clientX - element.clientLeft;
      const mouseY = event.clientY - element.clientTop;

      zoomCallback(mouseX, mouseY, zoomLevel);
      previousDistance = currentDistance;
    }

    const offsetX = (event.clientX - previousPointerEvent.clientX) / evCache.length;
    const offsetY = (event.clientY - previousPointerEvent.clientY) / evCache.length;
    callback(offsetX, offsetY);

    evCache[index] = event;
  };

  const handleStart = (event: PointerEvent) => {
    handleMove(event);
    evCache.push(event);
    previousDistance = calculateTouchDistance();
    element.setPointerCapture(event.pointerId);
  };

  const handleEnd = (event: PointerEvent) => {
    const index = evCache.findIndex((cachedEv) => cachedEv.pointerId === event.pointerId);
    evCache.splice(index, 1);
    element.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: WheelEvent) => {
    const delta = event.deltaY;
    const zoomLevel = delta > 0 ? 0.9 : 1.1;

    const mouseX = event.clientX - element.clientLeft;
    const mouseY = event.clientY - element.clientTop;

    zoomCallback(mouseX, mouseY, zoomLevel);
  };

  element.addEventListener("pointerdown", handleStart);
  element.addEventListener("pointermove", handleMove);
  element.addEventListener("pointerup", handleEnd);
  element.addEventListener("pointercancel", handleEnd);
  element.addEventListener("pointerout", handleEnd);
  element.addEventListener("pointerleave", handleEnd);
  element.addEventListener("wheel", handleWheel);
}
