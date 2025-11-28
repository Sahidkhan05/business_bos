import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

// image in public/flower.png
const flowerImage = `${import.meta.env.BASE_URL}flower.png`;

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    // simple sample check – replace later with real API/Sheets
    if (email === "ceo@example.com" && password === "password123") {
      const user = {
        email,
        role: "ceo" as const,
      };
      navigate("/dashboard", { state: { user } });
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left image section */}
      <div
        className="md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${flowerImage})` }}
      />

      {/* Right form section */}
      <div className="md:w-1/2 flex items-center justify-center px-6 md:px-16 py-10">
        <div className="w-full max-w-md">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Welcome!
          </h1>

          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
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
                className="w-full rounded-full bg-[#fde2d8] px-5 py-3 outline-none placeholder:text-gray-500 text-sm"
              />
            </div>

            {/* Password */}
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
                className="w-full rounded-full bg-[#fde2d8] px-5 py-3 outline-none placeholder:text-gray-500 text-sm"
              />
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold underline text-gray-800"
              >
                Forget password ?
              </button>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="w-full rounded-full bg-black text-white py-3 text-sm font-semibold"
            >
              Log in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
