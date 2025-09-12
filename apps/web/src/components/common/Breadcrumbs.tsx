
import { Link, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

interface BreadcrumbProps {
  pathMap?: Record<string, string>;
}

const Breadcrumbs = ({ pathMap = {} }: BreadcrumbProps) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="text-sm mb-4" aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex space-x-2">
        <li className="flex items-center">
          <Link to="/" className="text-gray-500 hover:text-blue-600">
            <FaHome />
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = pathMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <li key={to} className="flex items-center">
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="text-gray-700 font-semibold">{displayName}</span>
              ) : (
                <Link to={to} className="text-gray-500 hover:text-blue-600">
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
