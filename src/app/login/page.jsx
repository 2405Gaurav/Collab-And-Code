"use client";

import { useState } from "react";
import { loginWithEmailAndPassword, loginWithGoogle } from "@/helpers/loginHelp";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import { auth } from "@/config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Code2, Loader2, Lock } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // Separate loading state for reset

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await loginWithEmailAndPassword(email, password);
      console.log("Logged in as:", user.email);

      if (user) {
        toast.success("Welcome back!", toastOptions);
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Login failed: " + error.message, toastOptions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        toast.success("Logged in with Google!", toastOptions);
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Google login failed", toastOptions);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("Please enter your email first.", toastOptions);
      return;
    }
    setIsResetting(true);

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset link sent to your email!", toastOptions);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Error sending password reset email", toastOptions);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a] relative overflow-hidden font-sans selection:bg-violet-500/30 selection:text-violet-200">
      <ToastContainer theme="dark" />

      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 left-0 right-0 h-96 bg-violet-950/20 blur-[120px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md bg-[#111]/80 border border-white/10 backdrop-blur-xl shadow-2xl shadow-violet-900/10 z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="bg-violet-600/20 p-3 rounded-xl ring-1 ring-violet-500/50">
              <Code2 className="text-violet-400 w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-sm text-zinc-400">Enter your credentials to access your workspace.</p>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20 h-11 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</Label>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-xs text-violet-400 hover:text-violet-300 hover:underline transition-colors">
                      Forgot Password?
                    </button>
                  </DialogTrigger>
                  
                  {/* Password Reset Modal */}
                  <DialogContent className="bg-[#111] border border-white/10 text-white sm:max-w-md shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold tracking-tight">Reset Password</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 text-white h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
                      />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        variant="ghost"
                        onClick={() => setIsDialogOpen(false)}
                        className="text-zinc-400 hover:text-white hover:bg-white/5"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePasswordReset}
                        disabled={isResetting}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Link"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20 h-11 transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 font-medium transition-all shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] mt-2"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111] px-2 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full border-white/10 bg-transparent hover:bg-white/5 text-zinc-300 hover:text-white h-11"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                Google
              </>
            )}
          </Button>

          <p className="text-center text-sm text-zinc-500 pt-2">
            Don't have an account?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 hover:underline transition-colors font-medium">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;