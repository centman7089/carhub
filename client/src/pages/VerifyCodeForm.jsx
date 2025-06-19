import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyCodeForm = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const resetToken = localStorage.getItem('resetToken');
    
    try {
      const response = await fetch('http:localhost:5000/api/auth/users/verify-reset-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resetToken}`
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('passwordResetToken', data.passwordResetToken);
        navigate('/reset-password');
      } else {
        setMessage(data.message || 'Invalid verification code');
      }
    } catch (error) {
      setMessage('Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Verify Your Code</h2>
      <p className="mb-6 text-gray-600 text-center">
        We sent a 6-digit code to your email. Please enter it below.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="code" className="block text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-widest"
            maxLength={6}
            pattern="\d{6}"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-lg text-white font-semibold ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </button>
        
        {message && (
          <p className={`mt-4 text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default VerifyCodeForm;