import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0D9488 0%, #00E599 100%)',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                    }}
                >
                    <div
                        style={{
                            fontSize: 96,
                            fontWeight: 900,
                            color: '#FFFFFF',
                            letterSpacing: -2,
                        }}
                    >
                        Gama Hospital OVR System
                    </div>
                    <div
                        style={{
                            fontSize: 32,
                            color: 'rgba(255,255,255,0.85)',
                            fontWeight: 400,
                        }}
                    >
                        Occurrence Variance Reporting
                    </div>
                </div>
            </div>
        ),
        { ...size },
    );
}
