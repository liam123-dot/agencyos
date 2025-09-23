'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Users, Mail, Clock } from 'lucide-react';
import { InvitationWithDetails } from '@/lib/types/organizations';
import { getRoleDisplayName, getRoleColor } from '@/lib/utils/organizations';

interface InvitationPageProps {
  token: string;
}

export function InvitationPage({ token }: InvitationPageProps) {
  const [invitation, setInvitation] = useState<InvitationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDecline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const fetchInvitationDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/invitations/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invitation details');
      }

      if (!data.success) {
        throw new Error(data.error || 'Invalid invitation');
      }

      setInvitation(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvitationDetails();
  }, [fetchInvitationDetails]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      setError(null);

      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess('Invitation accepted successfully! Redirecting to your organization...');
      
      // Redirect to app after a short delay
      setTimeout(() => {
        router.push('/app');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setDecline(true);
      setError(null);

      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline invitation');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to decline invitation');
      }

      setSuccess('Invitation declined.');
      
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setDecline(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading invitation...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => router.push('/')}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Success!</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const isExpired = invitation.is_expired;
  const daysLeft = invitation.days_until_expiry;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <CardTitle>Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Organization Details */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">{invitation.organization_name}</h3>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className={getRoleColor(invitation.role)}>
                {getRoleDisplayName(invitation.role)}
              </Badge>
            </div>
          </div>

          {/* Inviter Details */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">{invitation.invited_by_name}</p>
              <p className="text-xs text-gray-600">{invitation.invited_by_email}</p>
            </div>
          </div>

          {/* Expiry Warning */}
          {isExpired ? (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired and can no longer be accepted.
              </AlertDescription>
            </Alert>
          ) : daysLeft <= 1 ? (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This invitation expires in {daysLeft === 0 ? 'less than a day' : '1 day'}.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Error Display */}
          {error && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {!isExpired && (
            <div className="flex gap-3">
              <Button
                onClick={handleAccept}
                disabled={accepting || declining}
                className="flex-1"
              >
                {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept Invitation
              </Button>
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={accepting || declining}
                className="flex-1"
              >
                {declining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Decline
              </Button>
            </div>
          )}

          {isExpired && (
            <Button 
              className="w-full" 
              onClick={() => router.push('/')}
            >
              Go to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
