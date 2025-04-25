
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Navbar } from '@/components/Navbar';

const Signup = () => {
  return (
    <>
      <Navbar />
      <div className="container flex h-screen w-screen flex-col items-center justify-center px-4 md:px-6">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-bold">Create an account</h1>
            <p className="text-sm text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Link to="/terms" className="underline hover:text-synqup-purple">
                  terms of service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline hover:text-synqup-purple">
                  privacy policy
                </Link>
              </label>
            </div>
            <Button className="bg-synqup-purple hover:bg-synqup-dark-purple text-white">
              Create Account
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="underline hover:text-synqup-purple">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
