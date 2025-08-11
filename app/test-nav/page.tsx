'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/overview' },
  { name: 'Labs', href: '/labs' },
  { name: 'Buckets', href: '/buckets' },
  { name: 'Studies', href: '/studies' },
  { name: 'Stacked by Bucket', href: '/stacked' },
  { name: 'Kanban Board', href: '/kanban' },
  { name: 'Task Board', href: '/tasks' },
  { name: 'Ideas Board', href: '/ideas' },
  { name: 'Calendar', href: '/calendar' },
  { name: 'Deadlines', href: '/deadlines' },
  { name: 'Team Members', href: '/team' },
  { name: 'Standups', href: '/standups' },
];

interface TestResult {
  name: string;
  href: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export default function TestNavPage() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>(
    navigation.map(nav => ({
      ...nav,
      status: 'pending',
    }))
  );
  const [currentTest, setCurrentTest] = useState(0);

  const testNavigation = async (index: number) => {
    const nav = navigation[index];
    
    try {
      // Test fetch to the route
      const response = await fetch(nav.href);
      
      if (response.ok) {
        setTestResults(prev => prev.map((result, i) => 
          i === index 
            ? { ...result, status: 'success', message: `HTTP ${response.status}` }
            : result
        ));
      } else {
        setTestResults(prev => prev.map((result, i) => 
          i === index 
            ? { ...result, status: 'error', message: `HTTP ${response.status}` }
            : result
        ));
      }
    } catch (error) {
      setTestResults(prev => prev.map((result, i) => 
        i === index 
          ? { ...result, status: 'error', message: (error as Error).message }
          : result
      ));
    }
  };

  const runAllTests = async () => {
    for (let i = 0; i < navigation.length; i++) {
      setCurrentTest(i);
      await testNavigation(i);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setCurrentTest(-1);
  };

  const navigateToRoute = (href: string) => {
    router.push(href);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Navigation Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={runAllTests} disabled={currentTest >= 0}>
                {currentTest >= 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Run All Tests'
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Home
              </Button>
            </div>

            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={result.href}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.status === 'pending' && currentTest !== index && (
                      <div className="w-5 h-5 rounded-full bg-gray-200" />
                    )}
                    {result.status === 'pending' && currentTest === index && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {result.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{result.name}</span>
                    <span className="text-sm text-gray-500">{result.href}</span>
                    {result.message && (
                      <span className="text-sm text-gray-500">
                        ({result.message})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testNavigation(index)}
                      disabled={currentTest >= 0}
                    >
                      Test
                    </Button>
                    <Link href={result.href}>
                      <Button size="sm" variant="ghost">
                        Visit (Link)
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigateToRoute(result.href)}
                    >
                      Visit (Router)
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Test Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total: </span>
                  <span className="font-medium">{testResults.length}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Passed: </span>
                  <span className="font-medium text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Failed: </span>
                  <span className="font-medium text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}