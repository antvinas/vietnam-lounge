import { useNavigate } from "react-router-dom";
import { FaPen } from "react-icons/fa";

const FloatingWriteButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/community/new")}
      aria-label="새 글 작성"
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full 
                 bg-blue-500 text-white shadow-lg ring-1 ring-blue-300/30 
                 transition-all hover:scale-110 hover:bg-blue-600 active:scale-95 
                 dark:bg-blue-600 dark:hover:bg-blue-500 z-50"
      title="새 글 작성"
    >
      <FaPen size={20} />
    </button>
  );
};

export default FloatingWriteButton;
