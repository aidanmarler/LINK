import type { Database } from '$lib/database.types';

// OriginalSegment
export type OriginalSegmentInsert = Database['public']['Tables']['original_segments']['Insert'];
export type OriginalSegmentRow = Database['public']['Tables']['original_segments']['Row'];

// Forward Translations
export type ForwardTranslationInsert =
	Database['public']['Tables']['forward_translations']['Insert'];
export type ForwardTranslationRow = Database['public']['Tables']['forward_translations']['Row'];

// Accepted Translations
export type AcceptedTranslationInsert =
	Database['public']['Tables']['accepted_translations']['Insert'];
export type AcceptedTranslationRow = Database['public']['Tables']['accepted_translations']['Row'];

// Translation Progress
export type TranslationProgressInsert =
	Database['public']['Tables']['translation_progress']['Insert'];
export type TranslationProgressRow = Database['public']['Tables']['translation_progress']['Row'];

// Translation Reviews
export type TranslationReviewInsert = Database['public']['Tables']['translation_reviews']['Insert'];
export type TranslationReviewRow = Database['public']['Tables']['translation_reviews']['Row'];

export type TranslationVerificationData = {
	translationProgress: TranslationProgressRow | null;
	acceptedTranslation: AcceptedTranslationRow | null;
	forwardTranslations: Array<ForwardTranslationRow>;
};

export type TranslationVerificationMap = Record<number, TranslationVerificationData>;

export type SegmentData = {
	originalSegment: OriginalSegmentRow;
	translationProgress: TranslationProgressRow;
	forwardTranslation: ForwardTranslationRow | null;
	//translationReview: TranslationReviewRow | null;
	//relaventTranslations: ForwardTransaltionRow[] | null;
};

export type SegmentMap = Record<number, SegmentData>;
