import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  
  if (!userInfo) {
    // Redirect to login if no user is found in localStorage
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;