import Link from 'next/link';
import { ArrowRight, Gift, BookOpen, Target, Users, Sparkles, Lock } from 'lucide-react';
import Header from '@/components/Header';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-white">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-indigo-900 sm:text-6xl md:text-7xl mb-8">
            Discover Your 
            <span className="text-indigo-600"> God-Given Gifts</span>
          </h1>
          <p className="mt-3 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
            You are about to embark on an exciting adventure that may bring a positive change 
            to your life. God has made each person unique with specific gifts. Your life could be 
            a tragic waste if you fail to discover and use these gifts as God planned for you.
          </p>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
            No matter your background, you are a Very Important Person on earth. Your gift is 
            needed by all of us - discover it, develop it, and excel in its operation.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link 
              href="/register" 
              className="rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg 
                hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 
                hover:gap-3 group"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:transform group-hover:translate-x-1 transition-all" />
            </Link>
            <Link 
              href="/login" 
              className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-indigo-600 
                border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Your Path to Career and Ministry Purpose
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Our personality discovery test is the first step to help you find out the gift or potential God has placed in you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Gift,
                title: "Discover Your Gifts",
                description: "Take our assessment to identify your unique motivational gifts from Romans 12:6-8"
              },
              {
                icon: Target,
                title: "Career Alignment",
                description: "Get matched with careers that perfectly align with your God-given motivational gifts"
              },
              {
                icon: Users,
                title: "Expert Guidance",
                description: "Connect with career counselors who understand both gifts and professional paths"
              },
              {
                icon: BookOpen,
                title: "Practical Resources",
                description: "Access tailored resources for career transition or ministry development"
              }
            ].map((step, index) => (
              <div key={index} className="bg-indigo-50 rounded-xl p-8 hover:shadow-xl transition-all duration-300">
                <div className="bg-indigo-600 rounded-lg w-12 h-12 flex items-center justify-center mb-6">
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Comprehensive Career & Ministry Development
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-indigo-900 mb-4">Career Development</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-indigo-100 rounded-full p-1">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-gray-700">Career matching based on your motivational gifts</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-indigo-100 rounded-full p-1">
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-gray-700">Professional career counseling support</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-indigo-100 rounded-full p-1">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-gray-700">Career transition guidance and resources</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-indigo-900 mb-4">Ministry Purpose</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-indigo-100 rounded-full p-1">
                    <Gift className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-gray-700">Understanding your role in ministry through your gifts</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-indigo-100 rounded-full p-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-gray-700">Ministry placement recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-indigo-100 rounded-full p-1">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-gray-700">Personal development path for ministry effectiveness</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Success Stories
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Found my perfect career match through understanding my motivational gifts. The career counseling was invaluable.",
                author: "David K.",
                role: "Career Switcher"
              },
              {
                quote: "The platform helped me understand how my gifts align with both my career and ministry calling.",
                author: "Rachel S.",
                role: "Ministry & Professional"
              },
              {
                quote: "The career transition resources and counseling made switching to my gift-aligned career smooth.",
                author: "Mark T.",
                role: "Career Transitioner"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-indigo-800 rounded-xl p-8">
                <p className="text-lg mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-indigo-300 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-8">
            Start Your Career & Ministry Journey
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Discover how your motivational gifts can guide you to your perfect career and ministry role.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 
                text-lg font-semibold text-white shadow-lg hover:bg-indigo-700 
                transition-all duration-200"
            >
              Begin Your Discovery
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/counselor-access" 
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-8 py-4 
                text-lg font-semibold text-gray-800 shadow-md hover:bg-gray-200
                transition-all duration-200"
            >
              <Lock className="w-5 h-5" />
              Counselor Access
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Pathfinders</h3>
              <p className="text-gray-400">
                Discover your God-given gifts and find your purpose in both ministry and career.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-white">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">For Users</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/register" className="text-gray-400 hover:text-white">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-400 hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/assessments" className="text-gray-400 hover:text-white">
                    Take Assessment
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">For Counselors</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/counselor-access/login" className="text-gray-400 hover:text-white">
                    Counselor Login
                  </Link>
                </li>
                <li>
                  <Link href="/counselor-access/register" className="text-gray-400 hover:text-white">
                    Register as Counselor
                  </Link>
                </li>
                <li>
                  <Link href="/counselor-resources" className="text-gray-400 hover:text-white">
                    Counseling Resources
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Pathfinders. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white mr-4">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}