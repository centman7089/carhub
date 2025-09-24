// @ts-nocheck


const OAuthLogin = () => {
  const API = "http://localhost:3000/api/auth/users";

  return (
    <div className="flex flex-col gap-4 p-6">
      <a href={`${API}/google`} className="bg-red-500 text-white p-2 rounded">Login with Google</a>
      <a href={`${API}/github`} className="bg-gray-800 text-white p-2 rounded">Login with GitHub</a>
    </div>
  );
};

export default OAuthLogin;
