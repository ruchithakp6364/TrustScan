import { Shield, Target, Users, TrendingUp, Lock, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center p-2 mb-6 rounded-full bg-primary/10">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About TrustScan
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to protect internet users from fraudulent websites, phishing attacks,
            and online scams through AI-powered security analysis.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-4">
                With the rise of online fraud and phishing attacks, millions of people fall victim to
                malicious websites every year. TrustScan was created to provide a simple, fast, and
                accurate way to verify website legitimacy.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                We combine multiple security checks, AI analysis, and community reporting to give you
                complete confidence when browsing the web.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">99.5% detection rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">100K+ active users</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">1M+ websites checked</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Lock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">50K+ threats blocked</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How We Protect You</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive security analysis uses multiple layers of verification
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'SSL Certificate Verification',
                description: 'We check if websites have valid SSL certificates and secure HTTPS connections to protect your data.'
              },
              {
                icon: Globe,
                title: 'Domain Age Analysis',
                description: 'New domains are often used for scams. We verify domain registration age and history.'
              },
              {
                icon: Lock,
                title: 'Blacklist Database Check',
                description: 'We scan against multiple security databases to identify known malicious websites.'
              },
              {
                icon: Target,
                title: 'AI Pattern Detection',
                description: 'Our AI analyzes URLs and content for suspicious patterns commonly used in phishing.'
              },
              {
                icon: TrendingUp,
                title: 'Hosting Analysis',
                description: 'We examine IP addresses, hosting locations, and ISP information for red flags.'
              },
              {
                icon: Users,
                title: 'Community Reports',
                description: 'Real users can report suspicious websites, building a collaborative defense system.'
              }
            ].map((item, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Target Users */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Who We Serve</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              TrustScan is designed for everyone concerned about online safety
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Online Shoppers', description: 'Verify e-commerce sites before making purchases' },
              { title: 'Freelancers', description: 'Check client websites and payment portals' },
              { title: 'Small Businesses', description: 'Protect your team from phishing attacks' },
              { title: 'Corporate Teams', description: 'Compliance and security verification' }
            ].map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Protecting Yourself Today
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join our community of security-conscious internet users
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/">Scan a Website</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
