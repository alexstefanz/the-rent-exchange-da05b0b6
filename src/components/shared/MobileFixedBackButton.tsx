import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MobileFixedBackButton = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };
  return (
    <button
      onClick={handleClick}
      aria-label="Înapoi"
      className="lg:hidden fixed top-20 left-3 z-[45] w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
};

export default MobileFixedBackButton;