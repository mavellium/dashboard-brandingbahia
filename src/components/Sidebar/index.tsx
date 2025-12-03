"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  HelpCircle, 
  FileText, 
  Newspaper, 
  Building, 
  PlayCircle,
  LayoutDashboard
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "FAQs", icon: HelpCircle, href: "/faq" },
  { name: "Serviços", icon: FileText, href: "/details" },
  { name: "Notícias", icon: Newspaper, href: "/news" },
  { name: "Setores", icon: Building, href: "/setors" },
  { name: "Destaques", icon: PlayCircle, href: "/hightlight" }
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const pathname = usePathname();
  const [year] = useState(() => new Date().getFullYear());
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const closeSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  }, [isMobile, isOpen, isCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fechar menu ao clicar fora (apenas para mobile agora)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Apenas para mobile quando o menu estiver aberto
      if (isMobile && isOpen) {
        const target = event.target as Node;
        if (
          sidebarRef.current && 
          !sidebarRef.current.contains(target) &&
          toggleButtonRef.current && 
          !toggleButtonRef.current.contains(target)
        ) {
          closeSidebar();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isOpen, closeSidebar]);

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarWidth = isMobile ? (isOpen ? "w-80" : "w-0") : (isCollapsed ? "w-20" : "w-80");

  return (
    <>
      {/* Mobile Toggle Button - Only shows when sidebar is closed */}
      {isMobile && !isOpen && (
        <motion.button
          ref={toggleButtonRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-50 bg-[#0C8BD2] text-white p-3 rounded-2xl shadow-lg hover:bg-[#0A7AB8] transition-all duration-300 hover:scale-105 shadow-blue-500/25 z-[99999999999]"
        >
          <Menu size={24} />
        </motion.button>
      )}

      {/* Desktop Toggle Button - Shows when sidebar is collapsed */}
      {!isMobile && isCollapsed && (
        <motion.button
          ref={toggleButtonRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={toggleSidebar}
          className="fixed top-6 z-50 bg-[#0C8BD2] text-white p-3 rounded-2xl shadow-lg hover:bg-[#0A7AB8] transition-all duration-300 hover:scale-105 shadow-blue-500/25 z-[99999999999]"
          style={{ 
            left: '6rem',
            transform: 'translateX(-50%)'
          }}
        >
          <Menu size={24} />
        </motion.button>
      )}

      {/* Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-[#00000073] z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Overlay for Desktop - Shows when sidebar is expanded */}
      <AnimatePresence>
        {!isMobile && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-[#00000073] bg-opacity-30 z-30 hidden lg:block z-[999999]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.aside
            ref={sidebarRef}
            initial={{ 
              x: isMobile ? -320 : 0, 
              opacity: isMobile ? 0 : 1 
            }}
            animate={{ 
              x: 0, 
              opacity: 1 
            }}
            exit={{ 
              x: isMobile ? -320 : 0, 
              opacity: isMobile ? 0 : 1 
            }}
            transition={{ 
              duration: 0.25, 
              ease: "easeInOut" 
            }}
            className={`
              h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white 
              shadow-2xl flex flex-col justify-between z-40 fixed lg:fixed
              border-r border-gray-700
              ${sidebarWidth}
              transition-all duration-250
              z-[99999999999999999999]
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <AnimatePresence mode="wait">
                {(!isCollapsed || isMobile) && (
                  <motion.div
                    key="header-expanded"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 relative flex-shrink-0">
                      <Image
                        src="/branding-bahia.png"
                        alt="Branding Bahia"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl font-bold bg-gradient-to-r from-[#0C8BD2] to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
                        <Link href="/" className="transition-opacity">
                          Branding Bahia
                        </Link>
                      </h1>
                      <p className="text-xs text-gray-400 mt-1 whitespace-nowrap">Dashboard</p>
                    </div>
                  </motion.div>
                )}
                
                {/* Mini header for collapsed desktop state */}
                {!isMobile && isCollapsed && (
                  <motion.div
                    key="header-collapsed"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-center w-full"
                  >
                    <div className="w-8 h-8 relative">
                      <Image
                        src="/branding-bahia.png"
                        alt="BB"
                        width={32}
                        height={32}
                        className="rounded object-cover"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close button - Show X when sidebar is open (mobile) or expanded (desktop) */}
              {(isMobile && isOpen) || (!isMobile && !isCollapsed) ? (
                <motion.button
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  onClick={closeSidebar}
                  className="p-2 rounded-xl hover:bg-gray-700 transition-all duration-200 hover:scale-105 flex-shrink-0"
                >
                  <X size={20} className="text-gray-300" />
                </motion.button>
              ) : null}
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                
                return (
                  <motion.div
                    key={item.name}
                    onHoverStart={() => setHoveredItem(index)}
                    onHoverEnd={() => setHoveredItem(null)}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      href={item.href}
                      onClick={isMobile ? closeSidebar : undefined}
                      className={`
                        flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative
                        ${isActive 
                          ? 'bg-[#0C8BD2] text-white shadow-lg shadow-blue-500/25' 
                          : 'text-gray-300 hover:bg-gray-750 hover:text-white'
                        }
                        ${isCollapsed && !isMobile ? 'justify-center px-3' : ''}
                      `}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
                        />
                      )}
                      
                      <motion.div
                        className={`
                          transition-all duration-200 flex-shrink-0
                          ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                        `}
                        layout
                      >
                        <Icon 
                          size={22} 
                          className={`
                            ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                          `} 
                        />
                      </motion.div>
                      
                      <AnimatePresence>
                        {(!isCollapsed || isMobile) && (
                          <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                            layout
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Hover tooltip for collapsed state */}
                      {(isCollapsed && !isMobile) && hoveredItem === index && (
                        <motion.div
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 border border-gray-700"
                        >
                          {item.name}
                          <div className="absolute top-1/2 -left-1 w-2 h-2 bg-gray-900 transform -translate-y-1/2 rotate-45 border-l border-t border-gray-700" />
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
              <AnimatePresence mode="wait">
                {(!isCollapsed || isMobile) && (
                  <motion.div
                    key="footer-expanded"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 mx-auto mb-2 relative opacity-80 hover:opacity-100 transition-opacity">
                      <Image
                        src="/branding-bahia.png"
                        alt="Branding Bahia"
                        width={48}
                        height={48}
                        className="object-contain rounded-lg"
                      />
                    </div>
                    <p className="text-gray-400 text-xs">
                      © {year} Branding Bahia
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Todos os direitos reservados
                    </p>
                  </motion.div>
                )}
                
                {/* Mini footer for collapsed desktop state */}
                {!isMobile && isCollapsed && (
                  <motion.div
                    key="footer-collapsed"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-center"
                  >
                    <div className="w-8 h-8 relative opacity-70">
                      <Image
                        src="/branding-bahia.png"
                        alt="BB"
                        width={32}
                        height={32}
                        className="object-contain rounded"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content margin adjustment for desktop */}
      {!isMobile && (
        <style jsx global>{`
          main {
            margin-left: ${isCollapsed ? '5rem' : '20rem'};
            transition: margin-left 0.25s ease-in-out;
          }
        `}</style>
      )}
    </>
  );
}