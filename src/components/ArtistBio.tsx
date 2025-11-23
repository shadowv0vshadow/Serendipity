'use client';

import { useState } from 'react';

interface ArtistBioProps {
    bio: string;
}

export default function ArtistBio({ bio }: ArtistBioProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Split bio into paragraphs for better readability
    const paragraphs = bio.split(/\n+/).filter(p => p.trim());

    // Check if bio is long enough to need collapsing
    const shouldCollapse = bio.length > 400;

    // Get preview paragraphs (show first ~400 characters worth)
    const getPreviewParagraphs = () => {
        if (!shouldCollapse) return paragraphs;

        let charCount = 0;
        const preview = [];

        for (const para of paragraphs) {
            if (charCount + para.length > 400) {
                // Add partial paragraph with ellipsis
                const remaining = 400 - charCount;
                if (remaining > 100) {
                    const partial = para.substring(0, remaining);
                    const lastSpace = partial.lastIndexOf(' ');
                    preview.push(partial.substring(0, lastSpace) + '...');
                }
                break;
            }
            preview.push(para);
            charCount += para.length;
        }

        return preview;
    };

    const displayParagraphs = isExpanded || !shouldCollapse ? paragraphs : getPreviewParagraphs();

    return (
        <div className="relative">
            {/* Biography Header */}
            <div className="flex items-center gap-2 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Biography</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Biography Content */}
            <div className="relative rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-md shadow-xl">
                {/* Decorative corner accent */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-tl-2xl pointer-events-none" />

                <div className="relative space-y-6">
                    {displayParagraphs.map((paragraph, index) => (
                        <p
                            key={index}
                            className="text-zinc-300 leading-relaxed text-lg font-light first-letter:text-2xl first-letter:font-normal first-letter:text-white"
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>

                {/* Fade overlay when collapsed */}
                {shouldCollapse && !isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent rounded-b-2xl pointer-events-none" />
                )}
            </div>

            {/* Expand/Collapse Button */}
            {shouldCollapse && (
                <div className="flex justify-center -mt-5 relative z-10">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="group relative px-8 py-3 rounded-full bg-zinc-900 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                        <span className="flex items-center gap-2 text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                            {isExpanded ? (
                                <>
                                    <svg className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Show less
                                </>
                            ) : (
                                <>
                                    Read full biography
                                    <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </>
                            )}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );

}
