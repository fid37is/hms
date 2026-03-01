import { useNavigate } from 'react-router-dom';
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0F2545] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#C9A84C] text-7xl font-bold mb-4">404</p>
        <p className="text-white text-xl mb-6">Page not found</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
      </div>
    </div>
  );
}
