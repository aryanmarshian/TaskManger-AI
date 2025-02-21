import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Clock, ListTodo } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered Task Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Transform your productivity with AI-driven insights. Get smart task breakdowns, 
              intelligent suggestions, and automated workflows.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/login">
                <Button size="lg" className="bg-primary">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Smarter Task Management</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage tasks effectively
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-lg bg-primary/10 p-4 mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <dt className="text-lg font-semibold leading-7">AI-Powered Insights</dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">
                  Get intelligent breakdowns and suggestions for your tasks
                </dd>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-lg bg-primary/10 p-4 mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <dt className="text-lg font-semibold leading-7">Real-time Updates</dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">
                  Stay synchronized with your team in real-time
                </dd>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-lg bg-primary/10 p-4 mb-4">
                  <ListTodo className="h-6 w-6 text-primary" />
                </div>
                <dt className="text-lg font-semibold leading-7">Smart Organization</dt>
                <dd className="mt-2 text-base leading-7 text-muted-foreground">
                  Organize tasks with intelligent categorization
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}