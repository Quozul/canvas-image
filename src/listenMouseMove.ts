export function listenMouseMove(element: HTMLElement, callback: (deltaX: number, deltaY: number) => void) {
  let previousPointerEvent: PointerEvent | null = null;

  const handleMove = (event: PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (event.pointerId === previousPointerEvent?.pointerId) {
      const offsetX = previousPointerEvent.clientX - event.clientX;
      const offsetY = previousPointerEvent.clientY - event.clientY;

      callback(offsetX, offsetY);
      previousPointerEvent = event;
    }
  };

  const handleStart = (event: PointerEvent) => {
    handleMove(event);
    previousPointerEvent = event;
  };

  const handleEnd = () => {
    previousPointerEvent = null;
  };

  element.addEventListener("pointerdown", handleStart);
  element.addEventListener("pointermove", handleMove);
  element.addEventListener("pointerup", handleEnd);
  element.addEventListener("pointercancel", handleEnd);
  element.addEventListener("pointerout", handleEnd);
  element.addEventListener("pointerleave", handleEnd);
}
