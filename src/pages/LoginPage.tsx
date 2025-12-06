import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Image in public/flower.png
const flowerImage = `${import.meta.env.BASE_URL}flower.png`;

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API to authenticate
      await login(email, password);

      // Navigate to dashboard on success
      navigate("/dashboard");
    } catch (err) {
      // Display error message from backend
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
    // ✅ Dummy login
    const user = { email, role: "ceo" as const };
    navigate("/dashboard", { state: { user } });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left image */}
      <div
        className="md:w-1/2 h-64 md:h-auto bg-cover bg-center"
        style={{ backgroundImage: `url(${flowerImage})` }}
      />

      {/* Right form */}
      <div className="md:w-1/2 flex items-center justify-center px-6 md:px-16 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 text-center md:text-left">
            Welcome!
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-800"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="abc123@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full bg-[#fde2d8] px-5 py-3 outline-none placeholder:text-gray-500 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-800"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full bg-[#fde2d8] px-5 py-3 outline-none placeholder:text-gray-500 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold underline text-gray-800 hover:text-orange-500 transition"
              >
                Forget password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-black text-white py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              className="w-full rounded-full bg-black text-white py-3 text-sm font-semibold hover:bg-gray-800 transition"
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}