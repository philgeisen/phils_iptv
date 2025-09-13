// src/components/MenuBar.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  TvIcon,
  BellIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

interface MenuBarProps {
  primaryColor?: string;
  accentColor?: string;
  searchQuery?: string;
  setSearchQuery?: (s: string) => void;
  categories?: string[];
  selectedCategory?: string;
  setSelectedCategory?: (c: string) => void;
  className?: string;
}

const MenuBar: React.FC<MenuBarProps> = ({
  primaryColor = "#0A84FF",
  accentColor = "#FF9F0A",
  searchQuery = "",
  setSearchQuery = () => {},
  categories = ["All"],
  selectedCategory = "All",
  setSelectedCategory = () => {},
  className = "",
}) => {
  const [internalQuery, setInternalQuery] = useState<string>(searchQuery);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  // Debounce updates to parent
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setSearchQuery(internalQuery.trim());
    }, 300);
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [internalQuery, setSearchQuery]);

  const menuItems = useMemo(
    () => [
      { icon: HomeIcon, label: "Home", path: "/" },
      { icon: TvIcon, label: "Guide", path: "/epg" },
      { icon: BellIcon, label: "Playlists", path: "/playlists" },
      { icon: Cog6ToothIcon, label: "Settings", path: "/settings" },
    ],
    []
  );

  // keyboard nav anchors
  const anchors = useRef<Array<HTMLAnchorElement | null>>([]);
  const onKeyNav = (e: React.KeyboardEvent) => {
    const focused = document.activeElement;
    const idx = anchors.current.findIndex((el) => el === focused);
    if (idx === -1) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = anchors.current[(idx + 1) % anchors.current.length];
      next?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = anchors.current[(idx - 1 + anchors.current.length) % anchors.current.length];
      prev?.focus();
    }
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(92%,1100px)] z-50 ${className}`}
      aria-hidden={false}
    >
      <div
        className="mx-auto frosted-panel px-3 py-2 rounded-2xl flex items-center gap-3 shadow-md"
        role="navigation"
        aria-label="Main navigation"
        onKeyDown={onKeyNav}
      >
        {/* Left: icon nav */}
        <div className="flex items-center gap-2">
          {menuItems.map((m, i) => {
            const Icon = m.icon;
            return (
              <NavLink
                key={m.label}
                to={m.path}
                ref={(el) => (anchors.current[i] = el)}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-2 rounded-md transition-colors ${
                    isActive ? "text-white" : "text-white/80 hover:text-white"
                  }`
                }
                aria-label={m.label}
                tabIndex={0}
              >
                <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
                  <Icon className="w-6 h-6" />
                </motion.div>
                <span className="mt-1 text-[10px] hidden sm:inline">{m.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Center: search + category */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl mx-2">
          <div className="flex items-center gap-2 bg-white/6 rounded-full px-3 py-1 backdrop-blur-md w-full">
            <MagnifyingGlassIcon className="w-5 h-5 text-white/70" />
            <input
              value={internalQuery}
              onChange={(e) => setInternalQuery(e.target.value)}
              placeholder="Search channels, shows, EPG..."
              className="bg-transparent outline-none text-sm text-white w-full placeholder-white/60"
              aria-label="Search channels and shows"
            />
            {internalQuery && (
              <button
                onClick={() => {
                  setInternalQuery("");
                  setSearchQuery("");
                }}
                aria-label="Clear search"
                className="ml-2 text-xs px-2 py-1 rounded-full bg-white/6 hover:bg-white/10"
              >
                Clear
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/6 text-white text-sm px-3 py-1 rounded-full backdrop-blur-md"
            aria-label="Filter category"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Right: placeholder (avatar / mini controls) */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-xs text-white/80">
            {/* small visual anchor—replace with avatar/icon if desired */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuBar;
