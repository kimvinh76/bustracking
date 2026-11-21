import { NavLink } from 'react-router-dom';

const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ClipboardListIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 114 0v0a2 2 0 002 2H7a2 2 0 002-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6M9 16h6" />
  </svg>
);

const UserCircleIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

const ParentNavbar = () => {
  const navigation = [
    { name: 'Theo dõi xe', href: '/parent', icon: HomeIcon, end: true },
    { name: 'Lịch trình', href: '/parent/overview', icon: ClipboardListIcon, end: false },
  ];

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <aside className="w-56 sm:w-64 bg-[#174D2C] text-white h-full flex flex-col p-4 shrink-0">
      <div className="flex flex-col items-center justify-center pb-5 border-b border-[#D8E359]/40">
        <UserCircleIcon className="w-16 h-16 text-[#D8E359]" />
        <span className="mt-1.5 text-sm font-semibold tracking-wide text-[#D8E359]">
          PHỤ HUYNH
        </span>
      </div>

      <nav className="flex-1 py-5 space-y-3">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 text-base rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-[#D8E359] text-[#174D2C] font-semibold shadow-sm'
                  : 'text-white/90 hover:bg-white hover:text-[#174D2C]'
              }`
            }
          >
            <item.icon className="h-5 w-5 mr-3 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#D8E359]/40 pt-4 mt-auto">
        <button
          type="button"
          onClick={handleLogout}
          className="bg-[#D8E359] hover:bg-[#c6d93a] text-[#174D2C] px-4 py-2 rounded-lg text-base font-semibold transition-colors border border-black/30 w-full cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default ParentNavbar;
