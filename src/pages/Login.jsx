import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const loginResult = await login(username, password);

    if (loginResult.success) {
      if (loginResult.role === "admin") {
        navigate("/admin");
        toast({
          title: "Login berhasil",
          description: "Selamat datang di panel admin",
        });
      } else if (loginResult.role === "worker") {
        navigate("/worker");
        toast({
          title: "Login berhasil",
          description: "Selamat datang di panel pekerja",
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login gagal",
        description: loginResult.error || "Username atau password salah",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-morphism rounded-xl p-8"
      >
        <h1 className="text-3xl font-bold text-center mb-8">Haw Reload</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-300"
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Login"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;