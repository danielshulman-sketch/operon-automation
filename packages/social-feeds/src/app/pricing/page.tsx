"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="px-6 py-4 flex items-center justify-between border-b">
                <div className="font-bold text-xl">Workflow Poster</div>
                <div className="space-x-4">
                    <Link href="/login"><Button variant="ghost">Login</Button></Link>
                    <Link href="/signup"><Button>Sign Up</Button></Link>
                </div>
            </header>

            <main className="flex-1 container py-12 flex flex-col items-center">
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
                    <p className="text-lg text-muted-foreground">Choose the plan that's right for you.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Free Starter</CardTitle>
                            <CardDescription>Perfect for trying out the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> 1 Workflow</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> 50 Executions/mo</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Community Support</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href="/signup" className="w-full"><Button className="w-full" variant="outline">Get Started</Button></Link>
                        </CardFooter>
                    </Card>

                    <Card className="border-primary shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                        <CardHeader>
                            <CardTitle>Pro</CardTitle>
                            <CardDescription>For serious automation power.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-3xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Unlimited Workflows</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Unlimited Executions</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Priority Support</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Advanced AI Models</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Link href="/signup?plan=pro" className="w-full"><Button className="w-full">Subscribe Now</Button></Link>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
