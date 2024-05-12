export function loadImagePromise(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.addEventListener("load", function () {
      resolve(image);
    });

    image.src = src;
  });
}
