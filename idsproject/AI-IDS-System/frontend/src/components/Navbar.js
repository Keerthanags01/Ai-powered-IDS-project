import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Activity, Upload, BarChart3 } from 'lucide-react';

const Navbar = ({ apiStatus }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/single', label: 'Single Test', icon: Activity },
    { path: '/batch', label: 'Batch Upload', icon: Upload },
    { path: '/monitor', label: 'Live Monitor', icon: Activity }
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">IDS Dashboard</span>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm ${
              apiStatus?.model_loaded 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {apiStatus?.model_loaded ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
