import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Mining', icon: 'pickaxe' },
    { path: '/profile', label: 'Profile', icon: 'user' },
    { path: '/leaderboard', label: 'Leaderboard', icon: 'trophy' }
  ];
  
  // Render appropriate icon based on name
  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'pickaxe':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 5l7 7m-7-7l-2.5 2.5M14 12l-8.5 8.5M3 21l2.5-2.5M19 12l2 2m-5-9l2-2" />
          </svg>
        );
      case 'user':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'trophy':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* Header */}
      <header className="bg-dark py-3 px-4 border-b border-dark-light">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Cosmofy</h1>
          
          {user && (
            <div className="flex items-center">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.firstName} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark border-t border-dark-light z-10">
        <div className="container mx-auto flex items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-3 px-5 ${
                location.pathname === item.path
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {renderIcon(item.icon)}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar; 