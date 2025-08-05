'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmailRecipientSelector, type EmailRecipient } from './email-recipient-selector';
import { EmailPreview } from './email-preview';
import { showToast } from '@/components/ui/toast';
import type { StandupWithRelations } from '@/lib/services/standup.service';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  standup: StandupWithRelations;
  currentUser: {
    name: string;
    email: string;
  };
}

export function SendEmailModal({
  isOpen,
  onClose,
  standup,
  currentUser,
}: SendEmailModalProps) {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [suggestedRecipients, setSuggestedRecipients] = useState<EmailRecipient[]>([]);
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('recipients');

  // Generate default subject
  useEffect(() => {
    if (standup) {
      const date = new Date(standup.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      setSubject(`Standup Meeting Notes - ${standup.lab.name} - ${formattedDate}`);
    }
  }, [standup]);

  // Load email data when modal opens
  useEffect(() => {
    if (isOpen && standup) {
      loadEmailData();
    }
  }, [isOpen, standup]);

  const loadEmailData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/standups/${standup.id}/send-email`);
      if (response.ok) {
        const data = await response.json();
        setSuggestedRecipients(data.data.suggestedRecipients || []);
        setCanSend(data.data.canSend);
        setLastSentAt(data.data.lastSentAt);
        
        // Pre-select suggested recipients
        if (data.data.suggestedRecipients && recipients.length === 0) {
          setRecipients(data.data.suggestedRecipients);
        }
      }
    } catch (error) {
      console.error('Failed to load email data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    // Validate
    if (recipients.length === 0) {
      showToast({
        type: 'error',
        title: 'No recipients',
        message: 'Please add at least one recipient',
      });
      setActiveTab('recipients');
      return;
    }

    if (!subject.trim()) {
      showToast({
        type: 'error',
        title: 'No subject',
        message: 'Please enter a subject line',
      });
      setActiveTab('recipients');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/standups/${standup.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject,
          senderName: currentUser.name,
          senderEmail: currentUser.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Email sent!',
          message: data.message || `Email sent to ${recipients.length} recipient(s)`,
        });
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Failed to send email',
          message: data.error || 'Something went wrong',
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send email. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format data for preview
  const previewData = {
    labName: standup.lab.name,
    meetingDate: new Date(standup.date),
    participants: standup.participants.map(p => ({
      name: p.user.name || 'Unknown',
      initials: p.user.initials || 'U',
    })),
    summary: standup.transcriptArchive?.transcript
      ? standup.transcriptArchive.transcript.substring(0, 200) + '...'
      : undefined,
    actionItems: standup.actionItems,
    blockers: standup.blockers,
    decisions: standup.decisions,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Send Meeting Notes</DialogTitle>
          <DialogDescription>
            Send standup meeting notes to team members via email
          </DialogDescription>
        </DialogHeader>

        {!canSend && lastSentAt && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Email was recently sent. You can send again in 1 hour.
              Last sent: {new Date(lastSentAt).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recipients">Recipients & Details</TabsTrigger>
            <TabsTrigger value="preview">Email Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="recipients" className="space-y-4">
            {/* Subject Line */}
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="mt-1"
              />
            </div>

            {/* Recipients */}
            <EmailRecipientSelector
              recipients={recipients}
              suggestedRecipients={suggestedRecipients}
              onChange={setRecipients}
            />

            {/* Email Stats */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <h4 className="mb-2 text-sm font-medium">Email will include:</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{standup.participants.length} participants</span>
                </div>
                {standup.actionItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{standup.actionItems.length} action items</span>
                  </div>
                )}
                {standup.blockers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{standup.blockers.length} blockers</span>
                  </div>
                )}
                {standup.decisions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{standup.decisions.length} decisions</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Link to full transcript</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <EmailPreview {...previewData} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <LoadingButton
            onAsyncClick={handleSendEmail}
            loading={isSending}
            loadingText="Sending..."
            disabled={!canSend || recipients.length === 0}
            className="gap-2"
            successMessage="Email sent successfully"
            errorMessage="Failed to send email"
          >
            <Send className="h-4 w-4" />
            Send Email
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}