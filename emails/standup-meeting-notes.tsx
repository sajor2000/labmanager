import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface StandupMeetingNotesEmailProps {
  labName: string;
  meetingDate: string;
  participants: Array<{
    name: string;
    initials: string;
  }>;
  summary?: string;
  actionItems: Array<{
    id: string;
    description: string;
    assignee?: {
      name: string;
    } | null;
    dueDate?: string | null;
    completed: boolean;
  }>;
  blockers: Array<{
    id: string;
    description: string;
    resolved: boolean;
  }>;
  decisions: Array<{
    id: string;
    description: string;
  }>;
  transcriptUrl: string;
  senderName: string;
}

export const StandupMeetingNotesEmail = ({
  labName = 'Health Equity Labs',
  meetingDate = 'January 5, 2025',
  participants = [
    { name: 'Jane Cooper', initials: 'JC' },
    { name: 'John Smith', initials: 'JS' },
  ],
  summary = 'Team discussed progress on the current sprint, identified blockers with data access, and made key decisions about the upcoming deliverables.',
  actionItems = [
    {
      id: '1',
      description: 'Complete data analysis for Q1 report',
      assignee: { name: 'Jane Cooper' },
      dueDate: 'January 10, 2025',
      completed: false,
    },
  ],
  blockers = [
    {
      id: '1',
      description: 'Waiting for IRB approval on new protocol',
      resolved: false,
    },
  ],
  decisions = [
    {
      id: '1',
      description: 'Move forward with proposed study design for Project Alpha',
    },
  ],
  transcriptUrl = 'https://labmanage.com/standups/123',
  senderName = 'Jane Cooper',
}: StandupMeetingNotesEmailProps) => {
  const previewText = `Standup meeting notes from ${labName} - ${meetingDate}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-[40px] w-[600px] max-w-full rounded-lg border border-solid border-gray-200 p-[20px]">
            {/* Header */}
            <Section className="mb-8">
              <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-bold text-gray-900">
                {labName}
              </Heading>
              <Text className="text-center text-[14px] text-gray-600">
                Standup Meeting Notes
              </Text>
              <Text className="text-center text-[16px] font-semibold text-gray-800">
                {meetingDate}
              </Text>
            </Section>

            <Hr className="mx-0 my-[26px] w-full border border-solid border-gray-200" />

            {/* Participants */}
            <Section className="mb-6">
              <Text className="text-[16px] font-semibold text-gray-900">
                Participants ({participants.length})
              </Text>
              <div className="mt-2 flex flex-wrap gap-2">
                {participants.map((participant, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">
                      {participant.initials}
                    </div>
                    <Text className="m-0 text-[14px] text-gray-700">
                      {participant.name}
                    </Text>
                  </div>
                ))}
              </div>
            </Section>

            {/* Summary */}
            {summary && (
              <Section className="mb-6">
                <Text className="text-[16px] font-semibold text-gray-900">
                  Meeting Summary
                </Text>
                <Text className="mt-2 text-[14px] leading-[24px] text-gray-700">
                  {summary}
                </Text>
              </Section>
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <Section className="mb-6">
                <Text className="text-[16px] font-semibold text-gray-900">
                  Action Items ({actionItems.filter(item => !item.completed).length} pending)
                </Text>
                <div className="mt-3">
                  {actionItems.map((item) => (
                    <div
                      key={item.id}
                      className="mb-3 rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-1 h-4 w-4 rounded ${
                            item.completed
                              ? 'bg-green-500'
                              : 'border-2 border-gray-300 bg-white'
                          }`}
                        >
                          {item.completed && (
                            <Text className="text-center text-[10px] leading-[14px] text-white">
                              ✓
                            </Text>
                          )}
                        </div>
                        <div className="flex-1">
                          <Text
                            className={`m-0 text-[14px] ${
                              item.completed
                                ? 'text-gray-500 line-through'
                                : 'text-gray-800'
                            }`}
                          >
                            {item.description}
                          </Text>
                          <div className="mt-1 flex gap-4">
                            {item.assignee && (
                              <Text className="m-0 text-[12px] text-gray-600">
                                👤 {item.assignee.name}
                              </Text>
                            )}
                            {item.dueDate && (
                              <Text className="m-0 text-[12px] text-gray-600">
                                📅 {item.dueDate}
                              </Text>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Blockers */}
            {blockers.length > 0 && (
              <Section className="mb-6">
                <Text className="text-[16px] font-semibold text-gray-900">
                  Blockers ({blockers.filter(b => !b.resolved).length} unresolved)
                </Text>
                <div className="mt-3">
                  {blockers.map((blocker) => (
                    <div
                      key={blocker.id}
                      className={`mb-2 rounded-lg border p-3 ${
                        blocker.resolved
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Text
                          className={`m-0 text-[14px] ${
                            blocker.resolved ? 'text-green-800' : 'text-red-800'
                          }`}
                        >
                          {blocker.resolved ? '✓' : '⚠️'} {blocker.description}
                        </Text>
                      </div>
                      {blocker.resolved && (
                        <Text className="m-0 mt-1 text-[12px] text-green-600">
                          Resolved
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Key Decisions */}
            {decisions.length > 0 && (
              <Section className="mb-6">
                <Text className="text-[16px] font-semibold text-gray-900">
                  Key Decisions
                </Text>
                <div className="mt-3">
                  {decisions.map((decision) => (
                    <div key={decision.id} className="mb-2 flex items-start gap-2">
                      <Text className="m-0 text-[14px] text-green-600">•</Text>
                      <Text className="m-0 text-[14px] text-gray-700">
                        {decision.description}
                      </Text>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Hr className="mx-0 my-[26px] w-full border border-solid border-gray-200" />

            {/* CTA Button */}
            <Section className="text-center">
              <Button
                className="rounded-lg bg-blue-600 px-6 py-3 text-center text-[14px] font-semibold text-white no-underline"
                href={transcriptUrl}
              >
                View Full Transcript
              </Button>
            </Section>

            {/* Footer */}
            <Section className="mt-8">
              <Text className="text-center text-[12px] text-gray-500">
                This email was sent by {senderName} from {labName}
              </Text>
              <Text className="text-center text-[12px] text-gray-500">
                <Link
                  href={transcriptUrl}
                  className="text-blue-600 no-underline"
                >
                  View in browser
                </Link>
                {' • '}
                <Link
                  href="https://labmanage.com/unsubscribe"
                  className="text-blue-600 no-underline"
                >
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default StandupMeetingNotesEmail;