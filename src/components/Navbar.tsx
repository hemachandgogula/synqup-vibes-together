
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { User, LogIn } from "lucide-react";

export function Navbar() {
  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-synqup-purple to-synqup-dark-purple" />
            <span className="text-xl font-bold text-gradient">SynQup</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/features" className="text-sm font-medium hover:text-synqup-purple transition-colors">
            Features
          </Link>
          <Link to="/pricing" className="text-sm font-medium hover:text-synqup-purple transition-colors">
            Pricing
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-synqup-purple transition-colors">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden md:inline">Log In</span>
            </Link>
          </Button>
          <Button size="sm" className="bg-synqup-purple hover:bg-synqup-dark-purple text-white" asChild>
            <Link to="/signup" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Sign Up</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
