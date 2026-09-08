// src/lib/auth.config.ts

import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import crypto from "crypto";

import dbConnect from "./db";
import { User } from "@/models/User";
import { OtpVerification } from "@/models/OtpVerification";
import { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    // MOBILE OTP
    CredentialsProvider({
      id: "credentials",
      name: "Mobile OTP",

      credentials: {
        mobile: {
          label: "Mobile",
          type: "text",
        },

        otp: {
          label: "OTP",
          type: "text",
        },

        fullName: {
          label: "Full Name",
          type: "text",
        },
      },

      async authorize(credentials) {
        if (!credentials?.mobile || !credentials?.otp) {
          throw new Error("Mobile number and OTP are required");
        }

        const mobile = credentials.mobile.replace(/\D/g, "").trim();

        const otp = credentials.otp.trim();

        if (mobile.length !== 10) {
          throw new Error("Invalid mobile number");
        }

        if (otp.length !== 6) {
          throw new Error("Invalid OTP");
        }

        await dbConnect();

        // Hash entered OTP
        const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

        // Find valid OTP
        const record = await OtpVerification.findOne({
          mobile,
          purpose: "login",
          expiresAt: { $gt: new Date() },
        });

        if (!record) {
          throw new Error("Invalid or expired OTP");
        }

        if (record.attempts >= 5) {
          await OtpVerification.deleteOne({ _id: record._id });
          throw new Error("Too many attempts. Please request a new OTP");
        }

        if (record.otpHash !== otpHash) {
          record.attempts += 1;
          await record.save();
          throw new Error("Invalid or expired OTP");
        }

        await OtpVerification.deleteOne({ _id: record._id });

        // Find existing user
        let user = await User.findOne({
          mobile,
        });

        // Create new user
        if (!user) {
          const fullName = credentials.fullName?.trim() || "User";

          user = await User.create({
            name: fullName,
            mobile,
            provider: "mobile",
          });
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email ?? null,
          mobile: user.mobile,
          image: user.image ?? null,
          role: user.role ?? "user",
          createdAt: user.createdAt?.toISOString(),
        };
      },
    }),

    // GOOGLE
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // SIGN IN
    async signIn({ user, account }) {
      // Mobile OTP
      if (account?.provider === "credentials") {
        return true;
      }

      // Google
      if (account?.provider === "google") {
        await dbConnect();

        const googleId = account.providerAccountId;

        let dbUser = await User.findOne({
          googleId,
        });

        // If Google ID doesn't exist, try email
        if (!dbUser && user.email) {
          dbUser = await User.findOne({
            email: user.email.toLowerCase(),
          });
        }

        // Existing user
        if (dbUser) {
          if (!dbUser.googleId) {
            dbUser.googleId = googleId;
          }

          if (user.image) {
            dbUser.image = user.image;
          }

          if (!dbUser.name && user.name) {
            dbUser.name = user.name;
          }

          await dbUser.save();

          return true;
        }

        // New Google user
        await User.create({
          name: user.name,
          email: user.email?.toLowerCase(),
          image: user.image,
          googleId,
          provider: "google",
        });

        return true;
      }

      return true;
    },

    // JWT
    async jwt({ token, user, account }) {
      // Initial mobile login
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.mobile = user.mobile;
        token.image = user.image;
        token.role = user.role ?? "user";
        token.createdAt = user.createdAt;
      }

      // Initial Google login
      if (user && account?.provider === "google") {
        await dbConnect();

        let dbUser = await User.findOne({
          googleId: account.providerAccountId,
        });

        // Fallback to email
        if (!dbUser && user.email) {
          dbUser = await User.findOne({
            email: user.email.toLowerCase(),
          });
        }

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.mobile = dbUser.mobile;
          token.image = dbUser.image;
          token.role = dbUser.role ?? "user";
          token.createdAt = dbUser.createdAt?.toISOString();
        }
      }

      return token;
    },

    // SESSION
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.mobile = token.mobile;
        session.user.image = token.image;
        session.user.role = token.role;
        session.user.createdAt = token.createdAt;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt" as const,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
