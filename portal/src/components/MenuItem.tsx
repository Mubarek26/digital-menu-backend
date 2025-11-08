import React, { useState, useRef } from "react";
import { Plus, Check } from "lucide-react";
import type { MenuItem as MenuItemType } from "../types";
import { useCart } from "../contexts/CartContext";

interface MenuItemProps {
  item: MenuItemType;
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  // check modal is handled at app level; dispatch events from this item
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleAddToCart = () => {
    if (!item.isAvailable || isAdding) return;
    setIsAdding(true);
    try {
      addToCart(item);
      // trigger visual flight animation and open cart
      animateFlyToCart();
      try {
        window.dispatchEvent(new Event("openCart"));
      } catch {
        /* ignore */
      }
    } catch {
      /* ignore for demo */
    }
    setTimeout(() => setIsAdding(false), 700);
  };

  const animateFlyToCart = () => {
    const img = imgRef.current;
    if (!img || typeof document === "undefined") return;

    const cartToggle = document.querySelector(
      '[aria-label="Toggle cart"]'
    ) as HTMLElement | null;

    const imgRect = img.getBoundingClientRect();
    const clone = img.cloneNode(true) as HTMLImageElement;

    clone.style.position = "fixed";
    clone.style.left = `${imgRect.left}px`;
    clone.style.top = `${imgRect.top}px`;
    clone.style.width = `${imgRect.width}px`;
    clone.style.height = `${imgRect.height}px`;
    clone.style.transition =
      "transform 600ms cubic-bezier(.2,.8,.2,1), opacity 600ms";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.borderRadius =
      window.getComputedStyle(img).borderRadius || "8px";
    clone.style.opacity = "1";

    document.body.appendChild(clone);

    // Fallback target (top-right) for mobile or when cart toggle is not present
    let targetX = window.innerWidth - 40;
    let targetY = 40;
    let targetWidth = 24;

    if (cartToggle) {
      const tr = cartToggle.getBoundingClientRect();
      targetX = tr.left + tr.width / 2;
      targetY = tr.top + tr.height / 2;
      targetWidth = tr.width;
    }

    const imgCenterX = imgRect.left + imgRect.width / 2;
    const imgCenterY = imgRect.top + imgRect.height / 2;
    const translateX = targetX - imgCenterX;
    const translateY = targetY - imgCenterY;

    // scale down proportionally to target width (but clamp)
    const scale = Math.max(
      0.18,
      Math.min(0.4, (targetWidth / Math.max(1, imgRect.width)) * 0.5)
    );

    // trigger the transform on the next frame so transition runs
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      clone.style.opacity = "0.6";
    });

    setTimeout(() => {
      clone.remove();
    }, 650);
  };

  // check modal is handled at app level; dispatch events from this item

  return (
    <>
      {/* Small-screen compact card - visible below lg */}
      <article className="lg:hidden w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 font-sans overflow-hidden p-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-1 ring-teal-200 dark:ring-teal-600">
              {item.imageUrl ? (
                <img
                  ref={imgRef}
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-300">
                  🍽️
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {item.name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-block text-xs text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {item.category}
              </span>
              {item.calories ? (
                <span className="text-[11px] text-gray-400 dark:text-gray-300">
                  • {item.calories} cal
                </span>
              ) : null}
            </div>
            {item.description && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-300 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-600 text-white text-sm font-semibold shadow-sm">
              {item.price} ETB
            </div>
            <div className="flex items-center gap-2">
              <button
              onClick={handleAddToCart}
              disabled={!item.isAvailable || isAdding}
              aria-label={`Add ${item.name} to cart`}
              className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full text-white shadow-md transition-transform focus:outline-none ${
                item.isAvailable
                  ? "bg-teal-600 hover:bg-teal-700 hover:scale-105"
                  : "bg-gray-300/60 cursor-not-allowed"
              }`}
            >
              {isAdding ? (
                <Check className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </button>
            </div>
          </div>
        </div>
      </article>

  {/* check modal is handled at app level; dispatch events from this item */}

      {/* Large-screen top-image card - visible at lg+ only */}
      <article className="hidden lg:block relative bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 font-sans overflow-hidden transition-transform hover:scale-102">
        <div className="flex flex-col ">
          <div className="w-full h-56 overflow-hidden bg-gray-100 dark:bg-gray-800">
            {item.imageUrl ? (
              <img
                ref={imgRef}
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-300">
                🍽️
              </div>
            )}

            {!item.isAvailable && (
              <div
                className="absolute h-56 inset-0 flex items-center justify-center 
                bg-black/40 text-white 
                rounded-lg text-sm font-semibold"
              >
                Not Available
              </div>
            )}
          </div>

          <div className="px-4 py-3 flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {item.name}
              </h3>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {item.category}
                </span>
                {item.calories ? (
                  <span className="text-sm text-gray-400">
                    • {item.calories} cal
                  </span>
                ) : null}
              </div>

              {item.description && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300 line-clamp-3">
                  {item.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between ">
              <div className="inline-flex items-center bg-teal-600 text-white font-semibold px-3 py-1 rounded-full shadow-sm text-sm">
                {item.price} ETB
              </div>

              {/* Large-screen add button placed inline next to price for consistent spacing */}
              <button
                onClick={handleAddToCart}
                disabled={!item.isAvailable || isAdding}
                aria-label={`Add ${item.name} to cart`}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg transition-transform focus:outline-none ${
                  item.isAvailable
                    ? "bg-teal-600 hover:bg-teal-700 hover:scale-105"
                    : "bg-gray-300/60 cursor-not-allowed"
                }`}
              >
                {isAdding ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* absolute button removed; button is now inline in the price row for consistent spacing */}
        </div>
      </article>
    </>
  );
};

export default MenuItem;
