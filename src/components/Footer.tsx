
import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-synqup-purple to-synqup-dark-purple" />
              <span className="text-lg font-bold text-gradient">SynQup</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Watch, listen, and share experiences together in perfect sync, no matter the distance.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4">Product</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-synqup-purple transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-synqup-purple transition-colors">Pricing</Link></li>
              <li><Link to="/integrations" className="hover:text-synqup-purple transition-colors">Integrations</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4">Resources</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><Link to="/help" className="hover:text-synqup-purple transition-colors">Help Center</Link></li>
              <li><Link to="/guides" className="hover:text-synqup-purple transition-colors">Guides</Link></li>
              <li><Link to="/api" className="hover:text-synqup-purple transition-colors">API</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4">Company</h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-synqup-purple transition-colors">About</Link></li>
              <li><Link to="/blog" className="hover:text-synqup-purple transition-colors">Blog</Link></li>
              <li><Link to="/careers" className="hover:text-synqup-purple transition-colors">Careers</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SynQup. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-synqup-purple transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-synqup-purple transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
