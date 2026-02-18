import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    // Adapter is not needed for credentials provider and can cause issues if not configured correctly for hybrid
    // adapter: PrismaAdapter(prisma), 
    session: {
        strategy: "jwt",
    },
    providers: [
        CredentialsProvider({
            name: "Sign in",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "hello@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("Authorize called with full credentials:", credentials);

                if (!credentials?.email || !credentials?.password) {
                    console.error("Missing credentials in authorize");
                    return null;
                }

                try {
                    // Normalize email to avoid case/whitespace login failures.
                    const email = credentials.email.trim().toLowerCase();

                    const user = await prisma.user.findFirst({
                        where: {
                            email: {
                                equals: email,
                                mode: "insensitive",
                            },
                        }
                    });

                    console.log("User found in DB:", user ? { id: user.id, email: user.email, role: user.role, hasPassword: !!user.password } : "NULL");

                    if (!user || !user.password) {
                        console.error("User not found or has no password");
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    console.log("Password comparison result:", isPasswordValid);

                    if (!isPasswordValid) {
                        console.error("Invalid password for user:", email);
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("Authorize CAUGHT error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        session: ({ session, token }) => {
            if (session?.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
        jwt: ({ token, user }) => {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
    },
    pages: {
        signIn: '/login',
    },
    debug: process.env.NODE_ENV === 'development',
};
