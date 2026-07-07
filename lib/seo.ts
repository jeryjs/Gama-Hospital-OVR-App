import type { Metadata } from 'next';

/**
 * SEO configuration — single source of truth for site-wide metadata.
 *
 * Title format: `content | title | app_name`
 *   • `content`   — what the page is about (e.g. "Incident Reports")
 *   • `title`     — page-specific title (e.g. "New Report")
 *   • `app_name`  — "Gama Hospital OVR System"
 *
 * Example: `New Report | Incident Reports | Gama Hospital OVR System`
 */

// ============================================
// Site Constants
// ============================================

export const SITE = {
    /** Used in <title> and structured data */
    app_name: 'Gama Hospital OVR System',
    /** Short name for tabs / smaller contexts */
    app_name_short: 'OVR System',
    /** Organization structured data */
    org_name: 'Gama Hospital',
    /** Root content descriptor */
    default_content: 'Occurrence Variance Reporting & Incident Management',
    /** Full meta description */
    description:
        'Healthcare occurrence variance reporting platform for capturing, tracking, and resolving incidents, investigations, and corrective actions at Gama Hospital.',
    /** Canonical site URL */
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gama-ovr.jeryjs.dev',
    locale: 'en_US' as const,
} as const;

// ============================================
// Per-Page SEO Definitions
// ============================================

/**
 * Each entry maps a route path to SEO fields.
 *
 * Fields:
 *   title       — page-specific title slot  (becomes "%s | content | app_name" via template)
 *   content     — middle slot, what the page is about
 *   description — optional overrides the default meta description
 *   noIndex     — true for auth-only / sensitive pages
 *   image       — optional custom OG image override
 */

type PageSeo = {
    title: string;
    content: string;
    description?: string;
    noIndex?: boolean;
    image?: { url: string; width: number; height: number; alt: string };
};

export const PAGE_SEO: Record<string, PageSeo> = {
    '/': {
        title: 'OVR System',
        content: SITE.default_content,
    },
    '/login': {
        title: 'Sign In',
        content: 'Staff Authentication',
        description: 'Authenticate with your Staff ID to access the Gama Hospital Occurrence Variance Reporting (OVR) System.',
        image: { url: '/gama_banner.png', width: 1200, height: 630, alt: 'Gama Hospital OVR System Login' },
    },
    '/dashboard': {
        title: 'Dashboard',
        content: 'Incident Reports Overview',
    },
    '/incidents': {
        title: 'Incidents',
        content: 'Incident Reports Registry',
        description: 'Browse, search, and filter all occurrence variance reports submitted across Gama Hospital departments.',
    },
    '/incidents/new': {
        title: 'New Report',
        content: 'Incident Reports',
        description: 'Submit a new occurrence variance report. Capture incident details, involved parties, harm assessment, and proposed corrective actions.',
    },
    '/incidents/me': {
        title: 'My Reports',
        content: 'Incident Reports',
        description: 'View and track all occurrence variance reports you have submitted in the Gama Hospital OVR System.',
    },
    '/incidents/corrective-actions': {
        title: 'Corrective Actions',
        content: 'Action Tracking',
        description: 'Monitor and manage corrective action items arising from Gama Hospital occurrence variance reports and investigations.',
    },
    '/incidents/investigations': {
        title: 'Investigations',
        content: 'Ongoing Investigations',
        description: 'Track active investigations following occurrence variance reports at Gama Hospital.',
    },
    '/incidents/qi/review': {
        title: 'QI Review Queue',
        content: 'Quality Improvement',
        description: 'Quality Improvement review queue for approving or rejecting submitted occurrence variance reports at Gama Hospital.',
    },
    '/notifications': {
        title: 'Notifications',
        content: 'Alerts & Updates',
    },
    '/profile': {
        title: 'My Profile',
        content: 'Account Settings',
    },
    '/analytics': {
        title: 'Analytics',
        content: 'Executive Summary',
        description: 'Executive analytics and insights on occurrence variance reports, trends, and corrective actions across Gama Hospital.',
    },
    '/administration/users': {
        title: 'User Management',
        content: 'System Administration',
        description: 'Manage user accounts, roles, and access permissions in the Gama Hospital OVR System.',
    },
    '/administration/departments': {
        title: 'Departments',
        content: 'System Administration',
        description: 'Manage hospital departments and clinical units in the Gama Hospital OVR System.',
    },
};

/**
 * Fallback for unknown routes — generic auth-protected page.
 */
export const DEFAULT_PAGE_SEO: PageSeo = {
    title: 'OVR System',
    content: SITE.default_content,
};

// ============================================
// Helpers
// ============================================

/**
 * Build a full page title string from page-level SEO fields.
 *
 * Format: `{title} | {content} | Gama Hospital OVR System`
 */
export function buildPageTitle(page: PageSeo): string {
    return `${page.content} | ${page.title}`;
}

/**
 * Build the `Metadata` object for a page.
 *
 * Usage (page.tsx or layout.tsx):
 *   export const metadata = pageMetadata('/incidents/new');
 *   // or with overrides:
 *   export const metadata = pageMetadata('/incidents/new', { title: 'Draft Report' });
 */
export function pageMetadata(
    path: string,
    overrides?: Partial<PageSeo>,
): Metadata {
    const page = { ...(PAGE_SEO[path] ?? DEFAULT_PAGE_SEO), ...overrides };

    return {
        title: buildPageTitle(page),
        description: page.description ?? SITE.description,
        robots: page.noIndex
            ? { index: false, follow: false }
            : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
        openGraph: {
            type: 'website',
            locale: SITE.locale,
            siteName: SITE.app_name_short,
            url: path,
            title: buildPageTitle(page),
            description: page.description ?? SITE.description,
            images: page.image
                ? [page.image]
                : [
                    {
                        url: '/opengraph-image',
                        width: 1200,
                        height: 630,
                        alt: `${page.title} — ${SITE.app_name}`,
                    },
                ],
        },
        twitter: {
            card: 'summary_large_image',
            title: buildPageTitle(page),
            description: page.description ?? SITE.description,
            images: page.image ? [page.image.url] : ['/opengraph-image'],
        },
    };
}
