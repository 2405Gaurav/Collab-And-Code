"use client";

import { useState } from "react";
import { signUpUser, signInWithGoogle, verifyEmailCode } from "@/helpers/signUpHelp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { Code2, Loader2 } from "lucide-react"; 
import "react-toastify/dist/ReactToastify.css";

// REMOVED "as const" here
const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const res = await signUpUser(email, password, displayName);
      if (!res.success) {
        toast.error(res.message, toastOptions);
      } else {
        toast.success(res.message, toastOptions);
        setShowVerification(true);
      }
    } catch (error) { // REMOVED ": any"
      toast.error("Sign-up failed: " + error.message, toastOptions);
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) return;

    setLoading(true);
    try {
      const res = await verifyEmailCode(email, verificationCode, password, displayName);
      if (res.success) {
        toast.success("Account created successfully! Redirecting...", toastOptions);
        setVerificationCode("")
        router.push("/dashboard");
      } else {
        toast.error(res.message, toastOptions);
        setVerificationCode("")
      }
    } catch (error) { // REMOVED ": any"
      toast.error("Verification failed: " + error.message, toastOptions);
      setVerificationCode("")
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        router.push("/dashboard");
      } else {
        toast.error(res.error, toastOptions);
      }
    } catch (error) { // REMOVED ": any"
      toast.error("Google sign-in failed: " + error.message, toastOptions);
    }
    setLoading(false);
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
          <p className="text-sm text-zinc-400">Join Code & Collab to build faster.</p>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Display Name</Label>
              <Input
                type="text"
                placeholder="GT"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20 h-11 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</Label>
              <Input
                type="email"
                placeholder="gt@demo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20 h-11 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</Label>
              <Input
                type="password"
                placeholder="gt1234"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20 h-11 transition-all"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 font-medium transition-all shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)]"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111] px-2 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full border-white/10 bg-transparent hover:bg-white/5 text-zinc-300 hover:text-white h-11"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                  Google
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-zinc-500 pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 hover:underline transition-colors font-medium">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="bg-[#111] border border-white/10 text-white sm:max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Verify email address</DialogTitle>
            <DialogDescription className="text-zinc-400">
              We sent a 6-digit code to <span className="text-violet-400">{email}</span>. <br/>Enter it below to confirm your identity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Verification Code</Label>
              <Input
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="bg-zinc-900/50 border-white/10 text-white text-center text-lg tracking-[0.5em] h-12 placeholder:tracking-normal focus:border-violet-500/50 focus:ring-violet-500/20"
                maxLength={6}
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowVerification(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-700 text-white min-w-[120px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}