export function listenZoom(element: HTMLElement, callback: (x: number, y: number, zoomLevel: number) => void) {
  const handleZoom = (event: WheelEvent) => {
    const delta = -event.deltaY;
    const zoomLevel = delta > 0 ? 0.9 : 1.1;

    const mouseX = event.clientX - element.clientLeft;
    const mouseY = event.clientY - element.clientTop;

    callback(mouseX, mouseY, zoomLevel);
  };

  let previousDistance: number = 0;

  const calculateTouchDistance = (touches: TouchList) => {
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      return Math.sqrt(Math.pow(touch1.clientX - touch2.clientX, 2) + Math.pow(touch1.clientY - touch2.clientY, 2));
    }
    return 0;
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 2) {
      const currentDistance = calculateTouchDistance(event.touches);
      const zoomLevel = previousDistance / currentDistance;

      const touch = event.touches[0];
      callback(touch.clientX, touch.clientY, zoomLevel);
      previousDistance = currentDistance;
    }
  };

  const handleTouchStart = (event: TouchEvent) => {
    previousDistance = calculateTouchDistance(event.touches);
  };

  const handleTouchEnd = () => {
    previousDistance = 0;
  };

  element.addEventListener("touchstart", handleTouchStart);
  element.addEventListener("touchmove", handleTouchMove);
  element.addEventListener("touchend", handleTouchEnd);
  element.addEventListener("wheel", handleZoom);

  return () => {
    element.removeEventListener("touchstart", handleTouchStart);
    element.removeEventListener("touchmove", handleTouchMove);
    element.removeEventListener("touchend", handleTouchEnd);
    element.removeEventListener("wheel", handleZoom);
  };
}
