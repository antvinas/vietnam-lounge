import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { getUserPlans } from '../../api/plan.api'; // API function to fetch user's plans
import { FaPlus, FaMapMarkedAlt } from 'react-icons/fa';

const PlanHome = () => {
  const { data: plans, isLoading, isError } = useQuery('userPlans', getUserPlans);

  if (isLoading) {
    return <div>Loading your travel plans...</div>;
  }

  if (isError) {
    return <div>Failed to load travel plans.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Travel Plans</h1>
        <Link to="/plan/new" className="btn-primary inline-flex items-center gap-2">
          <FaPlus />
          Create New Plan
        </Link>
      </div>

      {plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Link to={`/plan/${plan.id}`} key={plan.id} className="block group">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transform group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <FaMapMarkedAlt className="text-5xl text-gray-400 dark:text-gray-500"/>
                    </div>
                    <div className="p-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{plan.destination}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-300 mt-3">
                            {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">No Travel Plans Yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Ready for an adventure? Create your first travel plan!</p>
          <Link to="/plan/new" className="btn-primary mt-6 inline-flex items-center gap-2">
            <FaPlus />
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
};

export default PlanHome;
