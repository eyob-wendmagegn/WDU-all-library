//app/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
// Note: In this preview environment, absolute imports like @/ might fail without config.
// The user should keep their existing import in their real project.
import { useTranslation } from '@/lib/i18n'; 
import { 
  FaSearch, FaBookReader, FaUndo, FaPlus, 
  FaTelegram, FaArrowRight,
  FaPhone, FaEnvelope
} from 'react-icons/fa';

export default function Home() {
  const { t } = useTranslation();

  // Use translated words for typing animation
  const words = [t('anytime'), t('anywhere')];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true only on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Predefined particle positions to avoid Math.random() during SSR
  const particlePositions = useMemo(() => 
    [
      { left: '17.9%', top: '48.2%' },
      { left: '52.3%', top: '65.5%' },
      { left: '11.3%', top: '36.5%' },
      { left: '87.6%', top: '21.9%' },
      { left: '53.3%', top: '84.1%' },
      { left: '16.7%', top: '29.4%' },
      { left: '75.2%', top: '72.8%' },
      { left: '35.8%', top: '15.6%' },
      { left: '92.1%', top: '58.3%' },
      { left: '28.4%', top: '89.7%' },
      { left: '63.9%', top: '42.1%' },
      { left: '7.5%', top: '67.2%' },
      { left: '44.6%', top: '23.8%' },
      { left: '81.3%', top: '36.9%' },
      { left: '22.7%', top: '54.2%' },
      { left: '69.4%', top: '12.5%' },
      { left: '39.1%', top: '77.3%' },
      { left: '95.8%', top: '45.6%' },
      { left: '13.2%', top: '83.4%' },
      { left: '58.7%', top: '31.9%' }
    ],
    []
  );

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayedText.length < currentWord.length) {
      timeout = setTimeout(() => {
        setDisplayedText(currentWord.slice(0, displayedText.length + 1));
      }, 120);
    } else if (!isDeleting && displayedText.length === currentWord.length) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && displayedText.length > 0) {
      timeout = setTimeout(() => {
        setDisplayedText(currentWord.slice(0, displayedText.length - 1));
      }, 80);
    } else if (isDeleting && displayedText.length === 0) {
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentWordIndex, words]);

  const services = [
    {
      icon: FaSearch,
      title: t('searchBooksTitle'),
      desc: t('searchBooksDesc'),
      color: "text-white"
    },
    {
      icon: FaBookReader,
      title: t('borrowBooksTitle'),
      desc: t('borrowBooksDesc'),
      color: "text-white"
    },
    {
      icon: FaUndo,
      title: t('returnBooksTitle'),
      desc: t('returnBooksDesc'),
      color: "text-white"
    },
    {
      icon: FaPlus,
      title: t('requestBooksTitle'),
      desc: t('requestBooksDesc'),
      color: "text-white"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* FIXED ANIMATED BACKGROUND (Visible in Hero) */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
        
        {/* Animated Gradient Orbs */}
        <motion.div
          animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0], scale: [1, 1.2, 0.8, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 60, 0], y: [0, 60, -80, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-3/4 right-1/3 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 60, -40, 0], y: [0, -40, 60, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-500/15 to-blue-400/15 rounded-full blur-3xl"
        />

        {/* Fixed Particles & Patterns */}
        {particlePositions.map((pos, i) => (
          <motion.div
            key={i}
            // Animation only runs on client side
            animate={isClient ? { 
              y: [0, -30, 0], 
              x: [0, (i % 3 === 0 ? 10 : i % 3 === 1 ? -10 : 5), 0], 
              opacity: [0.3, 0.7, 0.3] 
            } : {}}
            transition={isClient ? { 
              duration: 3 + (i % 4), 
              repeat: Infinity, 
              delay: (i * 0.1) % 2 
            } : {}}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{ 
              left: pos.left, 
              top: pos.top 
            }}
          />
        ))}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
        <div className="absolute inset-0 opacity-5 bg-noise-texture" />
      </div>

      {/* 1. HERO SECTION */}
      <section id="home" className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          
          {/* LEFT: TEXT CONTENT */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-3 space-y-6 text-left"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              {t('woldiaUniversity')}
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {t('library')}
            </h2>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl">
              {t('connectsReaders')} {' '}
              <span className="inline-block min-w-[130px] relative">
                <span className="font-bold text-cyan-400">
                  {displayedText.split('').map((letter, i) => (
                    <motion.span key={`${currentWordIndex}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: i * 0.05 }} className="inline-block">{letter}</motion.span>
                  ))}
                </span>
                <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }} className="inline-block w-0.5 h-6 bg-cyan-400 ml-0.5 align-middle" />
              </span>!
            </p>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/login" className="inline-block mt-8 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transform transition-all duration-300 hover:brightness-110">
                {t('login')}
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }} className="inline-block ml-2">→</motion.span>
              </Link>
            </motion.div>
          </motion.div>

          {/* RIGHT: GLASS CARDS */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 max-w-md mx-auto lg:max-w-full">
              <motion.div initial={{ opacity: 0, y: 30, rotateY: 10 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ duration: 0.6, delay: 0.2 }} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="group relative overflow-hidden rounded-2xl h-40 backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                {/* Hero Image 1 */}
                <img src="group_reading.jpg" alt={t('explore')} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="transform group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                    <p className="text-white font-semibold text-base mb-1">{t('explore')}</p>
                    <p className="text-gray-300 text-xs">{t('discover')}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 30, rotateY: -10 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ duration: 0.6, delay: 0.4 }} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="group relative overflow-hidden rounded-2xl h-40 backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                {/* Hero Image 2 */}
                <img src="w1.jpg" alt={t('learn')} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="transform group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                    <p className="text-white font-semibold text-base mb-1">{t('learn')}</p>
                    <p className="text-gray-300 text-xs">{t('anywhere')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section id="services" className="relative z-20 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('exploreServices')}
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('servicesDesc')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl hover:bg-white/10 transition-all duration-300 group cursor-pointer border border-white/10 shadow-lg"
              >
                <div className={`w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 ${service.color}`}>
                  <service.icon className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
          
        </div>
      </section>

      {/* 4. FOOTER / ABOUT SECTION */}
      <footer id="contact" className="relative z-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-24 mb-12">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-blue-500">Woldia</span> University
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {t('footerBrandDesc')}
              </p>
              <div className="flex gap-4">
                {[
                  // Directs to backend API which redirects to https://t.me/Squed25
                  { Icon: FaTelegram, href: "http://localhost:5000/api/telegram" }
                ].map(({ Icon, href }, i) => (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors text-gray-300 hover:text-white">
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-6">{t('quickLinks')}</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                {[
                  { id: 'home', text: t('navHome') },
                  { id: 'services', text: t('navServices') },
                  { id: 'contact', text: t('navContact') }
                ].map((link) => (
                  <li key={link.id}>
                    <a href={`#${link.id}`} className="hover:text-blue-400 transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h4 className="text-lg font-bold mb-6">{t('contactUs')}</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FaPhone size={14} />
                   </div>
                   <span>+251983610499</span>
                </li>
                <li className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FaEnvelope size={14} />
                   </div>
                   <span>eyobwende18@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>{t('copyright')} {t('allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}