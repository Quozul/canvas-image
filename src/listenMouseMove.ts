export function listenMouseMove(element: HTMLElement, callback: (deltaX: number, deltaY: number) => void) {
  let isDown = false,
    startX = 0,
    startY = 0;

  const handleMove = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    const touch = "touches" in event ? event.touches[0] : event;
    if (isDown) {
      const offsetX = startX - touch.clientX;
      const offsetY = startY - touch.clientY;
      callback(offsetX, offsetY);
    }
    startX = touch.clientX;
    startY = touch.clientY;
  };

  const handleStart = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    handleMove(event);
    isDown = true;
  };

  const handleEnd = () => {
    isDown = false;
  };

  element.addEventListener("mousedown", handleStart);
  element.addEventListener("touchstart", handleStart);
  element.addEventListener("mousemove", handleMove);
  element.addEventListener("touchmove", handleMove);
  element.addEventListener("mouseup", handleEnd);
  element.addEventListener("mouseleave", handleEnd);
  element.addEventListener("touchend", handleEnd);
  element.addEventListener("touchcancel", handleEnd);

  return () => {
    element.removeEventListener("mousedown", handleStart);
    element.removeEventListener("touchstart", handleStart);
    element.removeEventListener("mousemove", handleMove);
    element.removeEventListener("touchmove", handleMove);
    element.removeEventListener("mouseup", handleEnd);
    element.removeEventListener("mouseleave", handleEnd);
    element.removeEventListener("touchend", handleEnd);
    element.removeEventListener("touchcancel", handleEnd);
  };
}
