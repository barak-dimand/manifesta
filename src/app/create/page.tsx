import { WizardContainer } from '@/components/wizard/WizardContainer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Dream Board — Manifesta',
  description: 'Build your AI-powered vision board in 4 simple steps',
};

export default function CreatePage() {
  return <WizardContainer />;
}
