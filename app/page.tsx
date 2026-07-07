import { pageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = pageMetadata('/');

export default function Home() {
  redirect('/dashboard');
}
