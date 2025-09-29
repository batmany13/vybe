'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitCommit, 
  GitBranch, 
  User, 
  Calendar, 
  ExternalLink,
  Github,
  FileText,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react';

// Since we don't have access to GitHub integration hooks, we'll create a placeholder
function useGithubRepositories() {
  return { data: [], error: null, isLoading: false };
}

function useGithubCommits(owner: string, repo: string) {
  return { data: [], error: null, isLoading: false };
}

export function GitHubCommitHistory() {
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [ownerLogin, setOwnerLogin] = useState<string>('');

  // Get repositories
  const { data: repositories = [], error: repoError, isLoading: repoLoading } = useGithubRepositories();
  
  // Get commits for selected repository
  const { data: commits = [], error: commitError, isLoading: commitLoading } = useGithubCommits(
    ownerLogin, 
    selectedRepo
  );

  const handleRepoSelect = (repoFullName: string) => {
    const [owner, repo] = repoFullName.split('/');
    setOwnerLogin(owner);
    setSelectedRepo(repo);
  };

  if (repoError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load GitHub repositories. Please check your GitHub integration connection.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Commit History
          </CardTitle>
          <CardDescription>
            View recent commits across your GitHub repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>GitHub integration is not yet configured</p>
            <p className="text-sm mt-2">Connect your GitHub account to view commit history</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}