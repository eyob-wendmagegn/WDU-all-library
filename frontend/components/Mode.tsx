// 'use client';

// import { useEffect, useState } from 'react';
// import { FaSun, FaMoon } from 'react-icons/fa';

// export default function Mode() {
//   const [mounted, setMounted] = useState(false);
//   const [isDark, setIsDark] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//     // Check local storage or system preference
//     const theme = localStorage.getItem('theme');
//     const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

//     if (theme === 'dark' || (!theme && systemPrefersDark)) {
//       setIsDark(true);
//       document.documentElement.classList.add('dark');
//       document.documentElement.style.colorScheme = 'dark';
//     } else {
//       setIsDark(false);
//       document.documentElement.classList.remove('dark');
//       document.documentElement.style.colorScheme = 'light';
//     }
//   }, []);

//   const toggle = () => {
//     const next = !isDark;
//     setIsDark(next);
    
//     if (next) {
//       document.documentElement.classList.add('dark');
//       document.documentElement.style.colorScheme = 'dark';
//       localStorage.setItem('theme', 'dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//       document.documentElement.style.colorScheme = 'light';
//       localStorage.setItem('theme', 'light');
//     }
//   };

//   // Prevent hydration mismatch
//   if (!mounted) {
//     return (
//       <div className="w-9 h-9 flex items-center justify-center">
//         <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
//       </div>
//     );
//   }

//   return (
//     <button
//       onClick={toggle}
//       className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
//       aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
//       title={isDark ? "Light Mode" : "Dark Mode"}
//     >
//       {isDark ? (
//         <FaSun className="text-yellow-400 text-lg transition-transform hover:rotate-90 duration-500" />
//       ) : (
//         <FaMoon className="text-blue-600 text-lg transition-transform hover:-rotate-12 duration-500" />
//       )}
//     </button>
//   );
// }