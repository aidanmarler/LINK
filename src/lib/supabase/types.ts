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

export type LinkPreset =
	| 'ARChetype Disease CRF_Covid'
	| 'ARChetype Disease CRF_Dengue'
	| 'ARChetype Disease CRF_Mpox'
	| 'ARChetype Disease CRF_Mpox-Pregnancy&Paediatrics'
	| 'ARChetype Disease CRF_Mpox-Pregnancy&Paediatrics+extended'
	| 'ARChetype Disease CRF_H5Nx'
	| 'ARChetype Syndromic CRF_ARI'
	| 'UserGenerated_Oropouche'
	| 'Recommended Outcomes_Dengue'
	| 'Hospitalsed Outcomes_Dengue'
	| 'Early Stage Outcomes_Dengue'
	| 'Syndrome_VHF'
	| 'always-show'
	| 'Score_CharlsonCI'
	| 'Score_mSOFA'
	| 'Score_mSOFA_Dengue';
