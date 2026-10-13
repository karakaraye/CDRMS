import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

/**
 * SideScrollButton
 * Floating side-docked scroll widget providing instant Scroll-to-Top and
 * Scroll-to-Bottom controls across the page, tables, and active workspaces.
 */
export default function SideScrollButton() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isNearTop, setIsNearTop] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Monitor scroll on window and containers
  useEffect(() => {
    const handleScroll = () => {
      // Find candidate active scrollable container or fallback to document
      const activeEl =
        document.querySelector(".table-responsive") ||
        document.querySelector(".worksheet-table-container") ||
        document.querySelector(".transcript-document") ||
        document.querySelector(".queries-table-container") ||
        document.querySelector(".overview-body") ||
        document.documentElement;

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || activeEl.scrollTop || 0;
      const scrollHeight =
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
          activeEl.scrollHeight || 0
        ) - (window.innerHeight || activeEl.clientHeight || 0);

      const progress = scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0;
      setScrollProgress(progress);
      setIsNearTop(scrollTop < 80);
      setIsNearBottom(progress > 90);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  const handleScroll = (direction) => {
    // Priority scroll targets in CDRMS
    const targets = [
      document.querySelector(".table-responsive"),
      document.querySelector(".worksheet-table-container"),
      document.querySelector(".transcript-document"),
      document.querySelector(".queries-table-container"),
      document.querySelector(".overview-body"),
      document.querySelector(".gateway-main-container"),
      document.querySelector(".gateway-wrapper"),
      document.querySelector(".main-workspace"),
      document.documentElement,
      document.body,
    ].filter(Boolean);

    if (direction === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      targets.forEach((el) => {
        try {
          el.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {
          el.scrollTop = 0;
        }
      });
    } else {
      const maxDoc = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      window.scrollTo({ top: maxDoc, behavior: "smooth" });
      targets.forEach((el) => {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        } catch (e) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  };

  return (
    <aside className="side-scroll-widget" aria-label="Page navigation scroll controls">
      {/* SCROLL TO TOP */}
      <button
        type="button"
        className={`side-scroll-btn btn-scroll-top ${isNearTop ? "is-dimmed" : "is-active"}`}
        onClick={() => handleScroll("top")}
        title="Scroll to Top (▲)"
        aria-label="Scroll to Top"
      >
        <ChevronUp size={22} className="side-scroll-icon" />
        <span className="side-scroll-tooltip">Scroll to Top</span>
      </button>

      {/* PROGRESS TRACKER PILL */}
      <div className="side-scroll-indicator" title={`Scroll Progress: ${Math.round(scrollProgress)}%`}>
        <div
          className="side-scroll-progress-bar"
          style={{ height: `${Math.max(10, scrollProgress)}%` }}
        />
      </div>

      {/* SCROLL TO BOTTOM */}
      <button
        type="button"
        className={`side-scroll-btn btn-scroll-bottom ${isNearBottom ? "is-dimmed" : "is-active"}`}
        onClick={() => handleScroll("bottom")}
        title="Scroll to Bottom (▼)"
        aria-label="Scroll to Bottom"
      >
        <ChevronDown size={22} className="side-scroll-icon" />
        <span className="side-scroll-tooltip">Scroll to Bottom</span>
      </button>
    </aside>
  );
}
