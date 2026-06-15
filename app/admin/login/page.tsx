"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL ?? "https://res.cloudinary.com/dwcy6vc23/image/upload/v1781519305/Digital%20menue/logo.png";
const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "Abo-Eldahab";

async function handleLogin() {
    setError("");
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/admin");
    } catch {
        setError("Invalid email or password.");
    } finally {
        setLoading(false);
    }
}

return (
    
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#EDECEA] p-8">

        {/* Header */}
        <h1 className="text-xl font-bold text-[#1C1C1A] mb-1">Admin Login</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">Sign in to manage your menu</p>

        {/* Email */}
        <div className="mb-4">
        <label className="block text-sm font-medium text-[#374151] mb-1">Email</label>
        <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="admin@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-[#E5E3DD] bg-[#FAFAF8] text-[#1C1C1A] text-sm focus:outline-none focus:border-[#D97706] transition-colors"
        />
        </div>

        {/* Password */}
        <div className="mb-6">
        <label className="block text-sm font-medium text-[#374151] mb-1">Password</label>
        <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-lg border border-[#E5E3DD] bg-[#FAFAF8] text-[#1C1C1A] text-sm focus:outline-none focus:border-[#D97706] transition-colors"
        />
        </div>

        {/* Error */}
        {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        {/* Submit */}
        <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
        {loading ? "Signing in..." : "Sign in"}
        </button>
    </div>
    </div>
);
}