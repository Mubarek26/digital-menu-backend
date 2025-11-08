import React from "react";


const Footer: React.FC = () => (
  <footer className="w-full bg-gray-100 dark:bg-gray-900 border-t mt-8 text-gray-600 dark:text-gray-300">
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
      {/* Left: Logo & Copyright */}
      <div className="flex flex-col items-center md:items-start">
        <span className="font-bold text-lg text-green-600 dark:text-green-400">Menuverse</span>
        <span className="text-sm mt-1">&copy; {new Date().getFullYear()} Menuverse. All rights reserved.</span>
      </div>

      {/* Center: Navigation Links */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-base font-semibold text-green-500 dark:text-green-400 animate-pulse">Eat. Enjoy. Experience.</span>
          <form className="flex gap-2 mt-2">
            <input
              type="email"
              placeholder="Subscribe for updates"
              className="px-3 py-1 rounded-l bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1 rounded-r bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition"
            >
              Subscribe
            </button>
          </form>
          <span className="text-xs text-gray-400 mt-1">Get exclusive offers & menu updates!</span>
        </div>

      {/* Right: Social & Contact */}
      <div className="flex flex-col items-center md:items-end gap-2">
        <div className="flex gap-3 mb-1">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-blue-500">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 01-2.828.775 4.932 4.932 0 002.165-2.724c-.951.564-2.005.974-3.127 1.195A4.92 4.92 0 0016.616 3c-2.72 0-4.924 2.204-4.924 4.924 0 .386.044.762.127 1.124C7.728 8.816 4.1 6.884 1.671 3.149c-.423.725-.666 1.562-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 01-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 01-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 010 21.543a13.94 13.94 0 007.548 2.212c9.058 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636A10.025 10.025 0 0024 4.557z"/></svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-blue-700">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.6 0 0 .6 0 1.326v21.348C0 23.4.6 24 1.326 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.92.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.4 24 24 23.4 24 22.674V1.326C24 .6 23.4 0 22.675 0"/></svg>
          </a>
          <a href="mailto:info@menuverse.com" aria-label="Email" className="hover:text-red-500">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 13.065l-11.99-7.065v14.13c0 .553.447 1 1 1h21.98c.553 0 1-.447 1-1v-14.13l-11.99 7.065zm11.99-9.065c0-.553-.447-1-1-1h-21.98c-.553 0-1 .447-1 1v.217l12 7.08 11.98-7.08v-.217z"/></svg>
          </a>
        </div>
        <span className="text-xs">info@menuverse.com</span>
        <span className="text-xs">+1 (555) 123-4567</span>
      </div>
    </div>
  </footer>
);

export default Footer;
