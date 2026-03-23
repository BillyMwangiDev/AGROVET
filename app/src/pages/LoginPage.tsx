import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const me = await login(username, password);
      toast.success("Welcome back!");
      if (me.role === "customer") {
        navigate("/", { replace: true });
      } else {
        navigate("/admin", { replace: true });
      }
    } catch {
      toast.error("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7F6] flex items-center justify-center px-4">
      <title>Login | Nicmah Agrovet</title>
      <meta name="robots" content="noindex, nofollow" />
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Nicmah Agrovet" className="h-20 w-20 rounded-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#111915]">Nicmah Agrovet</h1>
          <p className="text-[#6B7A72] text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#111915] font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="border-gray-200 focus:border-[#0B3A2C] focus:ring-[#0B3A2C]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#111915] font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="border-gray-200 focus:border-[#0B3A2C] focus:ring-[#0B3A2C] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7A72] hover:text-[#111915]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0B3A2C] hover:bg-[#065f46] text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7A72] mt-4">
          New customer?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-[#0B3A2C] font-medium hover:underline"
          >
            Create an account
          </button>
        </p>
        <p className="text-center text-xs text-[#6B7A72] mt-3">
          Nicmah Agrovet · Naromoru Town, Timberland Building
        </p>
      </div>
    </div>
  );
}
