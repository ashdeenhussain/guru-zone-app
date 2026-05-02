import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This file handles all requests to /api/auth/*
// Ensure the folder name is exactly [...nextauth]
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

